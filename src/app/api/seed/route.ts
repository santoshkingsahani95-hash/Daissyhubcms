import { NextRequest, NextResponse } from "next/server";
import { ensureInitialSeed } from "@/lib/seed-data";

export async function POST(req: NextRequest) {
  try {
    await ensureInitialSeed();
    return NextResponse.json({
      success: true,
      message: "Database initialized with Super Admin, couriers, and sample records.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error seeding data";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

