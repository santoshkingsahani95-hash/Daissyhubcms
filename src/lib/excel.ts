import ExcelJS from "exceljs";

export interface ParsedParcelRow {
  rowNumber: number;
  customerName: string;
  mobileNumber: string;
  address: string;
  deliveryArea: "Inside Valley" | "Outside Valley" | string;
  advancePayment?: number;
  courierCompany: string;
  itemSku: string;
  quantity: number;
  codAmount: number;
  isValid: boolean;
  errors: { column: string; message: string }[];
}

export interface BulkValidationResult {
  totalRows: number;
  validRows: ParsedParcelRow[];
  invalidRows: ParsedParcelRow[];
  courierBreakdown: { [key: string]: { count: number; totalCod: number } };
  totalCodAmount: number;
}

/**
 * Generates dynamic Excel Template with Data Validation and Active Couriers
 */
export async function generateParcelTemplate(
  activeCourierNames: string[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ApexCourier ERP";
  workbook.lastModifiedBy = "ApexCourier ERP";
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Data Sheet
  const worksheet = workbook.addWorksheet("Parcels", {
    views: [{ state: "frozen", ySplit: 1, xSplit: 0 }],
  });

  // Define Columns
  worksheet.columns = [
    { header: "Customer Name *", key: "customerName", width: 24 },
    { header: "Mobile Number *", key: "mobileNumber", width: 18 },
    { header: "Address *", key: "address", width: 32 },
    { header: "Delivery Area *", key: "deliveryArea", width: 20 },
    { header: "Courier Company *", key: "courierCompany", width: 24 },
    { header: "Item SKU *", key: "itemSku", width: 18 },
    { header: "Quantity *", key: "quantity", width: 14 },
    { header: "COD Amount *", key: "codAmount", width: 16 },
  ];

  // Format Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F172A" }, // Dark Navy
    };
    cell.font = {
      bold: true,
      color: { argb: "FFFFFF" },
      size: 11,
      name: "Calibri",
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "334155" } },
      bottom: { style: "medium", color: { argb: "334155" } },
      left: { style: "thin", color: { argb: "334155" } },
      right: { style: "thin", color: { argb: "334155" } },
    };
  });

  // 2. Hidden Lookup Sheet for dynamic courier names and delivery areas
  const lookupSheet = workbook.addWorksheet("_LookupData", {
    state: "veryHidden",
  });

  const courierList =
    activeCourierNames.length > 0 ? activeCourierNames : ["Default Courier"];

  // Populate courier list in column A
  courierList.forEach((c, idx) => {
    lookupSheet.getCell(`A${idx + 1}`).value = c;
  });

  // Populate delivery areas in column B
  lookupSheet.getCell("B1").value = "Inside Valley";
  lookupSheet.getCell("B2").value = "Outside Valley";

  // Add Data Validations for 500 rows
  const maxRows = 500;
  for (let r = 2; r <= maxRows; r++) {
    // Delivery Area dropdown: Col D
    worksheet.getCell(`D${r}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"_LookupData!$B$1:$B$2"'],
      showErrorMessage: true,
      errorTitle: "Invalid Delivery Area",
      error: "Please choose 'Inside Valley' or 'Outside Valley'",
    };

    // Courier Company dropdown: Col E
    worksheet.getCell(`E${r}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"_LookupData!$A$1:$A$${courierList.length}"`],
      showErrorMessage: true,
      errorTitle: "Invalid Courier",
      error: "Please select an active courier from the dropdown list",
    };

    // Quantity validation: Col G (Whole number >= 1)
    worksheet.getCell(`G${r}`).dataValidation = {
      type: "whole",
      operator: "greaterThanOrEqual",
      allowBlank: false,
      formulae: [1],
      showErrorMessage: true,
      errorTitle: "Invalid Quantity",
      error: "Quantity must be at least 1",
    };

    // COD Amount validation: Col H (Decimal >= 0)
    worksheet.getCell(`H${r}`).dataValidation = {
      type: "decimal",
      operator: "greaterThanOrEqual",
      allowBlank: false,
      formulae: [0],
      showErrorMessage: true,
      errorTitle: "Invalid COD Amount",
      error: "COD Amount must be 0 or greater",
    };
  }

  // 3. Instructions Sheet
  const instructionsSheet = workbook.addWorksheet("Instructions & Guide");
  instructionsSheet.columns = [
    { header: "Field", key: "field", width: 22 },
    { header: "Required", key: "required", width: 14 },
    { header: "Accepted Values / Format", key: "format", width: 40 },
    { header: "Description & Notes", key: "notes", width: 50 },
  ];

  const instHeader = instructionsSheet.getRow(1);
  instHeader.height = 28;
  instHeader.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1E293B" },
    };
    c.font = { bold: true, color: { argb: "FFFFFF" } };
    c.alignment = { vertical: "middle", horizontal: "left" };
  });

  const guidelines = [
    {
      field: "Customer Name",
      required: "YES",
      format: "Text (e.g., Ramesh Shrestha)",
      notes: "Full recipient customer name",
    },
    {
      field: "Mobile Number",
      required: "YES",
      format: "10-digit mobile (e.g., 9841234567)",
      notes: "Used to uniquely track customer order history",
    },
    {
      field: "Address",
      required: "YES",
      format: "Street, Ward, Landmark, City",
      notes: "Detailed destination address for delivery agent",
    },
    {
      field: "Delivery Area",
      required: "YES",
      format: "Inside Valley OR Outside Valley",
      notes: "Select from the Excel dropdown menu",
    },
    {
      field: "Courier Company",
      required: "YES",
      format: activeCourierNames.join(" | ") || "Active Couriers",
      notes:
        "Select from the dynamic dropdown. Shows all active couriers in the system.",
    },
    {
      field: "Item SKU",
      required: "YES",
      format: "Text / Product code (e.g., WATCH-BLK-01)",
      notes: "Identifier for the item being dispatched",
    },
    {
      field: "Quantity",
      required: "YES",
      format: "Whole number >= 1 (e.g., 1, 2, 5)",
      notes: "Number of units",
    },
    {
      field: "COD Amount",
      required: "YES",
      format: "Number >= 0 (e.g., 1500, 0 for prepaid)",
      notes: "Cash on delivery amount to collect from the recipient",
    },
  ];

  guidelines.forEach((row) => {
    instructionsSheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Parses and strictly validates uploaded Excel buffer
 */
export async function parseParcelImport(
  buffer: Buffer,
  activeCourierNames: string[]
): Promise<BulkValidationResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  // Use worksheet named 'Parcels' or first sheet
  const worksheet = workbook.getWorksheet("Parcels") || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Invalid Excel file: No worksheet found.");
  }

  const normalizedActiveCouriers = new Map<string, string>();
  activeCourierNames.forEach((c) => {
    normalizedActiveCouriers.set(c.trim().toLowerCase(), c.trim());
  });

  const validRows: ParsedParcelRow[] = [];
  const invalidRows: ParsedParcelRow[] = [];
  const courierBreakdown: { [key: string]: { count: number; totalCod: number } } = {};
  let totalCodAmount = 0;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    // Read cells by column position
    const c1 = row.getCell(1).text?.trim();
    const c2 = row.getCell(2).text?.trim();
    const c3 = row.getCell(3).text?.trim();
    const c4 = row.getCell(4).text?.trim();
    const c5 = row.getCell(5).text?.trim();
    const c6 = row.getCell(6).text?.trim();
    const c7 = row.getCell(7).value;
    const c8 = row.getCell(8).value;

    // Check if the whole row is empty
    const hasAnyValue = [c1, c2, c3, c4, c5, c6, c7, c8].some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ""
    );
    if (!hasAnyValue) return;

    const errors: { column: string; message: string }[] = [];

    // 1. Customer Name
    const customerName = c1 || "";
    if (!customerName) {
      errors.push({
        column: "Customer Name",
        message: "Customer Name is required",
      });
    }

    // 2. Mobile Number
    const mobileNumber = (c2 || "").replace(/[^0-9]/g, "");
    if (!mobileNumber) {
      errors.push({
        column: "Mobile Number",
        message: "Mobile Number is required",
      });
    } else if (mobileNumber.length < 7 || mobileNumber.length > 15) {
      errors.push({
        column: "Mobile Number",
        message: "Mobile Number must be between 7 and 15 digits",
      });
    }

    // 3. Address
    const address = c3 || "";
    if (!address) {
      errors.push({
        column: "Address",
        message: "Delivery Address is required",
      });
    }

    // 4. Delivery Area (Defaults automatically to Inside Valley)
    let deliveryArea: string = "Inside Valley";
    const areaLower = (c4 || "").toLowerCase();
    if (areaLower.includes("outside")) {
      deliveryArea = "Outside Valley";
    } else {
      deliveryArea = "Inside Valley";
    }

    // 5. Courier Company
    let matchedCourier = "";
    const rawCourier = c5 || "";
    if (!rawCourier) {
      errors.push({
        column: "Courier Company",
        message: "Courier Company is required",
      });
    } else {
      const match = normalizedActiveCouriers.get(rawCourier.toLowerCase());
      if (!match) {
        errors.push({
          column: "Courier Company",
          message: `Courier "${rawCourier}" is not recognized or is inactive`,
        });
      } else {
        matchedCourier = match;
      }
    }

    // 6. Item SKU
    const itemSku = c6 || "";
    if (!itemSku) {
      errors.push({
        column: "Item SKU",
        message: "Item SKU is required",
      });
    }

    // 7. Quantity
    const qtyNum = Number(c7);
    if (isNaN(qtyNum) || !Number.isInteger(qtyNum) || qtyNum < 1) {
      errors.push({
        column: "Quantity",
        message: "Quantity must be a positive whole integer (at least 1)",
      });
    }
    const quantity = !isNaN(qtyNum) && qtyNum >= 1 ? qtyNum : 1;

    // 8. COD Amount
    const codNum = Number(c8);
    if (isNaN(codNum) || codNum < 0) {
      errors.push({
        column: "COD Amount",
        message: "COD Amount must be a valid number (>= 0)",
      });
    }
    const codAmount = !isNaN(codNum) && codNum >= 0 ? codNum : 0;

    const parsedRow: ParsedParcelRow = {
      rowNumber,
      customerName,
      mobileNumber: mobileNumber || c2 || "",
      address,
      deliveryArea,
      courierCompany: matchedCourier || rawCourier,
      itemSku,
      quantity,
      codAmount,
      isValid: errors.length === 0,
      errors,
    };

    if (parsedRow.isValid) {
      validRows.push(parsedRow);
      totalCodAmount += codAmount;

      if (!courierBreakdown[parsedRow.courierCompany]) {
        courierBreakdown[parsedRow.courierCompany] = { count: 0, totalCod: 0 };
      }
      courierBreakdown[parsedRow.courierCompany].count += 1;
      courierBreakdown[parsedRow.courierCompany].totalCod += codAmount;
    } else {
      invalidRows.push(parsedRow);
    }
  });

  return {
    totalRows: validRows.length + invalidRows.length,
    validRows,
    invalidRows,
    courierBreakdown,
    totalCodAmount,
  };
}

/**
 * Generates an Excel spreadsheet containing invalid rows and error reasons for user download
 */
export async function generateErrorExcel(
  invalidRows: ParsedParcelRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Import Errors");

  ws.columns = [
    { header: "Excel Row", key: "rowNumber", width: 12 },
    { header: "Customer Name", key: "customerName", width: 22 },
    { header: "Mobile Number", key: "mobileNumber", width: 18 },
    { header: "Address", key: "address", width: 28 },
    { header: "Delivery Area", key: "deliveryArea", width: 16 },
    { header: "Courier Company", key: "courierCompany", width: 20 },
    { header: "Item SKU", key: "itemSku", width: 16 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "COD Amount", key: "codAmount", width: 14 },
    { header: "Identified Errors", key: "errors", width: 45 },
  ];

  const header = ws.getRow(1);
  header.height = 26;
  header.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "991B1B" }, // Crimson Red
    };
    c.font = { bold: true, color: { argb: "FFFFFF" } };
  });

  invalidRows.forEach((r) => {
    const errorStr = r.errors.map((e) => `[${e.column}]: ${e.message}`).join("; ");
    ws.addRow({
      rowNumber: r.rowNumber,
      customerName: r.customerName,
      mobileNumber: r.mobileNumber,
      address: r.address,
      deliveryArea: r.deliveryArea,
      courierCompany: r.courierCompany,
      itemSku: r.itemSku,
      quantity: r.quantity,
      codAmount: r.codAmount,
      errors: errorStr,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
