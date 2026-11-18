import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courierId = searchParams.get("courierId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const stats = await getDashboardStats({ courierId, startDate, endDate });
    return NextResponse.json({ success: true, stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching dashboard stats";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

