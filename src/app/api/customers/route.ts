import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getCustomers } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { errorResponse } = await checkAuthAndPermission(req, "customers:view");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getCustomers(search, page, limit);

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching customers";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

