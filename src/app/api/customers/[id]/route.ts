import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getCustomerById,
  updateCustomer,
  getParcels,
} from "@/lib/db-service";
import { logActivity } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { errorResponse } = await checkAuthAndPermission(req, "customers:view");
  if (errorResponse) return errorResponse;

  try {
    const customer = await getCustomerById(params.id);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const courierId = searchParams.get("courierId") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Fetch complete customer orders using their mobile number
    const parcels = await getParcels({
      search: customer.phone,
      courierId,
      status,
      startDate,
      endDate,
      limit: 100,
    });

    return NextResponse.json({
      success: true,
      customer,
      orderHistory: parcels,
      totalOrdersCount: parcels.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching customer details";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "customers:manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const existing = await getCustomerById(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    const updated = await updateCustomer(params.id, body);

    if (user) {
      await logActivity({
        user,
        action: "CUSTOMER_UPDATED",
        details: `Updated customer info for: ${existing.name} (${existing.phone})`,
        relatedRecordId: params.id,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully.",
      customer: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating customer";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

