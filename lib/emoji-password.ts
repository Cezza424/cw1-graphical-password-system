export type EmojiId =
  | "cat"
  | "dog"
  | "rocket"
  | "star"
  | "apple"
  | "car"
  | "ball"
  | "book"
  | "sun";

export type EmojiTile = {
  id: EmojiId;
  emoji: string;
};

export const EMOJI_TILES: EmojiTile[] = [
  { id: "cat", emoji: "🐱" },
  { id: "dog", emoji: "🐶" },
  { id: "rocket", emoji: "🚀" },
  { id: "star", emoji: "⭐" },
  { id: "apple", emoji: "🍎" },
  { id: "car", emoji: "🚗" },
  { id: "ball", emoji: "⚽" },
  { id: "book", emoji: "📚" },
  { id: "sun", emoji: "🌞" },
];

export const DEFAULT_PASSWORD_IDS: EmojiId[] = ["dog", "star", "car"];

const EMOJI_ID_SET = new Set(EMOJI_TILES.map((tile) => tile.id));

export function shuffleTiles(tiles: EmojiTile[]): EmojiTile[] {
  const copy = [...tiles];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

export function isPasswordMatchAnyOrder(
  selectedIds: EmojiId[],
  passwordIds: EmojiId[],
): boolean {
  if (selectedIds.length !== passwordIds.length) {
    return false;
  }

  const selectedSorted = [...selectedIds].sort();
  const passwordSorted = [...passwordIds].sort();

  return selectedSorted.every((id, index) => id === passwordSorted[index]);
}

export function isValidPasswordIds(ids: unknown): ids is EmojiId[] {
  if (!Array.isArray(ids) || ids.length !== 3) {
    return false;
  }

  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== 3) {
    return false;
  }

  return ids.every((id) => typeof id === "string" && EMOJI_ID_SET.has(id as EmojiId));
}

