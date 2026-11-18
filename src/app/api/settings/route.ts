import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getCompanySettings,
  updateCompanySettings,
  checkMongoConnection,
} from "@/lib/db-service";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const settings = await getCompanySettings();
    const isMongoConnected = await checkMongoConnection();

    return NextResponse.json({
      success: true,
      settings,
      databaseStatus: {
        type: "MongoDB / Embedded Store",
        connected: isMongoConnected,
        mode: isMongoConnected ? "MongoDB Atlas Active" : "Local Persistent JSON DB (Active)",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching settings";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await checkAuthAndPermission(req, "settings:manage");
    const body = await req.json();
    const updated = await updateCompanySettings(body);

    if (user) {
      await logActivity({
        user,
        action: "SETTINGS_UPDATED",
        details: `Updated enterprise billing and settlement settings`,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Company and billing settings saved successfully.",
      settings: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating settings";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
