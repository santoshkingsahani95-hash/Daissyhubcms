import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getReturns,
  searchParcelsForReturn,
  processReturnInward,
  processBulkReturnInward,
  cancelReturnInward,
} from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const query = searchParams.get("q") || searchParams.get("search");

  // Search parcels eligible for return
  if (action === "search" || query) {
    try {
      const parcels = await searchParcelsForReturn(query || "");
      return NextResponse.json({ success: true, parcels });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error searching parcels for return";
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  }

  // Get processed returns list
  const courierId = searchParams.get("courierId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const returns = await getReturns({ courierId, startDate, endDate });
    return NextResponse.json({ success: true, returns });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching returns";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "returns:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();

    // Cancel return action via POST
    if (body.action === "cancel" || body.action === "revert") {
      const { returnId, parcelId, reason } = body;
      if (!returnId && !parcelId) {
        return NextResponse.json(
          { success: false, message: "Either returnId or parcelId is required." },
          { status: 400 }
        );
      }
      const result = await cancelReturnInward({
        returnId,
        parcelId,
        cancelledBy: user?.name || "Admin",
        reason,
      });
      return NextResponse.json({
        success: true,
        message: result.message,
        parcel: result.parcel,
      });
    }

    // Bulk return processing by Courier and Batch
    if (body.action === "bulk" || Array.isArray(body.returns)) {
      const { courierId, batchId, returnDate, returns } = body;
      if (!returns || !Array.isArray(returns) || returns.length === 0) {
        return NextResponse.json(
          { success: false, message: "Please provide at least one parcel to return." },
          { status: 400 }
        );
      }

      const result = await processBulkReturnInward({
        courierId,
        batchId,
        returnDate,
        processedBy: user?.name || "Admin",
        returns,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${result.successCount} returned parcel(s) for warehouse inward.`,
        ...result,
      });
    }

    const { parcelId, returnReason, returnCharge, notes } = body;

    if (!parcelId || !parcelId.trim()) {
      return NextResponse.json(
        { success: false, message: "Parcel ID is required." },
        { status: 400 }
      );
    }

    if (!returnReason || !returnReason.trim()) {
      return NextResponse.json(
        { success: false, message: "Return reason is required." },
        { status: 400 }
      );
    }

    const result = await processReturnInward({
      parcelId: parcelId.trim(),
      returnReason: returnReason.trim(),
      processedBy: user?.name || "Admin",
      returnCharge: returnCharge !== undefined ? Number(returnCharge) : undefined,
      notes: notes?.trim() || "",
    });

    return NextResponse.json({
      success: true,
      message: `Parcel ${result.updatedParcel.parcelId} successfully marked as Returned to Warehouse.`,
      returnRecord: result.returnRecord,
      parcel: result.updatedParcel,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error processing return";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "returns:manage");
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const returnId = searchParams.get("returnId") || undefined;
  const parcelId = searchParams.get("parcelId") || undefined;
  const reason = searchParams.get("reason") || undefined;

  if (!returnId && !parcelId) {
    return NextResponse.json(
      { success: false, message: "Either returnId or parcelId is required to cancel return." },
      { status: 400 }
    );
  }

  try {
    const result = await cancelReturnInward({
      returnId,
      parcelId,
      cancelledBy: user?.name || "Admin",
      reason,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      parcel: result.parcel,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error cancelling return";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

