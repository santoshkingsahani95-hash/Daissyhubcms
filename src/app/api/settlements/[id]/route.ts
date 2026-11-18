import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getSettlementWithManifest,
  getSettlementById,
  getCourierById,
  getCompanySettings,
  deleteSettlement,
} from "@/lib/db-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getSettlementWithManifest(params.id);
    if (!data) {
      return NextResponse.json(
        { success: false, message: "Settlement statement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settlement: data.settlement,
      courier: data.courier,
      settings: data.settings,
      deliveredParcels: data.deliveredParcels,
      returnedParcels: data.returnedParcels,
      batchBreakdown: data.batchBreakdown,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching settlement details";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "settlements:manage");
  if (errorResponse) return errorResponse;

  // STRICT ADMIN ROLE ENFORCEMENT: Only admin can delete settlement statements
  if (user?.role !== "admin") {
    return NextResponse.json(
      {
        success: false,
        message: "Forbidden: Only Admin users are authorized to delete settlement statements.",
      },
      { status: 403 }
    );
  }

  try {
    const result = await deleteSettlement(params.id, user?.name || "Admin");
    return NextResponse.json({
      success: true,
      message: `Settlement statement ${result.settlementNumber} deleted successfully. ${result.parcelsUnlockedCount} parcels unlocked and returned to unsettled pool.`,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting settlement statement";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

