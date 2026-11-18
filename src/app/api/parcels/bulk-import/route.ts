import { NextRequest, NextResponse } from "next/server";
import { checkAuthAndPermission } from "@/lib/auth";
import {
  getCourierCompanies,
  createParcelRecord,
} from "@/lib/db-service";
import { parseParcelImport } from "@/lib/excel";
import { generateBatchId, generateOrderId } from "@/lib/utils";
import { logActivity } from "@/lib/audit";
import { DeliveryArea, ICourierCompany } from "@/types";

export async function POST(req: NextRequest) {
  const { user, errorResponse } = await checkAuthAndPermission(req, "parcels:import");
  if (errorResponse) return errorResponse;

  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. CONFIRM IMPORT MODE (JSON payload with approved rows)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { rows, fileName } = body;

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "No parcel rows provided for import." },
          { status: 400 }
        );
      }

      const activeCouriers = await getCourierCompanies();
      const courierMap = new Map<string, ICourierCompany>();
      activeCouriers.forEach((c: ICourierCompany) => {
        courierMap.set(c.name.trim().toLowerCase(), c);
      });

      const batchId = generateBatchId();
      const importedParcels: { orderId: string; customerName: string; codAmount: number }[] = [];
      const courierBreakdown: { [key: string]: { count: number; totalCod: number } } = {};
      let totalCod = 0;

      // Process in batches of 50 for database safety
      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);

        for (const row of chunk) {
          const courierObj = courierMap.get(
            String(row.courierCompany).trim().toLowerCase()
          );
          if (!courierObj) continue;

          const orderId = generateOrderId();
          const deliveryArea = "Inside Valley";
          const courierCharge = courierObj.defaultDeliveryCharge || courierObj.defaultChargeInsideValley || 70;

          await createParcelRecord({
            orderId,
            customerName: row.customerName,
            customerPhone: row.mobileNumber,
            customerAddress: row.address,
            deliveryArea,
            courierCompany: courierObj._id,
            courierName: courierObj.name,
            itemSku: row.itemSku,
            quantity: Number(row.quantity) || 1,
            codAmount: Number(row.codAmount) || 0,
            advancePayment: Number((row as any).advancePayment) || 0,
            courierCharge,
            importBatchId: batchId,
          }, user);

          importedParcels.push({
            orderId,
            customerName: row.customerName,
            codAmount: Number(row.codAmount) || 0,
          });

          const cName = courierObj.name;
          if (!courierBreakdown[cName]) {
            courierBreakdown[cName] = { count: 0, totalCod: 0 };
          }
          courierBreakdown[cName].count += 1;
          courierBreakdown[cName].totalCod += Number(row.codAmount) || 0;
          totalCod += Number(row.codAmount) || 0;
        }
      }

      if (user) {
        await logActivity({
          user,
          action: "PARCELS_BULK_IMPORTED",
          details: `Imported ${importedParcels.length} parcels across ${Object.keys(courierBreakdown).length} couriers (Batch: ${batchId})`,
          relatedRecordId: batchId,
          req,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedParcels.length} parcels!`,
        batchId,
        importedCount: importedParcels.length,
        totalCodAmount: totalCod,
        courierBreakdown,
      });
    }

    // 2. PARSE EXCEL FILE PREVIEW MODE (multipart/form-data)
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Please upload an Excel (.xlsx) file." },
        { status: 400 }
      );
    }

    const couriersList = await getCourierCompanies();
    const activeCourierNames = couriersList.filter((c: any) => c.isActive).map((c: any) => c.name);

    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = await parseParcelImport(buffer, activeCourierNames);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      ...parseResult,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error processing file import";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
