import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import {
  DEFAULT_PASSWORD_IDS,
  isValidPasswordIds,
  type EmojiId,
} from "@/lib/emoji-password";
import User from "@/lib/models/User";
import { ensureSeedUsers, isObjectId } from "@/lib/users";

type PasswordResponse = {
  userId: string;
  emojiIds: EmojiId[];
  source: "database" | "fallback";
  error?: string;
};

function fallbackPasswordResponse(userId: string, error?: string): NextResponse<PasswordResponse> {
  return NextResponse.json({
    userId,
    emojiIds: DEFAULT_PASSWORD_IDS,
    source: "fallback",
    error,
  });
}

export async function GET(request: Request): Promise<NextResponse<PasswordResponse>> {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId || !isObjectId(userId)) {
    return NextResponse.json(
      { error: "userId query parameter is required" },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    await ensureSeedUsers();

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!isValidPasswordIds(user.emojiIds)) {
      const seeded = await User.findByIdAndUpdate(
        userId,
        { emojiIds: DEFAULT_PASSWORD_IDS },
        { new: true },
      ).lean();

      if (!seeded || !isValidPasswordIds(seeded.emojiIds)) {
        return fallbackPasswordResponse(userId, "Invalid password data in database");
      }

      return NextResponse.json({
        userId,
        emojiIds: seeded.emojiIds,
        source: "database",
      });
    }

    return NextResponse.json({ userId, emojiIds: user.emojiIds, source: "database" });
  } catch {
    return fallbackPasswordResponse(userId, "Database unavailable, using fallback password");
  }
}

type SetPasswordRequest = {
  userId?: string;
  emojiIds?: unknown;
};

export async function POST(request: Request): Promise<NextResponse> {
  const payload = (await request.json()) as SetPasswordRequest;

  if (!payload.userId || !isObjectId(payload.userId)) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (!isValidPasswordIds(payload.emojiIds)) {
    return NextResponse.json(
      { error: "emojiIds must contain exactly 3 unique emoji IDs" },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    await ensureSeedUsers();

    const updated = await User.findByIdAndUpdate(
      payload.userId,
      { emojiIds: payload.emojiIds },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: payload.userId,
      emojiIds: payload.emojiIds,
      source: "database",
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable, could not save password" },
      { status: 503 },
    );
  }
}

