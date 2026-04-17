import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import { mapUserProfile } from "@/lib/users";

type ActionRequest = {
  action?: unknown;
  rejectionReason?: unknown;
};

type ActionResponse = {
  success?: boolean;
  user?: ReturnType<typeof mapUserProfile>;
  deletedUserId?: string;
  error?: string;
};

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return null;
  }

  return session;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ActionResponse>> {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payload = (await request.json()) as ActionRequest;
    const action = typeof payload.action === "string" ? payload.action : "";

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be approve or reject" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      id,
      action === "approve"
        ? {
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: session.userId,
            rejectionReason: null,
          }
        : {
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: session.userId,
            rejectionReason:
              typeof payload.rejectionReason === "string" && payload.rejectionReason.trim()
                ? payload.rejectionReason.trim()
                : "Rejected by admin",
          },
      { new: true },
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: mapUserProfile(updatedUser),
    });
  } catch (error) {
    console.error("Profile moderation error:", error);
    return NextResponse.json(
      { error: "Could not update profile" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ActionResponse>> {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const deletedUser = await User.findByIdAndDelete(id).lean();
    if (!deletedUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deletedUserId: id,
    });
  } catch (error) {
    console.error("Profile delete error:", error);
    return NextResponse.json(
      { error: "Could not delete profile" },
      { status: 500 },
    );
  }
}



