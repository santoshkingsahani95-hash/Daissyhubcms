import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getCouriers, createCourier } from "@/lib/db-service";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const onlyActive = searchParams.get("active") === "true";
  const search = searchParams.get("search")?.toLowerCase();

  try {
    let couriers = await getCouriers();

    if (onlyActive) {
      couriers = couriers.filter((c) => c.isActive);
    }

    if (search) {
      couriers = couriers.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.contactPerson?.toLowerCase().includes(search) ||
          c.phone?.includes(search)
      );
    }

    return NextResponse.json({ success: true, couriers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching couriers";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "couriers:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      code,
      contactPerson,
      phone,
      address,
      email,
      serviceArea,
      defaultDeliveryCharge,
      defaultChargeInsideValley,
      defaultChargeOutsideValley,
      openingBalance,
      isActive,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Courier company name is required." },
        { status: 400 }
      );
    }

    // Check duplicate name
    const existing = await getCouriers();
    const duplicate = existing.find(
      (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: `Courier company with name "${name}" already exists.`,
        },
        { status: 409 }
      );
    }

    const assignedServiceArea = (serviceArea as any) || "Inside Valley";
    const charge = Number(defaultDeliveryCharge) || 70;

    const newCourier = await createCourier({
      name: name.trim(),
      code: code?.trim() || name.substring(0, 3).toUpperCase(),
      contactPerson: contactPerson?.trim() || "",
      phone: phone?.trim() || "",
      address: address?.trim() || "",
      email: email?.trim() || "",
      serviceArea: assignedServiceArea,
      defaultDeliveryCharge: charge,
      defaultChargeInsideValley: charge,
      defaultChargeOutsideValley: charge,
      returnChargeInsideValley: 0,
      returnChargeOutsideValley: 0,
      openingBalance: Number(openingBalance) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    if (user) {
      await logActivity({
        user,
        action: "COURIER_ADDED",
        details: `Added new courier company: "${newCourier.name}"`,
        relatedRecordId: String(newCourier._id),
        req,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Courier company created successfully.",
        courier: newCourier,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating courier company";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
