import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  const user = await findUserById(session.userId);
  if (!user || !user.isActive) {
    return NextResponse.json(
      { success: false, message: "User not found or deactivated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      userId: String(user._id),
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions || [],
    },
  });
}

