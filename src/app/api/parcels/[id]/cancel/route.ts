import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getParcelById, updateParcelStatus } from "@/lib/db-service";
import { logActivity } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "parcels:delete");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { reason } = body;

    const existing = await getParcelById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Parcel not found" },
        { status: 404 }
      );
    }

    if (existing.status === "Delivered") {
      return NextResponse.json(
        {
          success: false,
          message: "Delivered parcels cannot be cancelled.",
        },
        { status: 400 }
      );
    }

    const updated = await updateParcelStatus(params.id, "Returned to Warehouse", {
      updatedBy: user?.name || "Staff",
      reason: reason || "Cancelled by user",
      remarks: "Cancelled and marked as returned",
    });

    if (user) {
      await logActivity({
        user,
        action: "PARCEL_CANCELLED",
        details: `Cancelled parcel #${existing.parcelId}. Reason: ${reason || "Not specified"}`,
        relatedRecordId: existing.parcelId,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Parcel #${existing.parcelId} cancelled successfully.`,
      parcel: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error cancelling parcel";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
