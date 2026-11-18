import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { bulkUpdateParcelStatus } from "@/lib/db-service";
import { ParcelStatus } from "@/types";

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "delivery:update");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { parcelIds, status, reason, remarks } = body;

    if (!parcelIds || !Array.isArray(parcelIds) || parcelIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No parcels selected for status update." },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Target status is required." },
        { status: 400 }
      );
    }

    const result = await bulkUpdateParcelStatus(parcelIds, status as ParcelStatus, {
      updatedBy: user?.name || "Admin",
      reason,
      remarks,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.updatedCount} parcels to "${status}".`,
      updatedCount: result.updatedCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating parcel statuses";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

