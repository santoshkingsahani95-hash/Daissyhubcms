import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TableColumn {
  header: string;
  dataKey: string;
}

interface PDFReportOptions {
  title: string;
  subtitle?: string;
  businessName?: string;
  currency?: string;
  columns: TableColumn[];
  data: Record<string, unknown>[];
  summaryCards?: { label: string; value: string }[];
}

export function generatePDFReport(options: PDFReportOptions): Buffer {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const business = options.businessName || "Apex Logistics & Multi-Courier ERP";
  const currency = options.currency || "NPR";
  const reportDate = new Date().toLocaleString();

  // Header banner
  doc.setFillColor(15, 23, 42); // Navy 900
  doc.rect(0, 0, 297, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(business, 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Official System Report | Currency: ${currency} | Generated: ${reportDate}`, 14, 18);

  // Report Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(options.title, 14, 34);

  let startY = 40;
  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(options.subtitle, 14, 40);
    startY = 46;
  }

  // Summary Metrics Row
  if (options.summaryCards && options.summaryCards.length > 0) {
    const cardWidth = (297 - 28 - (options.summaryCards.length - 1) * 6) / options.summaryCards.length;
    let cardX = 14;

    options.summaryCards.forEach((card) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, startY, cardWidth, 14, 2, 2, "FD");

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.text(card.label.toUpperCase(), cardX + 4, startY + 5);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(String(card.value), cardX + 4, startY + 11);

      cardX += cardWidth + 6;
    });

    startY += 20;
  }

  // AutoTable
  const headers = [options.columns.map((c) => c.header)];
  const rows = options.data.map((item) =>
    options.columns.map((col) =>
      item[col.dataKey] !== undefined && item[col.dataKey] !== null
        ? String(item[col.dataKey])
        : "-"
    )
  );

  autoTable(doc, {
    startY,
    head: headers,
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 15 },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        297 - 30,
        210 - 8
      );
    },
  });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
