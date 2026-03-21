const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

async function run() {
  const usersResponse = await fetch(`${baseUrl}/api/users`, {
    headers: { Accept: "application/json" },
  });

  if (!usersResponse.ok) {
    throw new Error(`GET /api/users failed with ${usersResponse.status}`);
  }

  const usersData = await usersResponse.json();
  if (!Array.isArray(usersData.users) || usersData.users.length === 0) {
    throw new Error("Expected users from API");
  }

  const selectedUser = usersData.users[0];
  if (!selectedUser?.id) {
    throw new Error("Expected selected user id from API");
  }

  const passwordResponse = await fetch(
    `${baseUrl}/api/password?userId=${encodeURIComponent(selectedUser.id)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!passwordResponse.ok) {
    throw new Error(`GET /api/password failed with ${passwordResponse.status}`);
  }

  const data = await passwordResponse.json();
  if (!Array.isArray(data.emojiIds) || data.emojiIds.length !== 3) {
    throw new Error("Expected 3 emoji IDs from API");
  }

  const reversedSelection = [...data.emojiIds].reverse();

  const verifyResponse = await fetch(`${baseUrl}/api/password/verify`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: selectedUser.id,
      emojiIds: reversedSelection,
    }),
  });

  if (!verifyResponse.ok) {
    throw new Error(`POST /api/password/verify failed with ${verifyResponse.status}`);
  }

  const verifyData = await verifyResponse.json();
  if (verifyData.isMatch !== true) {
    throw new Error("Server-side any-order verification failed");
  }

  // Warn if using fallback instead of database
  if (data.source === "fallback" && data.error) {
    console.warn("⚠️  Warning: Using fallback password");
    console.warn(`   Reason: ${data.error}`);
    console.warn("   Check that MONGODB_URI is configured in .env.local");
  }

  console.log("✅ Smoke test passed:");
  console.log(`   - Selected user: ${selectedUser.username ?? selectedUser.id}`);
  console.log(`   - Source: ${verifyData.source ?? data.source ?? "unknown"}`);
  console.log(`   - Password IDs: ${data.emojiIds.join(", ")}`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

