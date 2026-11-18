"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Building2,
  FileSpreadsheet,
  FileText,
  RotateCw,
  ExternalLink,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ReceivablesPayablesPage() {
  const { hasPermission } = useAuth();
  const [ledgers, setLedgers] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({
    totalReceivable: 0,
    totalPayable: 0,
    netBalance: 0,
    totalCodDelivered: 0,
    totalCodReceived: 0,
    totalCourierCharges: 0,
    totalAmountPaid: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ledger");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLedgers(data.ledgers);
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  const triggerExport = (format: "excel" | "pdf") => {
    window.open(`/api/reports/export?type=receivables&format=${format}`, "_blank");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Financial Ledgers: Receivable & Payable Accounts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-grade double-entry courier ledger balancing, COD remissions, and net liquidity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission("reports:export") && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerExport("excel")}
                className="h-9"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Ledger (Excel)</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerExport("pdf")}
                className="h-9"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Export Statement (PDF)</span>
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={fetchLedgers}
            isLoading={loading}
            className="h-9"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Distinction Guide Alert */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-brand-900 dark:text-brand-200">
            Accounting Distinction:
          </p>
          <p className="text-brand-800 dark:text-brand-300">
            <strong>RECEIVABLE:</strong> Money the courier collected from customers on delivered COD parcels and owes to our business.
            <br />
            <strong>PAYABLE:</strong> Delivery service charges and weight fees our business owes to the courier.
          </p>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivable */}
        <StatCard
          title="Total Courier Receivable"
          value={formatCurrency(summary.totalReceivable)}
          icon={ArrowDownLeft}
          accentColor="emerald"
          subtext="Money couriers owe to us"
        />

        {/* Total Payable */}
        <StatCard
          title="Total Courier Payable"
          value={formatCurrency(summary.totalPayable)}
          icon={ArrowUpRight}
          accentColor="amber"
          subtext="Service charges we owe to couriers"
        />

        {/* Net Financial Position */}
        <StatCard
          title="Net Financial Position"
          value={formatCurrency(summary.netBalance)}
          icon={Scale}
          accentColor={summary.netBalance >= 0 ? "emerald" : "rose"}
          subtext={
            summary.netBalance >= 0
              ? "Positive Net Cash Inflow Expected"
              : "Net Cash Outflow Due"
          }
        />

        {/* Total COD Remitted so far */}
        <StatCard
          title="Total COD Collected"
          value={formatCurrency(summary.totalCodReceived)}
          icon={Coins}
          accentColor="blue"
          subtext={`Delivered Gross: ${formatCurrency(summary.totalCodDelivered)}`}
        />
      </div>

      {/* Courier-wise Financial Ledger Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <div>
              <CardTitle>Courier-wise Independent Ledgers</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated dynamically from live MongoDB parcel and settlement records
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Courier Company</th>
                <th className="py-3 px-4">Settlement Model</th>
                <th className="py-3 px-4 text-center">Delivered Parcels</th>
                <th className="py-3 px-4 text-right">Delivered COD</th>
                <th className="py-3 px-4 text-right">Courier Charges</th>
                <th className="py-3 px-4 text-right">COD Received</th>
                <th className="py-3 px-4 text-right">Charges Paid</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-600">
                  Receivable (Owed to Us)
                </th>
                <th className="py-3 px-4 text-right font-bold text-amber-600">
                  Payable (We Owe)
                </th>
                <th className="py-3 px-4 text-right font-black">Net Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Calculating financial ledgers...
                  </td>
                </tr>
              ) : ledgers.length > 0 ? (
                ledgers.map((l, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      <Link
                        href={`/couriers/${l.courierId}`}
                        className="hover:underline hover:text-brand-600"
                      >
                        {String(l.courierName)}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {l.settlementType === "deduct_from_cod" ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Scenario A (Deduct)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          Scenario B (Separate)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {String(l.totalDeliveredParcels)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(Number(l.totalDeliveredCod))}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(Number(l.totalCourierCharges))}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      {formatCurrency(Number(l.totalCodReceived))}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(Number(l.totalAmountPaid))}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                      {formatCurrency(Number(l.receivable))}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-600 dark:text-amber-400 text-sm whitespace-nowrap">
                      {formatCurrency(Number(l.payable))}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                      {formatCurrency(Number(l.netOutstanding))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No active courier ledger data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

