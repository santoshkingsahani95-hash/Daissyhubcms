import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getActivityLogs } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { errorResponse } = await checkAuthAndPermission(req, "settings:manage");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const result = await getActivityLogs(page, limit);

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching activity logs";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

