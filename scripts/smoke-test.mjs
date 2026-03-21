const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

function isMatchAnyOrder(selectedIds, passwordIds) {
  if (!Array.isArray(selectedIds) || !Array.isArray(passwordIds)) {
    return false;
  }

  if (selectedIds.length !== passwordIds.length) {
    return false;
  }

  const selectedSorted = [...selectedIds].sort();
  const passwordSorted = [...passwordIds].sort();

  return selectedSorted.every((id, index) => id === passwordSorted[index]);
}

async function run() {
  const response = await fetch(`${baseUrl}/api/password`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`GET /api/password failed with ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.emojiIds) || data.emojiIds.length !== 3) {
    throw new Error("Expected 3 emoji IDs from API");
  }

  const reversedSelection = [...data.emojiIds].reverse();
  if (!isMatchAnyOrder(reversedSelection, data.emojiIds)) {
    throw new Error("Any-order match check failed");
  }

  console.log("Smoke test passed:");
  console.log(`- Source: ${data.source ?? "unknown"}`);
  console.log(`- Password IDs: ${data.emojiIds.join(", ")}`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

