import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import {
  DEFAULT_PASSWORD_IDS,
  isValidPasswordIds,
  type EmojiId,
} from "@/lib/emoji-password";
import GraphicalPassword from "@/lib/models/GraphicalPassword";

type PasswordResponse = {
  emojiIds: EmojiId[];
  source: "database" | "fallback";
  error?: string;
};

function fallbackPasswordResponse(error?: string): NextResponse<PasswordResponse> {
  return NextResponse.json({
    emojiIds: DEFAULT_PASSWORD_IDS,
    source: "fallback",
    error,
  });
}

export async function GET(): Promise<NextResponse<PasswordResponse>> {
  try {
    await connectToDatabase();

    const existing = await GraphicalPassword.findOne({ key: "default" }).lean();
    if (!existing || !isValidPasswordIds(existing.emojiIds)) {
      const seeded = await GraphicalPassword.findOneAndUpdate(
        { key: "default" },
        { key: "default", emojiIds: DEFAULT_PASSWORD_IDS },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();

      if (!seeded || !isValidPasswordIds(seeded.emojiIds)) {
        return fallbackPasswordResponse("Invalid password data in database");
      }

      return NextResponse.json({ emojiIds: seeded.emojiIds, source: "database" });
    }

    return NextResponse.json({ emojiIds: existing.emojiIds, source: "database" });
  } catch {
    return fallbackPasswordResponse("Database unavailable, using fallback password");
  }
}

type SetPasswordRequest = {
  emojiIds?: unknown;
};

export async function POST(request: Request): Promise<NextResponse> {
  const payload = (await request.json()) as SetPasswordRequest;

  if (!isValidPasswordIds(payload.emojiIds)) {
    return NextResponse.json(
      { error: "emojiIds must contain exactly 3 unique emoji IDs" },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();

    await GraphicalPassword.findOneAndUpdate(
      { key: "default" },
      { key: "default", emojiIds: payload.emojiIds },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ emojiIds: payload.emojiIds, source: "database" });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable, could not save password" },
      { status: 503 },
    );
  }
}

