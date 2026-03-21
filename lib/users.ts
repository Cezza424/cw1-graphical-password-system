import { Types } from "mongoose";
import { isValidPasswordIds, type EmojiId } from "@/lib/emoji-password";
import User from "@/lib/models/User";
import seedUsers from "@/lib/seed-users.json";

export type SeedUser = {
  username: string;
  avatarUrl: string;
  emojiIds: EmojiId[];
};

export type UserProfile = {
  id: string;
  username: string;
  avatarUrl: string;
};

function toSeedUser(entry: (typeof seedUsers)[number]): SeedUser {
  if (!isValidPasswordIds(entry.emojiIds)) {
    throw new Error(`Invalid seed password for user: ${entry.username}`);
  }

  return {
    username: entry.username,
    avatarUrl: entry.avatarUrl,
    emojiIds: entry.emojiIds,
  };
}

export const SEEDED_USERS: SeedUser[] = seedUsers.map(toSeedUser);

export async function ensureSeedUsers(): Promise<void> {
  for (const profile of SEEDED_USERS) {
    await User.findOneAndUpdate(
      { username: profile.username },
      {
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        emojiIds: profile.emojiIds,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
}

export function isObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

export function mapUserProfile(user: {
  _id: Types.ObjectId;
  username: string;
  avatarUrl: string;
}): UserProfile {
  return {
    id: user._id.toString(),
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

