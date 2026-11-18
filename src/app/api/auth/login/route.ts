import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/db-service";
import { signToken, setSessionCookie, SessionUser } from "@/lib/auth";
import { UserRole, PermissionKey } from "@/types";
import { logActivity } from "@/lib/audit";
import { ensureInitialSeed } from "@/lib/seed-data";

export async function POST(req: NextRequest) {
  try {
    await ensureInitialSeed();

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required." },
        { status: 400 }
      );
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "This account has been deactivated. Contact admin." },
        { status: 403 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password." },
        { status: 401 }
      );
    }

    const sessionPayload: SessionUser = {
      userId: String(user._id),
      name: user.name,
      username: user.username,
      role: (user.role as UserRole) || "admin",
      permissions: (user.permissions || []) as PermissionKey[],
    };

    const token = signToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: sessionPayload,
    });

    setSessionCookie(response, token);

    await logActivity({
      user: sessionPayload,
      action: "USER_LOGIN",
      details: `User ${user.username} logged in successfully`,
      req,
    });

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

