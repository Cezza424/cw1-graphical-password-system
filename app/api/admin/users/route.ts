import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { ensureSeedUsers, mapUserProfile, type UserProfile } from "@/lib/users";

type AdminUsersResponse = {
  users: UserProfile[];
  source: "database";
  error?: string;
};

export async function GET(): Promise<NextResponse<AdminUsersResponse>> {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized", users: [], source: "database" }, { status: 401 });
    }

    await connectToDatabase();
    await ensureSeedUsers();

    const users = await User.find(
      { isAdmin: { $ne: true } },
      { username: 1, avatarUrl: 1, status: 1, reviewedAt: 1, rejectionReason: 1 },
    )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      users: users.map((user) => mapUserProfile(user)),
      source: "database",
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { users: [], source: "database", error: "Could not load profiles" },
      { status: 500 },
    );
  }
}

