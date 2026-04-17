import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { isValidPasswordIds, type EmojiId } from "@/lib/emoji-password";
import User from "@/lib/models/User";
import { mapUserProfile } from "@/lib/users";

type RegisterRequest = {
  username?: unknown;
  avatarUrl?: unknown;
  emojiIds?: unknown;
};

type RegisterResponse = {
  success?: boolean;
  status?: "pending";
  user?: ReturnType<typeof mapUserProfile>;
  error?: string;
};

function buildAvatarUrl(username: string, avatarUrl?: string): string {
  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    return avatarUrl.trim();
  }

  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(username)}`;
}

export async function POST(request: Request): Promise<NextResponse<RegisterResponse>> {
  try {
    const payload = (await request.json()) as RegisterRequest;

    const username = typeof payload.username === "string" ? payload.username.trim() : "";
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: "Username must be between 3 and 30 characters" },
        { status: 400 },
      );
    }

    if (!isValidPasswordIds(payload.emojiIds)) {
      return NextResponse.json(
        { error: "emojiIds must contain exactly 3 unique emoji IDs" },
        { status: 400 },
      );
    }

    const avatarUrl = buildAvatarUrl(
      username,
      typeof payload.avatarUrl === "string" ? payload.avatarUrl : undefined,
    );

    await connectToDatabase();

    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      return NextResponse.json(
        { error: "That username is already in use" },
        { status: 409 },
      );
    }

    const createdUser = await User.create({
      username,
      avatarUrl,
      emojiIds: payload.emojiIds as EmojiId[],
      status: "pending",
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      isAdmin: false,
      passwordHash: null,
    });

    return NextResponse.json(
      {
        success: true,
        status: "pending",
        user: mapUserProfile(createdUser),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Could not create registration request" },
      { status: 500 },
    );
  }
}

