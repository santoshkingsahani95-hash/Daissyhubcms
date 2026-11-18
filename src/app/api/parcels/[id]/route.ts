import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getParcelById, updateParcelRecord, updateParcelStatus } from "@/lib/db-service";
import { logActivity } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parcel = await getParcelById(params.id);
    if (!parcel) {
      return NextResponse.json(
        { success: false, message: "Parcel not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, parcel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching parcel";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "parcels:edit");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const existing = await getParcelById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Parcel not found" },
        { status: 404 }
      );
    }

    const updated = await updateParcelRecord(params.id, body, user);

    if (user) {
      await logActivity({
        user,
        action: "PARCEL_UPDATED",
        details: `Updated parcel #${existing.parcelId} (Status: ${updated?.status})`,
        relatedRecordId: existing.parcelId,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Parcel #${existing.parcelId} updated successfully.`,
      parcel: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating parcel";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
