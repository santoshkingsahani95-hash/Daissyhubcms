import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession(req);

  if (session) {
    await logActivity({
      user: session,
      action: "USER_LOGOUT",
      details: `User ${session.username} logged out`,
      req,
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  clearSessionCookie(response);
  return response;
}

