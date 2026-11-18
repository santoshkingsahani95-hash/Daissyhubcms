import { NextRequest, NextResponse } from "next/server";
import { previewSettlement } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courierId = searchParams.get("courierId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const batchId = searchParams.get("batchId") || undefined;
  const includeSettled = searchParams.get("includeSettled") === "true";

  if (!courierId || !startDate || !endDate) {
    return NextResponse.json(
      { success: false, message: "courierId, startDate, and endDate are required" },
      { status: 400 }
    );
  }

  try {
    const preview = await previewSettlement({
      courierId,
      startDate,
      endDate,
      batchId,
      includeSettled,
    });

    return NextResponse.json({ success: true, preview });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error generating settlement preview";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

