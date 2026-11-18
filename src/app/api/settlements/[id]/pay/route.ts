import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { recordSettlementPayment } from "@/lib/db-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "payments:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      cashAmount,
      onlineAmount,
      onlineMethod,
      paymentDate,
      referenceNumber,
      remarks,
    } = body;

    const result = await recordSettlementPayment({
      settlementId: params.id,
      cashAmount: Number(cashAmount) || 0,
      onlineAmount: Number(onlineAmount) || 0,
      onlineMethod: onlineMethod || "Bank Transfer",
      paymentDate,
      referenceNumber,
      remarks,
      recordedBy: user?.name || "Admin",
    });

    return NextResponse.json({
      success: true,
      message: `Payment of Rs. ${result.payment.amount.toLocaleString("en-IN")} recorded for ${result.settlement.settlementNumber}. Remaining Due: Rs. ${result.settlement.remainingDue.toLocaleString("en-IN")}`,
      settlement: result.settlement,
      payment: result.payment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error recording settlement payment";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

