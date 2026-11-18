import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getParcels,
  getSettlements,
  getCourierLedgerSummary,
  getCompanySettings,
} from "@/lib/db-service";
import ExcelJS from "exceljs";
import { formatDate, formatCurrency } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { errorResponse } = await checkAuthAndPermission(req, "reports:export");
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "parcels";
    const courierId = searchParams.get("courierId") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const settings = await getCompanySettings();
    const currency = settings.currency || "NPR";
    const businessName = settings.companyName || "DaisyHub E-Commerce Pvt. Ltd.";
    const today = new Date().toISOString().slice(0, 10);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = businessName;
    workbook.created = new Date();

    if (reportType === "parcels") {
      const parcels = await getParcels({
        courierId,
        status,
        startDate,
        endDate,
        limit: 2000,
      });

      const worksheet = workbook.addWorksheet("Parcels Report");
      worksheet.columns = [
        { header: "Parcel ID", key: "parcelId", width: 18 },
        { header: "Batch ID", key: "batchId", width: 18 },
        { header: "Dispatch Date", key: "dispatchDate", width: 14 },
        { header: "Customer Name", key: "customerName", width: 22 },
        { header: "Phone", key: "customerPhone", width: 15 },
        { header: "Courier", key: "courierName", width: 20 },
        { header: "SKU", key: "itemSku", width: 15 },
        { header: "Advance Paid", key: "advancePayment", width: 14 },
        { header: "COD Amount", key: "codAmount", width: 14 },
        { header: "Total Value", key: "totalValue", width: 14 },
        { header: "Delivery Charge", key: "deliveryCharge", width: 15 },
        { header: "Status", key: "status", width: 20 },
      ];

      parcels.forEach((p) => {
        worksheet.addRow({
          parcelId: p.parcelId,
          batchId: p.batchId,
          dispatchDate: p.dispatchDate,
          customerName: p.customerName,
          customerPhone: p.customerPhone,
          courierName: p.courierName,
          itemSku: p.itemSku,
          advancePayment: p.advancePayment || 0,
          codAmount: p.codAmount,
          totalValue: (p.codAmount || 0) + (p.advancePayment || 0),
          deliveryCharge: p.deliveryCharge,
          status: p.status,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="DaisyHub_Parcels_Report_${today}.xlsx"`,
        },
      });
    }

    if (reportType === "settlements") {
      const settlements = await getSettlements({ courierId, status });
      const worksheet = workbook.addWorksheet("Settlements Report");
      worksheet.columns = [
        { header: "Statement Number", key: "settlementNumber", width: 22 },
        { header: "Date", key: "settlementDate", width: 14 },
        { header: "Courier", key: "courierName", width: 22 },
        { header: "Delivered", key: "deliveredParcelsCount", width: 12 },
        { header: "Returned", key: "returnedParcelsCount", width: 12 },
        { header: "Gross COD", key: "grossCodCollection", width: 15 },
        { header: "Delivery Charges", key: "deliveryCharges", width: 15 },
        { header: "Current Net", key: "currentNetReceivable", width: 15 },
        { header: "Previous Due", key: "previousOutstandingDue", width: 15 },
        { header: "Total Receivable", key: "totalReceivable", width: 16 },
        { header: "Payment Received", key: "paymentReceived", width: 16 },
        { header: "Remaining Due", key: "remainingDue", width: 16 },
      ];

      settlements.forEach((s) => {
        worksheet.addRow(s);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="DaisyHub_Settlements_Report_${today}.xlsx"`,
        },
      });
    }

    // Default ledger summary
    const summary = await getCourierLedgerSummary(courierId);
    const worksheet = workbook.addWorksheet("Courier Balances");
    worksheet.columns = [
      { header: "Courier", key: "courierName", width: 22 },
      { header: "Total Parcels", key: "totalBookedParcels", width: 14 },
      { header: "Delivered", key: "totalDeliveredParcels", width: 12 },
      { header: "Returned", key: "totalReturnedParcels", width: 12 },
      { header: "Delivered COD", key: "totalCodAmount", width: 16 },
      { header: "Charges", key: "totalCourierCharges", width: 16 },
      { header: "Net Outstanding Due", key: "netOutstanding", width: 18 },
    ];

    summary.forEach((row) => worksheet.addRow(row));
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="DaisyHub_Courier_Balances_${today}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error exporting report";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
