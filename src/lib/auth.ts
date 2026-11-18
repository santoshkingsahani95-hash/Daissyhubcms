import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { PermissionKey, UserRole } from "@/types";
import { hasPermission } from "./permissions";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_dev_382947192847";
const COOKIE_NAME = "courier_erp_token";

export interface SessionUser {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  permissions: PermissionKey[];
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      name: user.name,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = req.cookies.get(COOKIE_NAME)?.value;
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // Cookies not accessible
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function checkAuthAndPermission(
  req: NextRequest,
  requiredPermission?: PermissionKey
): Promise<{ user: SessionUser | null; errorResponse: NextResponse | null }> {
  const session = await getSession(req);

  if (!session) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }

  if (requiredPermission && !hasPermission(session, requiredPermission)) {
    return {
      user: session,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: `Forbidden: Missing required permission [${requiredPermission}].`,
        },
        { status: 403 }
      ),
    };
  }

  return { user: session, errorResponse: null };
}

