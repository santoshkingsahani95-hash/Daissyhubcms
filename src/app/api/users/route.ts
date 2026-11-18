import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission, hashPassword } from "@/lib/auth";
import {
  getAllUsers,
  createUser,
  findUserByUsername,
} from "@/lib/db-service";
import { logActivity } from "@/lib/audit";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { PermissionKey } from "@/types";

export async function GET(req: NextRequest) {
  const { errorResponse } = await checkAuthAndPermission(req, "users:manage");
  if (errorResponse) return errorResponse;

  try {
    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      users,
      availablePermissions: ALL_PERMISSIONS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching users";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "users:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, username, password, email, phone, role, permissions, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Full Name is required." },
        { status: 400 }
      );
    }

    const cleanUsername = (username || "").trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      return NextResponse.json(
        { success: false, message: "Username must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await findUserByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Username "${cleanUsername}" is already taken.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userRole = (role === "admin" || (role as string) === "superadmin") && (user?.role === "admin" || (user?.role as string) === "superadmin") ? "admin" : "staff";

    // Staff accounts must only receive explicit permissions (never full access by default)
    const assignedPermissions: PermissionKey[] = Array.isArray(permissions) ? permissions : [];

    const newUser = await createUser({
      name: name.trim(),
      username: cleanUsername,
      passwordHash,
      email: email?.trim(),
      phone: phone?.trim(),
      role: userRole,
      permissions: userRole === "admin" ? ALL_PERMISSIONS.map((p) => p.key) : assignedPermissions,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    if (user) {
      await logActivity({
        user,
        action: "USER_CREATED",
        details: `Created new ${userRole} account: "${cleanUsername}" with ${assignedPermissions.length} permissions`,
        relatedRecordId: String(newUser._id),
        req,
      });
    }

    const { passwordHash: _, ...safeUser } = newUser as unknown as Record<string, unknown>;

    return NextResponse.json(
      {
        success: true,
        message: `User account "${cleanUsername}" created successfully.`,
        user: safeUser,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating user";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

