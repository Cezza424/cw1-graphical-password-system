import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { ensureSeedUsers, mapUserProfile, type UserProfile } from "@/lib/users";

type UsersResponse = {
  users: UserProfile[];
  source: "database" | "fallback";
  error?: string;
};

const FALLBACK_USERS: UserProfile[] = [
  {
    id: "fallback-user",
    username: "demo",
    avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=demo",
    status: "approved",
    reviewedAt: null,
    rejectionReason: null,
  },
];

export async function GET(): Promise<NextResponse<UsersResponse>> {
  try {
    await connectToDatabase();
    await ensureSeedUsers();

    const users = await User.find(
      {
        isAdmin: { $ne: true },
        $or: [{ status: "approved" }, { status: { $exists: false } }],
      },
      { username: 1, avatarUrl: 1, status: 1, reviewedAt: 1, rejectionReason: 1 },
    )
      .sort({ username: 1 })
      .limit(25)
      .lean();

    return NextResponse.json({
      users: users.map((user) => mapUserProfile(user)),
      source: "database",
    });
  } catch {
    return NextResponse.json({
      users: FALLBACK_USERS,
      source: "fallback",
      error: "Database unavailable, using fallback user",
    });
  }
}

