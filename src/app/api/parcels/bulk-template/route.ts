import { NextRequest, NextResponse } from "next/server";
import { getCourierCompanies } from "@/lib/db-service";
import { generateParcelTemplate } from "@/lib/excel";

export async function GET(req: NextRequest) {
  try {
    const couriers = await getCourierCompanies();
    const activeCouriers = couriers.filter((c: any) => c.isActive);
    const courierNames = activeCouriers.map((c: any) => c.name);

    const excelBuffer = await generateParcelTemplate(courierNames);

    const now = new Date().toISOString().slice(0, 10);
    const fileName = `DaisyHub_Bulk_Import_Template_${now}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error generating template";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
