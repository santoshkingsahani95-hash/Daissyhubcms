import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getCourierById,
  updateCourier,
  deleteCourier,
  getCourierLedger,
  getParcels,
  getSettlements,
} from "@/lib/db-service";
import { logActivity } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courier = await getCourierById(params.id);
    if (!courier) {
      return NextResponse.json(
        { success: false, message: "Courier company not found" },
        { status: 404 }
      );
    }

    const ledger = await getCourierLedger(params.id);
    const parcels = await getParcels({ courierId: params.id, limit: 10 });
    const settlements = await getSettlements({ courierId: params.id });

    return NextResponse.json({
      success: true,
      courier,
      ledger,
      recentParcels: parcels,
      recentSettlements: settlements,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching courier details";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "couriers:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const existing = await getCourierById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Courier company not found" },
        { status: 404 }
      );
    }

    const updated = await updateCourier(params.id, body);

    if (user) {
      await logActivity({
        user,
        action: "COURIER_UPDATED",
        details: `Updated courier company: "${existing.name}" (Status: ${updated?.isActive ? "Active" : "Inactive"})`,
        relatedRecordId: params.id,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Courier "${updated?.name}" updated successfully.`,
      courier: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating courier";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await checkAuthAndPermission(req, "couriers:manage");
    const existing = await getCourierById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Courier company not found" },
        { status: 404 }
      );
    }

    const deleted = await deleteCourier(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Failed to delete courier" },
        { status: 400 }
      );
    }

    if (user) {
      await logActivity({
        user,
        action: "COURIER_DELETED",
        details: `Deleted courier company: "${existing.name}"`,
        relatedRecordId: params.id,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Courier "${existing.name}" deleted successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting courier";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
