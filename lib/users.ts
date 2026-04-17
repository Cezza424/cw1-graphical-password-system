import { Types } from "mongoose";
import { isValidPasswordIds, type EmojiId } from "@/lib/emoji-password";
import type { UserApprovalStatus } from "@/lib/models/User";
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
  status: UserApprovalStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

function normalizeUserStatus(status?: string | null): UserApprovalStatus {
  if (status === "pending" || status === "approved" || status === "rejected") {
    return status;
  }

  return "approved";
}

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
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: null,
        rejectionReason: null,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
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
  status?: string | null;
  reviewedAt?: Date | string | null;
  rejectionReason?: string | null;
}): UserProfile {
  return {
    id: user._id.toString(),
    username: user.username,
    avatarUrl: user.avatarUrl,
    status: normalizeUserStatus(user.status),
    reviewedAt: user.reviewedAt ? new Date(user.reviewedAt).toISOString() : null,
    rejectionReason: user.rejectionReason ?? null,
  };
}

export function isApprovedStatus(status?: string | null): boolean {
  return normalizeUserStatus(status) === "approved";
}

export function getApprovedProfiles(users: Array<{
  _id: Types.ObjectId;
  username: string;
  avatarUrl: string;
  status?: string | null;
  reviewedAt?: Date | string | null;
  rejectionReason?: string | null;
}>): UserProfile[] {
  return users.filter((user) => isApprovedStatus(user.status)).map(mapUserProfile);
}

