import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import {
  DEFAULT_PASSWORD_IDS,
  isPasswordMatchAnyOrder,
  isValidPasswordIds,
} from "@/lib/emoji-password";
import User from "@/lib/models/User";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ensureSeedUsers, isApprovedStatus, isObjectId } from "@/lib/users";

type VerifyPasswordRequest = {
  userId?: string;
  emojiIds?: unknown;
};

type VerifyPasswordResponse = {
  isMatch: boolean;
  source: "database" | "fallback";
  retryAfterSeconds?: number;
  error?: string;
};

function getClientAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return "unknown";
  }

  const [firstAddress] = forwardedFor.split(",");
  return firstAddress.trim() || "unknown";
}

function invalidPayload(): NextResponse<VerifyPasswordResponse> {
  return NextResponse.json(
    {
      isMatch: false,
      source: "fallback",
      error: "userId and exactly 3 unique emojiIds are required",
    },
    { status: 400 },
  );
}

export async function POST(request: Request): Promise<NextResponse<VerifyPasswordResponse>> {
  const payload = (await request.json()) as VerifyPasswordRequest;

  if (!payload.userId || !isObjectId(payload.userId) || !isValidPasswordIds(payload.emojiIds)) {
    return invalidPayload();
  }

  const selectedEmojiIds = payload.emojiIds;

  const clientAddress = getClientAddress(request);
  const key = `password-verify:${clientAddress}:${payload.userId}`;
  const limit = consumeRateLimit(key, {
    windowMs: 60_000,
    maxAttempts: 8,
    lockoutMs: 60_000,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      {
        isMatch: false,
        source: "fallback",
        retryAfterSeconds: limit.retryAfterSeconds,
        error: "Too many attempts",
      },
      { status: 429 },
    );
  }

  try {
    await connectToDatabase();
    await ensureSeedUsers();

    const user = await User.findById(payload.userId).lean();
    if (!user) {
      return NextResponse.json(
        {
          isMatch: false,
          source: "database",
          error: "User not found",
        },
        { status: 404 },
      );
    }

    if (!isApprovedStatus(user.status)) {
      return NextResponse.json(
        {
          isMatch: false,
          source: "database",
          error: "User is not approved",
        },
        { status: 403 },
      );
    }

    if (!isValidPasswordIds(user.emojiIds)) {
      return NextResponse.json(
        {
          isMatch: false,
          source: "database",
          error: "User password is invalid",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      isMatch: isPasswordMatchAnyOrder(selectedEmojiIds, user.emojiIds),
      source: "database",
    });
  } catch {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {
          isMatch: false,
          source: "database",
          error: "Database unavailable, cannot verify password",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      isMatch: isPasswordMatchAnyOrder(selectedEmojiIds, DEFAULT_PASSWORD_IDS),
      source: "fallback",
      error: "Database unavailable, verified with fallback password",
    });
  }
}
