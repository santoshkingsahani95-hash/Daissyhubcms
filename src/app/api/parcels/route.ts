import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import { getParcels, createBatchWithParcels, getCourierById } from "@/lib/db-service";
import { DeliveryArea } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const courierId = searchParams.get("courierId") || undefined;
    const batchId = searchParams.get("batchId") || undefined;
    const status = searchParams.get("status") || undefined;
    const isSettledParam = searchParams.get("isSettled");
    const isSettled = isSettledParam === "true" ? true : isSettledParam === "false" ? false : undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const limit = parseInt(searchParams.get("limit") || "500", 10);

    const parcels = await getParcels({
      search,
      courierId,
      batchId,
      status,
      isSettled,
      startDate,
      endDate,
      limit,
    });

    return NextResponse.json({
      success: true,
      parcels,
      total: parcels.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching parcels";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "parcels:create");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      courierId,
      customerName,
      customerPhone,
      customerAddress,
      deliveryArea,
      itemSku,
      codAmount,
      advancePayment,
      deliveryCharge,
      remarks,
    } = body;

    if (!courierId) {
      return NextResponse.json(
        { success: false, message: "Courier is required" },
        { status: 400 }
      );
    }

    const courier = await getCourierById(courierId);
    if (!courier) {
      return NextResponse.json(
        { success: false, message: "Courier not found" },
        { status: 404 }
      );
    }

    const defaultRate = courier.defaultDeliveryCharge || courier.defaultChargeInsideValley || 70;

    const res = await createBatchWithParcels(
      {
        courierId,
        courierName: courier.name,
        dispatchDate: new Date().toISOString().split("T")[0],
        serviceArea: "Inside Valley",
        notes: "Single parcel dispatch",
      },
      [
        {
          customerName,
          customerPhone,
          customerAddress: customerAddress || "",
          deliveryArea: "Inside Valley",
          itemSku: itemSku || "",
          codAmount: Number(codAmount) || 0,
          advancePayment: Number(advancePayment) || 0,
          deliveryCharge: Number(deliveryCharge) || defaultRate,
          remarks: remarks || "",
        },
      ],
      user?.name || "Admin"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Parcel booked successfully",
        parcel: res.parcels[0],
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating parcel";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
