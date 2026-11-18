"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Building2,
  Printer,
  Download,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ICourierCompany, ICourierLedgerEntry } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";

export default function CourierLedgerPage() {
  const searchParams = useSearchParams();
  const courierQuery = searchParams.get("courierId");

  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState(courierQuery || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [ledgerData, setLedgerData] = useState<{
    courier: ICourierCompany;
    openingBalance: number;
    deliveredCod: number;
    deliveryCharges: number;
    returnCharges: number;
    paymentsReceived: number;
    adjustments: number;
    closingBalance: number;
    entries: ICourierLedgerEntry[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = () => {
    fetch("/api/couriers?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.couriers?.length > 0) {
          setCouriers(data.couriers);
          if (!selectedCourierId) {
            setSelectedCourierId(courierQuery || data.couriers[0]._id);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (!selectedCourierId) return;
    setLoading(true);
    let url = `/api/ledger?courierId=${selectedCourierId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.ledger) {
          setLedgerData(data.ledger);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCourierId, startDate, endDate]);

  const handleExportCSV = () => {
    if (!ledgerData || ledgerData.entries.length === 0) {
      toast.error("No entries to export");
      return;
    }

    const headers = [
      "Date",
      "Transaction Type",
      "Reference Number",
      "Description",
      "Debit (NPR)",
      "Credit (NPR)",
      "Running Balance (NPR)",
    ];

    const rows = ledgerData.entries.map((e) => [
      e.transactionDate,
      `"${e.transactionType}"`,
      `"${e.referenceNumber || ""}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.debit || 0,
      e.credit || 0,
      e.runningBalance || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Ledger_${ledgerData.courier.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ledger CSV downloaded!");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Courier Financial Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official double-entry running balance journal for each courier partner
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Courier & Date Filter Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Courier:
            </label>
            <select
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              className="text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {couriers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Date Filter Preset & Range:
            </label>
            <DateQuickFilter
              startDate={startDate}
              endDate={endDate}
              onDateChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>
        </div>

        {startDate || endDate ? (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear Date Filter
          </button>
        ) : null}
      </div>

      {/* Ledger KPI Summary Boxes (8 Required Summary Metrics) */}
      {ledgerData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Opening Due
            </span>
            <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1 block">
              Rs. {ledgerData.openingBalance.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-blue-600 block">
              Delivered COD
            </span>
            <span className="text-sm font-bold font-mono text-blue-600 mt-1 block">
              Rs. {ledgerData.deliveredCod.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-rose-600 block">
              Delivery Charges
            </span>
            <span className="text-sm font-bold font-mono text-rose-600 mt-1 block">
              Rs. {ledgerData.deliveryCharges.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-rose-600 block">
              Return Charges
            </span>
            <span className="text-sm font-bold font-mono text-rose-600 mt-1 block">
              Rs. {ledgerData.returnCharges.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Net Billed
            </span>
            <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-1 block">
              Rs. {(ledgerData.deliveredCod - ledgerData.deliveryCharges - ledgerData.returnCharges).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-emerald-600 block">
              Payments
            </span>
            <span className="text-sm font-bold font-mono text-emerald-600 mt-1 block">
              Rs. {ledgerData.paymentsReceived.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">
              Adjustments
            </span>
            <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300 mt-1 block">
              Rs. {ledgerData.adjustments.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-blue-400 block">
              Closing Balance
            </span>
            <span className="text-sm font-black font-mono text-white mt-1 block">
              Rs. {ledgerData.closingBalance.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {/* Ledger Journal Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              General Ledger Entries: {ledgerData?.courier.name}
            </h3>
            <p className="text-xs text-slate-500">
              Representative: {ledgerData?.courier.contactPerson} ({ledgerData?.courier.phone})
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Total Transactions: {ledgerData?.entries.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  DATE
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  TYPE
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  REFERENCE #
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  DESCRIPTION
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  DEBIT (+)
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  CREDIT (-)
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  RUNNING BALANCE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading ledger journal...
                  </td>
                </tr>
              ) : !ledgerData || ledgerData.entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No ledger transactions recorded for this courier partner.
                  </td>
                </tr>
              ) : (
                ledgerData.entries.map((entry) => (
                  <tr
                    key={entry._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {entry.transactionDate}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          entry.transactionType === "Delivered COD"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : entry.transactionType === "Payment Received"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : entry.transactionType === "Delivery Charge" || entry.transactionType === "Return Charge"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {entry.transactionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {entry.referenceNumber || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {entry.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString("en-IN")}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString("en-IN")}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {entry.runningBalance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

