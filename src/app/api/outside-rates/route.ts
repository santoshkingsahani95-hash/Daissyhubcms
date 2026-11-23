import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getOutsideValleyRates,
  saveOutsideValleyRates,
} from "@/lib/db-service";
import { logActivity } from "@/lib/audit";
import { IOutsideValleyRate } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const rates = await getOutsideValleyRates();
    return NextResponse.json({ success: true, rates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching outside valley rates";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await checkAuthAndPermission(req, "settings:manage");
    const body = await req.json();

    // If bulk array provided
    if (Array.isArray(body.rates)) {
      const saved = await saveOutsideValleyRates(body.rates);
      if (user) {
        await logActivity({
          user,
          action: "OUTSIDE_RATES_UPDATED",
          details: `Updated bulk outside valley delivery rates (${saved.length} places)`,
          req,
        });
      }
      return NextResponse.json({
        success: true,
        message: "Outside valley delivery rates updated successfully.",
        rates: saved,
      });
    }

    const { placeName, deliveryCharge, remarks } = body;
    if (!placeName || !placeName.trim()) {
      return NextResponse.json(
        { success: false, message: "Place name is required." },
        { status: 400 }
      );
    }

    const charge = Number(deliveryCharge);
    if (isNaN(charge) || charge < 0) {
      return NextResponse.json(
        { success: false, message: "Valid delivery charge is required." },
        { status: 400 }
      );
    }

    const currentRates = await getOutsideValleyRates();
    const cleanPlace = placeName.trim();

    // Check duplicate
    const existingIndex = currentRates.findIndex(
      (r) => r.placeName.toLowerCase() === cleanPlace.toLowerCase()
    );

    let updatedRates: IOutsideValleyRate[];
    if (existingIndex >= 0) {
      // Update existing place rate
      updatedRates = currentRates.map((r, i) =>
        i === existingIndex
          ? {
              ...r,
              placeName: cleanPlace,
              deliveryCharge: charge,
              remarks: remarks !== undefined ? String(remarks).trim() : r.remarks,
            }
          : r
      );
    } else {
      // Append new place
      const newRate: IOutsideValleyRate = {
        id: "ovr-" + Date.now(),
        placeName: cleanPlace,
        deliveryCharge: charge,
        remarks: remarks ? String(remarks).trim() : "",
      };
      updatedRates = [...currentRates, newRate];
    }

    const saved = await saveOutsideValleyRates(updatedRates);

    if (user) {
      await logActivity({
        user,
        action: "OUTSIDE_RATE_SAVED",
        details: `Saved outside valley rate for "${cleanPlace}": Rs. ${charge}`,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Outside valley rate for "${cleanPlace}" (Rs. ${charge}) saved successfully.`,
      rates: saved,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error saving outside valley rate";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await checkAuthAndPermission(req, "settings:manage");
    const body = await req.json();

    if (Array.isArray(body.rates)) {
      const saved = await saveOutsideValleyRates(body.rates);
      return NextResponse.json({
        success: true,
        message: "Outside valley delivery rates updated successfully.",
        rates: saved,
      });
    }

    const { id, placeName, deliveryCharge, remarks } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Place rate ID is required for update." },
        { status: 400 }
      );
    }

    const currentRates = await getOutsideValleyRates();
    const updatedRates = currentRates.map((r) =>
      r.id === id
        ? {
            ...r,
            placeName: placeName ? String(placeName).trim() : r.placeName,
            deliveryCharge:
              deliveryCharge !== undefined ? Number(deliveryCharge) : r.deliveryCharge,
            remarks: remarks !== undefined ? String(remarks).trim() : r.remarks,
          }
        : r
    );

    const saved = await saveOutsideValleyRates(updatedRates);

    if (user) {
      await logActivity({
        user,
        action: "OUTSIDE_RATE_UPDATED",
        details: `Updated outside valley rate for ID "${id}"`,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Outside valley rate updated successfully.",
      rates: saved,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating outside valley rate";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await checkAuthAndPermission(req, "settings:manage");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Place rate ID is required." },
        { status: 400 }
      );
    }

    const currentRates = await getOutsideValleyRates();
    const target = currentRates.find((r) => r.id === id);
    const updatedRates = currentRates.filter((r) => r.id !== id);

    const saved = await saveOutsideValleyRates(updatedRates);

    if (user) {
      await logActivity({
        user,
        action: "OUTSIDE_RATE_DELETED",
        details: `Deleted outside valley rate: "${target?.placeName || id}"`,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Place "${target?.placeName || id}" removed from outside valley rates.`,
      rates: saved,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error deleting outside valley rate";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
