const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

const ALL_EMOJI_IDS = ["cat", "dog", "rocket", "star", "apple", "car", "ball", "book", "sun"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeMismatchedSelection(correctIds) {
  const replacement = ALL_EMOJI_IDS.find((id) => !correctIds.includes(id));
  if (!replacement) {
    throw new Error("Could not build mismatched selection");
  }

  return [replacement, correctIds[1], correctIds[2]];
}

async function run() {
  const usersResponse = await fetch(`${baseUrl}/api/users`, {
    headers: { Accept: "application/json" },
  });
  assert(usersResponse.ok, `GET /api/users failed: ${usersResponse.status}`);

  const usersData = await usersResponse.json();
  const selectedUser = usersData.users?.[0];
  assert(selectedUser?.id, "Expected at least one user with id");

  if (!/^[a-f\d]{24}$/i.test(selectedUser.id)) {
    throw new Error("Route-level verify tests require database-backed users (ObjectId ids)");
  }

  const passwordResponse = await fetch(
    `${baseUrl}/api/password?userId=${encodeURIComponent(selectedUser.id)}`,
    {
      headers: { Accept: "application/json" },
    },
  );
  assert(passwordResponse.ok, `GET /api/password failed: ${passwordResponse.status}`);

  const passwordData = await passwordResponse.json();
  const correctIds = passwordData.emojiIds;
  assert(Array.isArray(correctIds) && correctIds.length === 3, "Expected 3 emojiIds");

  const successResponse = await fetch(`${baseUrl}/api/password/verify`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: selectedUser.id,
      emojiIds: [...correctIds].reverse(),
    }),
  });
  assert(successResponse.ok, `POST /api/password/verify success case failed: ${successResponse.status}`);
  const successData = await successResponse.json();
  assert(successData.isMatch === true, "Expected isMatch=true for reordered correct password");

  const mismatchResponse = await fetch(`${baseUrl}/api/password/verify`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: selectedUser.id,
      emojiIds: makeMismatchedSelection(correctIds),
    }),
  });
  assert(mismatchResponse.ok, `POST /api/password/verify mismatch case failed: ${mismatchResponse.status}`);
  const mismatchData = await mismatchResponse.json();
  assert(mismatchData.isMatch === false, "Expected isMatch=false for mismatched password");

  let rateLimited = false;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/password/verify`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: selectedUser.id,
        emojiIds: makeMismatchedSelection(correctIds),
      }),
    });

    if (response.status === 429) {
      const body = await response.json();
      assert(
        typeof body.retryAfterSeconds === "number" && body.retryAfterSeconds > 0,
        "Expected retryAfterSeconds in 429 response",
      );
      rateLimited = true;
      break;
    }
  }

  assert(rateLimited, "Expected verify endpoint to return 429 after repeated attempts");

  console.log("✅ /api/password/verify route test passed");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
