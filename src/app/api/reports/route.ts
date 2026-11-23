import { NextRequest, NextResponse } from "next/server";
import {
  getParcels,
  getCouriers,
  getSettlements,
  getReturns,
  getBatches,
} from "@/lib/db-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily-dispatch";
  const courierId = searchParams.get("courierId") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  try {
    const couriers = await getCouriers();

    // 0. Executive Sales Dashboard & Courier Progress Mode (Simple & Fast)
    if (type === "dashboard" || type === "sales-dashboard" || type === "executive") {
      const allParcels = await getParcels({ startDate, endDate });
      const returnedParcels = allParcels.filter(
        (p) => p.status === "Returned to Warehouse" || p.status === "Return Initiated"
      );
      const deliveredParcels = allParcels.filter(
        (p) => p.status !== "Returned to Warehouse" && p.status !== "Return Initiated"
      );

      const totalDispatched = allParcels.length;
      const totalDelivered = deliveredParcels.length;
      const totalReturned = returnedParcels.length;
      const totalPending = 0;

      const customerAdvance = allParcels.reduce((sum, p) => sum + (Number(p.advancePayment) || 0), 0);
      const deliveredCod = deliveredParcels.reduce((sum, p) => sum + (Number(p.codAmount) || 0), 0);
      const totalOrderValue = deliveredCod + customerAdvance;
      const deliveryCharges = deliveredParcels.reduce((sum, p) => sum + (Number(p.deliveryCharge) || 0), 0);
      const netReceivable = deliveredCod - deliveryCharges;
      const profitBeforeTax = deliveredCod + customerAdvance - deliveryCharges;

      const companySales = {
        totalDispatched,
        totalDelivered,
        totalReturned,
        totalPending,
        customerAdvance,
        deliveredCod,
        totalOrderValue,
        deliveryCharges,
        netReceivable,
        profitBeforeTax,
        deliveryRate: totalDispatched > 0 ? Math.round((totalDelivered / totalDispatched) * 1000) / 10 : 0,
        returnRate: totalDispatched > 0 ? Math.round((totalReturned / totalDispatched) * 1000) / 10 : 0,
        pendingRate: totalDispatched > 0 ? Math.round((totalPending / totalDispatched) * 1000) / 10 : 0,
      };

      // Extract all parcels that have advance payment > 0 (for Batch & Customer Audit)
      const advanceParcels = allParcels
        .filter((p) => (Number(p.advancePayment) || 0) > 0)
        .map((p) => ({
          _id: p._id,
          parcelId: p.parcelId,
          batchId: p.batchId || "Unassigned",
          courierId: p.courierId,
          courierName: p.courierName || "Courier Partner",
          customerName: p.customerName || "-",
          customerPhone: p.customerPhone || "-",
          customerAddress: p.customerAddress || "-",
          advancePayment: Number(p.advancePayment) || 0,
          codAmount: Number(p.codAmount) || 0,
          totalOrderValue: (Number(p.codAmount) || 0) + (Number(p.advancePayment) || 0),
          itemSku: p.itemSku || "-",
          status: p.status,
          dispatchDate: p.dispatchDate || "",
          deliveredDate: p.deliveredDate || "",
        }))
        .sort((a, b) => b.advancePayment - a.advancePayment);

      // Group advance payments by Batch ID
      const batchAdvanceMap = new Map<
        string,
        {
          batchId: string;
          courierName: string;
          dispatchDate: string;
          totalAdvance: number;
          ordersCount: number;
        }
      >();

      for (const p of advanceParcels) {
        const bId = p.batchId || "Unassigned";
        if (!batchAdvanceMap.has(bId)) {
          batchAdvanceMap.set(bId, {
            batchId: bId,
            courierName: p.courierName,
            dispatchDate: p.dispatchDate,
            totalAdvance: 0,
            ordersCount: 0,
          });
        }
        const b = batchAdvanceMap.get(bId)!;
        b.totalAdvance += p.advancePayment;
        b.ordersCount += 1;
      }

      const advanceBatches = Array.from(batchAdvanceMap.values()).sort(
        (a, b) => b.totalAdvance - a.totalAdvance
      );

      const advanceReport = {
        totalAdvance: customerAdvance,
        ordersCount: advanceParcels.length,
        batchesCount: advanceBatches.length,
        batches: advanceBatches,
        parcels: advanceParcels,
      };

      let courierReport = null;
      if (courierId && courierId !== "all" && courierId !== "") {
        const courier = couriers.find(
          (c) => c._id === courierId || c.name.toLowerCase() === courierId.toLowerCase()
        );
        const cParcels = allParcels.filter(
          (p) => p.courierId === courierId || (courier && p.courierName === courier.name)
        );
        const cReturned = cParcels.filter(
          (p) => p.status === "Returned to Warehouse" || p.status === "Return Initiated"
        );
        const cDelivered = cParcels.filter(
          (p) => p.status !== "Returned to Warehouse" && p.status !== "Return Initiated"
        );
        const cPending: typeof cParcels = [];

        const cCodIncome = cDelivered.reduce((sum, p) => sum + (Number(p.codAmount) || 0), 0);
        const cAdvance = cParcels.reduce((sum, p) => sum + (Number(p.advancePayment) || 0), 0);
        const cOrderValue = cCodIncome + cAdvance;
        const cDeliveryCharges = cDelivered.reduce((sum, p) => sum + (Number(p.deliveryCharge) || 0), 0);
        const cNetReceivable = cCodIncome - cDeliveryCharges;

        courierReport = {
          courier: courier || { _id: courierId, name: courierId },
          totalDispatched: cParcels.length,
          deliveredCount: cDelivered.length,
          returnedCount: cReturned.length,
          pendingCount: cPending.length,
          deliveryRate: cParcels.length > 0 ? Math.round((cDelivered.length / cParcels.length) * 1000) / 10 : 0,
          returnRate: cParcels.length > 0 ? Math.round((cReturned.length / cParcels.length) * 1000) / 10 : 0,
          pendingRate: cParcels.length > 0 ? Math.round((cPending.length / cParcels.length) * 1000) / 10 : 0,
          codIncome: cCodIncome,
          advancePaid: cAdvance,
          orderValue: cOrderValue,
          deliveryCharges: cDeliveryCharges,
          netReceivable: cNetReceivable,
          outstandingBalance: courier?.currentBalance || 0,
          parcels: cParcels,
        };
      }

      return NextResponse.json({
        success: true,
        companySales,
        advanceReport,
        courierReport,
        couriers,
      });
    }

    const parcels = await getParcels({ courierId, startDate, endDate });

    if (type === "daily-dispatch") {
      // Group by dispatchDate
      const grouped: Record<string, { date: string; totalParcels: number; totalCod: number; charges: number }> = {};
      for (const p of parcels) {
        if (!grouped[p.dispatchDate]) {
          grouped[p.dispatchDate] = {
            date: p.dispatchDate,
            totalParcels: 0,
            totalCod: 0,
            charges: 0,
          };
        }
        grouped[p.dispatchDate].totalParcels += 1;
        grouped[p.dispatchDate].totalCod += p.codAmount;
        grouped[p.dispatchDate].charges += p.deliveryCharge;
      }
      return NextResponse.json({
        success: true,
        data: Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date)),
      });
    }

    if (type === "courier-wise") {
      const result = couriers.map((c) => {
        const cParcels = parcels.filter((p) => p.courierId === c._id);
        const returned = cParcels.filter((p) => p.status === "Returned to Warehouse" || p.status === "Return Initiated");
        const delivered = cParcels.filter((p) => p.status !== "Returned to Warehouse" && p.status !== "Return Initiated");
        const pending: typeof cParcels = [];
        const totalCod = delivered.reduce((sum, p) => sum + p.codAmount, 0);
        const deliveryCharges = cParcels.reduce((sum, p) => sum + p.deliveryCharge, 0);

        return {
          courierId: c._id,
          courierName: c.name,
          contactPerson: c.contactPerson,
          phone: c.phone,
          dispatched: cParcels.length,
          delivered: delivered.length,
          returned: returned.length,
          pending: pending.length,
          totalCod,
          deliveryCharges,
          outstandingBalance: c.currentBalance || 0,
        };
      });
      return NextResponse.json({ success: true, data: result });
    }

    if (type === "delivered") {
      const delivered = parcels.filter((p) => p.status === "Delivered");
      return NextResponse.json({ success: true, data: delivered });
    }

    if (type === "returned") {
      const returns = await getReturns({ courierId, startDate, endDate });
      return NextResponse.json({ success: true, data: returns });
    }

    if (type === "pending") {
      const pending = parcels.filter(
        (p) => p.status === "With Courier" || p.status === "Pending Verification"
      );
      return NextResponse.json({ success: true, data: pending });
    }

    if (type === "cod-collection") {
      const delivered = parcels.filter((p) => p.status !== "Returned to Warehouse" && p.status !== "Return Initiated");
      const totalCod = delivered.reduce((sum, p) => sum + p.codAmount, 0);
      const charges = delivered.reduce((sum, p) => sum + p.deliveryCharge, 0);
      return NextResponse.json({
        success: true,
        summary: {
          deliveredCount: delivered.length,
          totalCod,
          totalDeliveryCharges: charges,
          netReceivable: totalCod - charges,
        },
        data: delivered,
      });
    }

    if (type === "settlements") {
      const settlements = await getSettlements({ courierId });
      return NextResponse.json({ success: true, data: settlements });
    }

    if (type === "outstanding") {
      const result = couriers.map((c) => ({
        courierId: c._id,
        courierName: c.name,
        contactPerson: c.contactPerson,
        phone: c.phone,
        openingBalance: c.openingBalance || 0,
        currentBalance: c.currentBalance || 0,
        totalDispatched: c.totalParcelsDispatched || 0,
        totalDelivered: c.totalDelivered || 0,
      }));
      return NextResponse.json({ success: true, data: result });
    }

    if (type === "monthly-financial") {
      // Aggregate by Month (YYYY-MM)
      const monthly: Record<string, { month: string; codCollected: number; deliveryCharges: number; netCod: number; parcelsCount: number }> = {};
      for (const p of parcels) {
        const month = p.dispatchDate.substring(0, 7);
        if (!monthly[month]) {
          monthly[month] = {
            month,
            codCollected: 0,
            deliveryCharges: 0,
            netCod: 0,
            parcelsCount: 0,
          };
        }
        monthly[month].parcelsCount += 1;
        if (p.status === "Delivered") {
          monthly[month].codCollected += p.codAmount;
        }
        monthly[month].deliveryCharges += p.deliveryCharge;
        monthly[month].netCod = monthly[month].codCollected - monthly[month].deliveryCharges;
      }
      return NextResponse.json({
        success: true,
        data: Object.values(monthly).sort((a, b) => b.month.localeCompare(a.month)),
      });
    }

    return NextResponse.json({ success: true, data: parcels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error generating report";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

