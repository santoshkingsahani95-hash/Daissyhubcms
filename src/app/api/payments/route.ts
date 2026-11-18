import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getPayments, recordPayment } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courierId = searchParams.get("courierId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const payments = await getPayments({ courierId, startDate, endDate });
    return NextResponse.json({ success: true, payments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching payments";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "payments:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { courierId, amount, paymentDate, paymentMethod, referenceNumber, remarks } = body;

    if (!courierId || !amount) {
      return NextResponse.json(
        { success: false, message: "Courier and valid amount are required" },
        { status: 400 }
      );
    }

    const payment = await recordPayment({
      courierId,
      amount: Number(amount),
      paymentDate: paymentDate || new Date().toISOString().split("T")[0],
      paymentMethod: paymentMethod || "Bank Transfer",
      referenceNumber: referenceNumber || "",
      remarks: remarks || "",
      recordedBy: user?.name || "Admin",
    });

    return NextResponse.json({
      success: true,
      message: `Payment ${payment.paymentNumber} recorded successfully.`,
      payment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error recording payment";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

