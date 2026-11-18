import { NextRequest, NextResponse } from "next/server";
import { getCourierLedger, getCouriers } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courierId = searchParams.get("courierId");
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    if (!courierId) {
      const couriers = await getCouriers();
      if (couriers.length === 0) {
        return NextResponse.json({ success: true, ledger: null });
      }
      // Default to first courier
      const firstCourier = couriers[0];
      const ledger = await getCourierLedger(firstCourier._id, startDate, endDate);
      return NextResponse.json({ success: true, ledger, couriers });
    }

    const ledger = await getCourierLedger(courierId, startDate, endDate);
    const couriers = await getCouriers();
    return NextResponse.json({ success: true, ledger, couriers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching ledger";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
