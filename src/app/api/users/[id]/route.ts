import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission, hashPassword } from "@/lib/auth";
import { findUserById, updateUser } from "@/lib/db-service";
import { logActivity } from "@/lib/audit";
import { PermissionKey } from "@/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "users:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const existing = await findUserById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deactivating own account
    if (user?.userId === params.id && body.isActive === false) {
      return NextResponse.json(
        { success: false, message: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    if (Array.isArray(body.permissions)) {
      updateData.permissions = body.permissions as PermissionKey[];
    }

    if (body.password && body.password.length >= 6) {
      updateData.passwordHash = await hashPassword(body.password);
    }

    const updated = await updateUser(params.id, updateData);

    if (user) {
      await logActivity({
        user,
        action: "PERMISSIONS_UPDATED",
        details: `Updated user account and permissions for: "${existing.username}"`,
        relatedRecordId: params.id,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: `User "${existing.username}" updated successfully.`,
      user: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating user";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

