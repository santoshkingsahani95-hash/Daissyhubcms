import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getSettlements,
  finalizeSettlement,
  getCompanySettings,
} from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courierId = searchParams.get("courierId") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const settlements = await getSettlements({ courierId, status, search });
    return NextResponse.json({ success: true, settlements });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching settlements";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "settlements:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      courierId,
      startDate,
      endDate,
      batchId,
      includeSettled,
      paymentReceived,
      cashReceived,
      onlineReceived,
      paymentMethod,
      paymentReference,
      notes,
      authorizedBy,
    } = body;

    if (!courierId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: "courierId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const settings = await getCompanySettings();

    const settlement = await finalizeSettlement({
      courierId,
      startDate,
      endDate,
      batchId,
      includeSettled: includeSettled !== undefined ? Boolean(includeSettled) : true,
      paymentReceived: Number(paymentReceived) || 0,
      cashReceived: Number(cashReceived) || 0,
      onlineReceived: Number(onlineReceived) || 0,
      paymentMethod: paymentMethod || "Bank Transfer",
      paymentReference: paymentReference || "",
      notes: notes || "",
      preparedBy: user?.name || "Admin",
      authorizedBy: authorizedBy || settings.signatoryNameTitle || "Santosh Mukhiya (Finance Manager)",
    });

    return NextResponse.json({
      success: true,
      message: `Settlement ${settlement.settlementNumber} finalized successfully.`,
      settlement,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error finalizing settlement";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
