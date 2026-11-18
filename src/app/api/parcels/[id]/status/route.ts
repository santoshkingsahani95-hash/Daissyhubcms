import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { updateParcelStatus } from "@/lib/db-service";
import { ParcelStatus } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "delivery:update");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { status, reason, remarks } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    const updated = await updateParcelStatus(params.id, status as ParcelStatus, {
      updatedBy: user?.name || "Admin",
      reason,
      remarks,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Parcel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Parcel status updated to ${status}`,
      parcel: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating parcel status";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
