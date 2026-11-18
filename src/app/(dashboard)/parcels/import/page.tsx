"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Building2,
  FileDown,
  RotateCw,
  Coins,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { ParsedParcelRow, BulkValidationResult } from "@/lib/excel";

export default function BulkParcelImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<
    (BulkValidationResult & { fileName: string }) | null
  >(null);
  const [confirming, setConfirming] = useState(false);
  const [downloadingErrors, setDownloadingErrors] = useState(false);

  const handleDownloadTemplate = () => {
    window.open("/api/parcels/bulk-template", "_blank");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (
        !selected.name.endsWith(".xlsx") &&
        !selected.name.endsWith(".xls")
      ) {
        toast.error("Please upload an Excel spreadsheet (.xlsx format)");
        return;
      }
      setFile(selected);
      setPreviewData(null);
    }
  };

  const handleUploadAndValidate = async () => {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parcels/bulk-import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setPreviewData(data);
        if (data.invalidRows && data.invalidRows.length > 0) {
          toast(
            `Validated ${data.totalRows} rows. Found ${data.invalidRows.length} errors that require review.`,
            { icon: "⚠️" }
          );
        } else {
          toast.success(
            `Validation successful! All ${data.validRows.length} rows are valid and ready to import.`
          );
        }
      } else {
        toast.error(data.message || "Failed to validate file");
      }
    } catch {
      toast.error("Error during file validation");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadErrorExcel = async () => {
    if (!previewData || previewData.invalidRows.length === 0) return;

    setDownloadingErrors(true);
    try {
      const res = await fetch("/api/parcels/bulk-import/error-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalidRows: previewData.invalidRows }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Import_Errors_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Error file downloaded!");
      } else {
        toast.error("Failed to generate error Excel");
      }
    } catch {
      toast.error("Error downloading file");
    } finally {
      setDownloadingErrors(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setConfirming(true);
    try {
      const res = await fetch("/api/parcels/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: previewData.validRows,
          fileName: previewData.fileName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Parcels successfully imported!");
        router.push("/parcels");
      } else {
        toast.error(data.message || "Failed to import parcels");
      }
    } catch {
      toast.error("Network error during import confirmation");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/parcels">
            <Button size="sm" variant="outline" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Excel Bulk Parcel Import
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Batch import 500–1000 parcels with dynamic active courier validation
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadTemplate}
          className="h-9 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-brand-600" />
          <span>Download Dynamic Excel Template</span>
        </Button>
      </div>

      {/* Step 1 & 2: Template Download & File Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1 Instructions */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>1. Download & Fill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p>
              Download our generated Excel template. It contains built-in
              validation for:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">
                  Dynamic Couriers:
                </strong>{" "}
                Automatically lists only active couriers in MongoDB
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">
                  Delivery Region:
                </strong>{" "}
                Inside Kathmandu Valley
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">
                  Customer & Phone:
                </strong>{" "}
                Validated for order linking
              </li>
            </ul>
            <div className="pt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownloadTemplate}
                className="w-full text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>Get Template (.xlsx)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 File Upload Box */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>2. Upload Completed Spreadsheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <UploadCloud className="w-10 h-10 text-brand-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Choose Excel file to validate
              </p>
              <p className="text-xs text-slate-400 mt-0.5 mb-3">
                Supports .xlsx spreadsheets up to 1000 parcels per batch
              </p>

              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />
              <label htmlFor="excel-file-input">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() =>
                    document.getElementById("excel-file-input")?.click()
                  }
                >
                  Browse Excel File
                </Button>
              </label>

              {file && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-lg text-xs font-semibold">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{file.name}</span>
                  <span className="text-[10px] text-slate-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                disabled={!file}
                isLoading={uploading}
                onClick={handleUploadAndValidate}
              >
                <RotateCw className="w-4 h-4 mr-1.5" />
                <span>Upload & Validate Rows</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 3: Interactive Validation Preview */}
      {previewData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-brand-600">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Rows
              </p>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {previewData.totalRows}
              </h3>
            </Card>

            <Card className="p-4 border-l-4 border-l-emerald-600">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Valid Rows
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>{previewData.validRows.length}</span>
              </h3>
            </Card>

            <Card className="p-4 border-l-4 border-l-rose-600">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Invalid Rows
              </p>
              <h3 className="text-2xl font-extrabold text-rose-600 mt-1 flex items-center gap-1.5">
                <XCircle className="w-5 h-5" />
                <span>{previewData.invalidRows.length}</span>
              </h3>
            </Card>

            <Card className="p-4 border-l-4 border-l-amber-600">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total COD Value
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 truncate">
                {formatCurrency(previewData.totalCodAmount)}
              </h3>
            </Card>
          </div>

          {/* Courier Breakdown Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <CardTitle>Courier-Wise Import Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(previewData.courierBreakdown || {}).map(
                  ([courierName, stats]) => (
                    <div
                      key={courierName}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {courierName}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                        <span>{stats.count} Parcels</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(stats.totalCod)}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invalid Rows Section (If any) */}
          {previewData.invalidRows.length > 0 && (
            <Card className="border-rose-300 dark:border-rose-900 bg-rose-50/20">
              <CardHeader>
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                  <CardTitle className="text-rose-700 dark:text-rose-400">
                    Errors Detected ({previewData.invalidRows.length} Rows)
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={downloadingErrors}
                  onClick={handleDownloadErrorExcel}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Error Excel File</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-100/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Excel Row</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Mobile</th>
                      <th className="py-2.5 px-3">Courier</th>
                      <th className="py-2.5 px-3">Identified Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40">
                    {previewData.invalidRows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-rose-100/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-700">
                          Row {r.rowNumber}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {r.customerName || "-"}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {r.mobileNumber || "-"}
                        </td>
                        <td className="py-2.5 px-3">{r.courierCompany || "-"}</td>
                        <td className="py-2.5 px-3 text-rose-600 font-medium">
                          {r.errors.map((e) => `[${e.column}]: ${e.message}`).join("; ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.invalidRows.length > 10 && (
                  <p className="p-3 text-center text-xs text-rose-600 font-medium">
                    Showing first 10 errors. Download the Error Excel file above to see all {previewData.invalidRows.length} errors.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Valid Rows Preview */}
          <Card>
            <CardHeader>
              <CardTitle>
                Valid Rows Ready for Confirmation ({previewData.validRows.length})
              </CardTitle>
              <span className="text-xs text-slate-500">
                Previewing first 5 rows
              </span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Excel Row</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Mobile</th>
                    <th className="py-2.5 px-3">Courier</th>
                    <th className="py-2.5 px-3">Item SKU</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">COD Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewData.validRows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        Row {r.rowNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {r.customerName}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{r.mobileNumber}</td>
                      <td className="py-2.5 px-3 font-medium">{r.courierCompany}</td>
                      <td className="py-2.5 px-3 font-mono">{r.itemSku}</td>
                      <td className="py-2.5 px-3 text-center">{r.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(r.codAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Confirm or Cancel Bottom Action Bar */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Ready to commit {previewData.validRows.length} valid parcels?
              </p>
              <p className="text-xs text-slate-500">
                Unique Order IDs will be generated and customers automatically linked.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPreviewData(null);
                  setFile(null);
                }}
              >
                Cancel Import
              </Button>
              <Button
                variant="success"
                isLoading={confirming}
                disabled={previewData.validRows.length === 0}
                onClick={handleConfirmImport}
                className="font-bold shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Confirm & Import ({previewData.validRows.length})</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

