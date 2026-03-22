import { connectToDatabase } from "@/lib/db";
import { createToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Find admin user
    const user = await User.findOne({ username, isAdmin: true });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password
    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Create session token
    const token = await createToken({
      userId: user._id.toString(),
      username: user.username,
      isAdmin: true,
    });

    // Set session cookie
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          username: user.username,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

