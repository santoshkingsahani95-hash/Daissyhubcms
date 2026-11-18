import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getBatchById, getParcels, updateBatchWithParcels } from "@/lib/db-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await getBatchById(params.id);
    if (!batch) {
      return NextResponse.json(
        { success: false, message: "Batch not found" },
        { status: 404 }
      );
    }
    const parcels = await getParcels({ batchId: batch.batchId });
    return NextResponse.json({ success: true, batch, parcels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching batch";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "parcels:create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { batchData, parcels } = body;

    if (!parcels || !Array.isArray(parcels) || parcels.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one parcel is required in the batch." },
        { status: 400 }
      );
    }

    const result = await updateBatchWithParcels(
      params.id,
      batchData || {},
      parcels,
      user?.name || "Admin"
    );

    return NextResponse.json({
      success: true,
      message: `Batch ${result.batch.batchId} updated successfully.`,
      batch: result.batch,
      parcels: result.parcels,
      parcelsCount: result.parcels.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating batch";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

