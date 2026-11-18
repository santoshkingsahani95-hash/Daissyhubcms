import { NextRequest, NextResponse } from "next/server";
import { generateErrorExcel, ParsedParcelRow } from "@/lib/excel";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invalidRows } = body as { invalidRows: ParsedParcelRow[] };

    if (!Array.isArray(invalidRows) || invalidRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "No error rows to export." },
        { status: 400 }
      );
    }

    const excelBuffer = await generateErrorExcel(invalidRows);
    const fileName = `ApexCourier_Import_Errors_${new Date().toISOString().slice(0, 10)}.xlsx`;

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
      error instanceof Error ? error.message : "Error generating error report";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
