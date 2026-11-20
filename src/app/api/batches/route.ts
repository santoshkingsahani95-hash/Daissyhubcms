import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getBatches,
  getNextBatchId,
  createBatchWithParcels,
  updateBatchWithParcels,
  getCourierById,
} from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "next-id") {
    const courierId = searchParams.get("courierId") || undefined;
    const courierName = searchParams.get("courierName") || undefined;
    const date = searchParams.get("date") || undefined;
    const nextId = await getNextBatchId(courierId, date, courierName);
    return NextResponse.json({ success: true, nextBatchId: nextId });
  }

  const courierId = searchParams.get("courierId") || undefined;
  const status = searchParams.get("status") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const batches = await getBatches({ courierId, status, startDate, endDate });
    return NextResponse.json({ success: true, batches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching batches";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "parcels:create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { courierId, dispatchDate, serviceArea, notes, batchId, parcels } = body;

    if (!courierId) {
      return NextResponse.json(
        { success: false, message: "Courier selection is required." },
        { status: 400 }
      );
    }

    if (!parcels || !Array.isArray(parcels) || parcels.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one parcel is required in the batch." },
        { status: 400 }
      );
    }

    const courier = await getCourierById(courierId);
    if (!courier) {
      return NextResponse.json(
        { success: false, message: "Selected courier was not found." },
        { status: 404 }
      );
    }

    // Filter valid rows
    const validParcels = parcels.filter(
      (p) => p.customerName && p.customerName.trim() && p.customerPhone && p.customerPhone.trim()
    );

    if (validParcels.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please fill in Customer Name and Mobile Number for at least one parcel." },
        { status: 400 }
      );
    }

    const result = await createBatchWithParcels(
      {
        courierId,
        courierName: courier.name,
        dispatchDate: dispatchDate || new Date().toISOString().split("T")[0],
        serviceArea: serviceArea || "Inside Valley",
        notes: notes || "",
        batchId: batchId || undefined,
      },
      validParcels,
      user?.name || "Admin"
    );

    return NextResponse.json(
      {
        success: true,
        message: `Batch ${result.batch.batchId} saved successfully with ${result.parcels.length} parcels.`,
        batch: result.batch,
        parcelsCount: result.parcels.length,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating batch";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "parcels:create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { batchId, batchData, parcels } = body;

    if (!batchId) {
      return NextResponse.json(
        { success: false, message: "batchId is required for editing batch details." },
        { status: 400 }
      );
    }

    if (!parcels || !Array.isArray(parcels) || parcels.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one parcel is required in the batch." },
        { status: 400 }
      );
    }

    const result = await updateBatchWithParcels(
      batchId,
      batchData || {},
      parcels,
      user?.name || "Admin"
    );

    return NextResponse.json({
      success: true,
      message: `Batch ${result.batch.batchId} updated successfully with ${result.parcels.length} parcels. Total COD: Rs. ${result.batch.totalCodAmount.toLocaleString("en-IN")}`,
      batch: result.batch,
      parcels: result.parcels,
      parcelsCount: result.parcels.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating batch details";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
