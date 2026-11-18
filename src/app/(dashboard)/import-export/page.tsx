"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Boxes,
  Database,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function ImportExportPage() {
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Customer Name,Mobile Number,COD Amount,Advance Paid,SKU / Item,Delivery Charge,Address,Remarks\n" +
      "Aayush Shrestha,9841238910,2000,500,HD-BLK-M,70,New Baneshwor Kathmandu,Call before arrival\n" +
      "Pooja Sharma,9818456712,1800,0,TSH-WHT-L,70,Pulchowk Lalitpur,Urgent afternoon delivery\n" +
      "Kiran Thapa,9801234567,2200,1000,WJK-NVY-XL,70,Kathmandu New Road,Courier call customer\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "DaisyHub_Bulk_Parcel_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample Excel/CSV template downloaded!");
  };

  const handleExportAllParcels = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/parcels?limit=5000");
      const data = await res.json();
      if (!data.success || !data.parcels) throw new Error("Failed to export parcels");

      const headers = [
        "Parcel ID",
        "Batch ID",
        "Courier Name",
        "Customer Name",
        "Mobile Number",
        "COD Amount (NPR)",
        "Advance Paid (NPR)",
        "Delivery Charge (NPR)",
        "SKU",
        "Address",
        "Status",
        "Dispatch Date",
        "Delivered Date",
        "Settled",
      ];

      const rows = data.parcels.map((p: any) => [
        `"${p.parcelId}"`,
        `"${p.batchId}"`,
        `"${p.courierName}"`,
        `"${p.customerName.replace(/"/g, '""')}"`,
        `"${p.customerPhone}"`,
        p.codAmount || 0,
        p.advancePayment || 0,
        p.deliveryCharge || 0,
        `"${p.itemSku || ""}"`,
        `"${(p.customerAddress || "").replace(/"/g, '""')}"`,
        `"${p.status}"`,
        `"${p.dispatchDate}"`,
        `"${p.deliveredDate || ""}"`,
        p.isSettled ? "Yes" : "No",
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `DaisyHub_Parcels_Export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${data.parcels.length} parcels to CSV!`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportAllSettlements = async () => {
    try {
      const res = await fetch("/api/settlements");
      const data = await res.json();
      if (!data.success || !data.settlements) throw new Error("Failed to export settlements");

      const headers = [
        "Statement Number",
        "Settlement Date",
        "Courier Name",
        "Service Area",
        "Delivered Parcels",
        "Returned Parcels",
        "Gross COD (NPR)",
        "Delivery Charges (NPR)",
        "Current Net Receivable (NPR)",
        "Previous Due (NPR)",
        "Total Receivable (NPR)",
        "Payment Received (NPR)",
        "Remaining Due (NPR)",
        "Payment Method",
        "Reference Number",
      ];

      const rows = data.settlements.map((s: any) => [
        `"${s.settlementNumber}"`,
        `"${s.settlementDate}"`,
        `"${s.courierName}"`,
        `"${s.serviceArea}"`,
        s.deliveredParcelsCount,
        s.returnedParcelsCount,
        s.grossCodCollection,
        s.deliveryCharges,
        s.currentNetReceivable,
        s.previousOutstandingDue,
        s.totalReceivable,
        s.paymentReceived,
        s.remainingDue,
        `"${s.paymentMethod}"`,
        `"${s.paymentReference || ""}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `DaisyHub_Settlements_Export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${data.settlements.length} settlement statements!`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          <span>Import & Export Center</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Download bulk parcel templates, import Excel manifests, and export company financial archives
        </p>
      </div>

      {/* Grid of Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Template & Import Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Parcel Import
              </h2>
              <p className="text-xs text-slate-500">
                Create new dispatch batches directly from Excel or CSV files
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Recommended Import Workflow:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>Download the official DaisyHub Parcel CSV Template below.</li>
              <li>Fill in customer details, COD amount, and SKU in Excel.</li>
              <li>Open <strong>New Parcel Entry</strong> and click "Paste from Excel" or "Import File".</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Download Excel Template</span>
            </button>

            <Link href="/parcels/new">
              <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all">
                <span>Go to Fast Parcel Entry</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Full Database Export Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Company Data Export
              </h2>
              <p className="text-xs text-slate-500">
                Backup records and export reports for external accounting audits
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-400">
            <p>
              Exports are generated with standard CSV encoding suitable for Microsoft Excel, Google Sheets, Tally, and Zoho Books.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportAllParcels}
              disabled={downloading}
              className="w-full inline-flex items-center justify-between px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
            >
              <span className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>Export All Parcels & Dispatch Records</span>
              </span>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={handleExportAllSettlements}
              className="w-full inline-flex items-center justify-between px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
            >
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Export All Settlement Statements</span>
              </span>
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

