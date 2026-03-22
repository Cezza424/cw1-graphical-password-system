import { clearSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

