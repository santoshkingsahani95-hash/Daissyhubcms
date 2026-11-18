import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { errorResponse } = await checkAuthAndPermission(req, "dashboard:view");
  if (errorResponse) return errorResponse;

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching dashboard stats";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

