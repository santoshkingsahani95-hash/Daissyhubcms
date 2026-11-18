import { NextRequest, NextResponse } from "next/server";
import { getParcelByOrderIdOrTracking } from "@/lib/db-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { query: string } }
) {
  try {
    const query = decodeURIComponent(params.query || "").trim();
    if (!query) {
      return NextResponse.json(
        { success: false, message: "Tracking ID or Order ID is required." },
        { status: 400 }
      );
    }

    const parcel = await getParcelByOrderIdOrTracking(query);
    if (!parcel) {
      return NextResponse.json(
        {
          success: false,
          message: `No parcel found matching "${query}". Please verify the number.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      parcel,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error tracking parcel";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

