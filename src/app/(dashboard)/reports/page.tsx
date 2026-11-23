"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  Building2,
  Printer,
  Search,
  Package,
  TrendingUp,
  Receipt,
  DollarSign,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  CreditCard,
  Banknote,
  ArrowUpRight,
  Percent,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Coins,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ICourierCompany, IParcel, ParcelStatus } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";

interface CompanySalesData {
  totalDispatched: number;
  totalDelivered: number;
  totalReturned: number;
  totalPending: number;
  customerAdvance: number;
  deliveredCod: number;
  totalOrderValue: number;
  deliveryCharges: number;
  netReceivable: number;
  profitBeforeTax?: number;
  deliveryRate: number;
  returnRate: number;
  pendingRate: number;
}

export interface AdvanceParcelItem {
  _id: string;
  parcelId: string;
  batchId: string;
  courierId?: string;
  courierName?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  advancePayment: number;
  codAmount: number;
  totalOrderValue: number;
  itemSku: string;
  status: string;
  dispatchDate: string;
  deliveredDate?: string;
}

export interface AdvanceBatchItem {
  batchId: string;
  courierName: string;
  dispatchDate: string;
  totalAdvance: number;
  ordersCount: number;
}

export interface AdvanceReportData {
  totalAdvance: number;
  ordersCount: number;
  batchesCount: number;
  batches: AdvanceBatchItem[];
  parcels: AdvanceParcelItem[];
}

interface CourierReportData {
  courier: ICourierCompany;
  totalDispatched: number;
  deliveredCount: number;
  returnedCount: number;
  pendingCount: number;
  deliveryRate: number;
  returnRate: number;
  pendingRate: number;
  codIncome: number;
  advancePaid: number;
  orderValue: number;
  deliveryCharges: number;
  netReceivable: number;
  outstandingBalance: number;
  parcels: IParcel[];
}

export default function ReportsPage() {
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [companySales, setCompanySales] = useState<CompanySalesData | null>(null);
  const [courierReport, setCourierReport] = useState<CourierReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCourier, setLoadingCourier] = useState<boolean>(false);

  // Courier Parcels Sub-filter inside the selected courier view
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [parcelStatusFilter, setParcelStatusFilter] = useState<string>("all");
  const [parcelSearch, setParcelSearch] = useState<string>("");

  // Customer Advance Payments Audit State
  const [advanceReport, setAdvanceReport] = useState<AdvanceReportData | null>(null);
  const [showAdvanceSection, setShowAdvanceSection] = useState<boolean>(true);
  const [advanceBatchFilter, setAdvanceBatchFilter] = useState<string>("all");
  const [advanceSearch, setAdvanceSearch] = useState<string>("");

  // Load couriers list on initial mount
  useEffect(() => {
    fetch("/api/couriers?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.couriers) {
          setCouriers(data.couriers);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch sales dashboard and courier report
  const fetchReportData = (courierIdToFetch = selectedCourierId) => {
    if (courierIdToFetch) {
      setLoadingCourier(true);
    } else {
      setLoading(true);
    }

    let url = `/api/reports?type=dashboard`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    if (courierIdToFetch) url += `&courierId=${encodeURIComponent(courierIdToFetch)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCompanySales(data.companySales);
          if (data.advanceReport) {
            setAdvanceReport(data.advanceReport);
          }
          if (courierIdToFetch && data.courierReport) {
            setCourierReport(data.courierReport);
          } else if (!courierIdToFetch) {
            setCourierReport(null);
          }
          if (data.couriers && data.couriers.length > 0 && couriers.length === 0) {
            setCouriers(data.couriers);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching reports data:", err);
        toast.error("Failed to load report data");
      })
      .finally(() => {
        setLoading(false);
        setLoadingCourier(false);
      });
  };

  // Re-fetch on date filter change or courier selection change
  useEffect(() => {
    fetchReportData(selectedCourierId);
  }, [startDate, endDate, selectedCourierId]);

  // Extract unique batches for the chosen courier
  const courierBatches = useMemo(() => {
    if (!courierReport || !courierReport.parcels) return [];
    const map = new Map<
      string,
      {
        batchId: string;
        date: string;
        total: number;
        delivered: number;
        returned: number;
        pending: number;
        cod: number;
        charges: number;
      }
    >();

    for (const p of courierReport.parcels) {
      const bId = p.batchId || "Unassigned";
      if (!map.has(bId)) {
        map.set(bId, {
          batchId: bId,
          date: p.dispatchDate || "",
          total: 0,
          delivered: 0,
          returned: 0,
          pending: 0,
          cod: 0,
          charges: 0,
        });
      }
      const entry = map.get(bId)!;
      entry.total += 1;
      if (p.status === "Returned to Warehouse" || p.status === "Return Initiated") {
        entry.returned += 1;
      } else {
        entry.delivered += 1;
        entry.cod += Number(p.codAmount) || 0;
        entry.charges += Number(p.deliveryCharge) || 0;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.batchId.localeCompare(a.batchId));
  }, [courierReport]);

  const selectedBatchSummary = useMemo(() => {
    if (!selectedBatchId) return null;
    return courierBatches.find((b) => b.batchId === selectedBatchId) || null;
  }, [courierBatches, selectedBatchId]);

  // Filtered parcels for the chosen batch under the chosen courier
  const filteredCourierParcels = useMemo(() => {
    if (!courierReport || !courierReport.parcels || !selectedBatchId) return [];
    return courierReport.parcels.filter((p) => {
      // Must match selected batch
      if (p.batchId !== selectedBatchId) return false;

      // Status filter
      if (parcelStatusFilter === "Delivered" && p.status !== "Delivered") return false;
      if (
        parcelStatusFilter === "Returned" &&
        p.status !== "Returned to Warehouse" &&
        p.status !== "Return Initiated"
      )
        return false;
      if (
        parcelStatusFilter === "Pending" &&
        (p.status === "Delivered" ||
          p.status === "Returned to Warehouse" ||
          p.status === "Return Initiated")
      )
        return false;

      // Text search
      if (parcelSearch.trim()) {
        const q = parcelSearch.trim().toLowerCase();
        const matchId = p.parcelId?.toLowerCase().includes(q);
        const matchBatch = p.batchId?.toLowerCase().includes(q);
        const matchName = p.customerName?.toLowerCase().includes(q);
        const matchPhone = p.customerPhone?.includes(q);
        const matchSku = p.itemSku?.toLowerCase().includes(q);
        if (!matchId && !matchBatch && !matchName && !matchPhone && !matchSku) return false;
      }

      return true;
    });
  }, [courierReport, selectedBatchId, parcelStatusFilter, parcelSearch]);

  // Filtered parcels with customer advance payments
  const filteredAdvanceParcels = useMemo(() => {
    if (!advanceReport || !advanceReport.parcels) return [];
    let list = advanceReport.parcels;

    if (advanceBatchFilter && advanceBatchFilter !== "all") {
      list = list.filter((p) => p.batchId === advanceBatchFilter);
    }

    if (advanceSearch.trim()) {
      const q = advanceSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.customerName.toLowerCase().includes(q) ||
          p.customerPhone.includes(q) ||
          (p.customerAddress && p.customerAddress.toLowerCase().includes(q)) ||
          p.batchId.toLowerCase().includes(q) ||
          p.parcelId.toLowerCase().includes(q) ||
          (p.courierName && p.courierName.toLowerCase().includes(q)) ||
          p.itemSku.toLowerCase().includes(q)
      );
    }

    return list;
  }, [advanceReport, advanceBatchFilter, advanceSearch]);

  // Export CSV for selected courier report
  const handleExportCourierCSV = () => {
    if (!courierReport || filteredCourierParcels.length === 0) {
      toast.error("Please choose a Batch ID with parcel records to export");
      return;
    }

    const headers = [
      "Parcel ID",
      "Batch ID",
      "Customer Name",
      "Customer Phone",
      "COD Amount (Rs.)",
      "Advance Paid (Rs.)",
      "Total Order Value (Rs.)",
      "Delivery Charge (Rs.)",
      "Status",
      "Return Reason",
      "Dispatch Date",
      "Return Date",
    ];

    const rows = filteredCourierParcels.map((p) => [
      `"${p.parcelId || ""}"`,
      `"${p.batchId || ""}"`,
      `"${p.customerName || ""}"`,
      `"${p.customerPhone || ""}"`,
      p.codAmount || 0,
      p.advancePayment || 0,
      (p.codAmount || 0) + (p.advancePayment || 0),
      p.deliveryCharge || 0,
      `"${p.status || ""}"`,
      `"${p.returnReason || ""}"`,
      `"${p.dispatchDate || ""}"`,
      `"${p.returnDate || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const batchSuffix = selectedBatchId ? `_Batch_${selectedBatchId}` : "";
    link.download = `Courier_${courierReport.courier?.name || "Report"}${batchSuffix}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Courier batch performance CSV exported successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              Executive Analytics
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Company Sales & Courier Progress Reports</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time COD & customer advance sales overview with on-demand courier performance audits
          </p>
        </div>

        {/* Global Date Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <DateQuickFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          <button
            onClick={() => fetchReportData(selectedCourierId)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-xs"
            title="Refresh sales and courier metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TOP SECTION: COMPANY COD & ADVANCE SALES DASHBOARD     */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              OVERALL FINANCIAL METRICS
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Company Sales Dashboard (COD & Advance)</span>
            </h2>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Period:{" "}
            <strong>
              {startDate && endDate
                ? `${startDate} to ${endDate}`
                : startDate
                ? `From ${startDate}`
                : "All Time (Cumulative)"}
            </strong>
          </div>
        </div>

        {/* 4 Primary Sales KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Order Value / Gross Sales */}
          <div className="p-4 rounded-xl bg-linear-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/10 border border-emerald-200/80 dark:border-emerald-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Total Order Value
              </span>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
              Rs. {(companySales?.totalOrderValue || 0).toLocaleString("en-IN")}
            </p>
            <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
              <span>Gross Sales (Advance + COD)</span>
              <span className="font-bold">{companySales?.totalDelivered || 0} Delivered</span>
            </div>
          </div>

          {/* Card 2: Customer Advance Payment Received */}
          <div className="p-4 rounded-xl bg-linear-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/10 border border-amber-200/80 dark:border-amber-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Advance Paid by Customers
                </span>
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-2">
                Rs. {(companySales?.customerAdvance || 0).toLocaleString("en-IN")}
              </p>
              <div className="flex items-center justify-between text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                <span>Pre-payments received by seller</span>
                <span className="font-bold font-mono">
                  {companySales && companySales.totalOrderValue > 0
                    ? `${(
                        (companySales.customerAdvance / companySales.totalOrderValue) *
                        100
                      ).toFixed(1)}% of sales`
                    : "0%"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAdvanceSection(true);
                const el = document.getElementById("advance-audit-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-3 w-full py-1.5 px-2 rounded-lg bg-amber-100/90 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Audit By Batch ({advanceReport?.ordersCount || 0} Orders)</span>
            </button>
          </div>

          {/* Card 3: Total Delivery Charges Paid (Courier Fees Expense) */}
          <div className="p-4 rounded-xl bg-linear-to-br from-rose-50/80 to-red-50/40 dark:from-rose-950/30 dark:to-red-950/10 border border-rose-200/80 dark:border-rose-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Total Delivery Charge Paid
              </span>
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-2">
              Rs. {(companySales?.deliveryCharges || 0).toLocaleString("en-IN")}
            </p>
            <div className="flex items-center justify-between text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1">
              <span>Paid for {companySales?.totalDelivered || 0} delivered parcels</span>
              <span className="font-bold font-mono">Courier Fee</span>
            </div>
          </div>

          {/* Card 4: Profit Before Tax (Delivered COD + Advance - Delivery Fees) */}
          <div className="p-4 rounded-xl bg-linear-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 border-2 border-emerald-500/40 dark:border-emerald-600/50 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Profit Before Tax
              </span>
              <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-2">
              Rs. {(
                companySales?.profitBeforeTax !== undefined
                  ? companySales.profitBeforeTax
                  : ((companySales?.deliveredCod || 0) + (companySales?.customerAdvance || 0) - (companySales?.deliveryCharges || 0))
              ).toLocaleString("en-IN")}
            </p>
            <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
              <span
                className="truncate"
                title={`Delivered COD (Rs. ${(companySales?.deliveredCod || 0).toLocaleString("en-IN")}) + Advance (Rs. ${(companySales?.customerAdvance || 0).toLocaleString("en-IN")}) - Delivery Fee (Rs. ${(companySales?.deliveryCharges || 0).toLocaleString("en-IN")})`}
              >
                COD + Advance - Delivery Fee
              </span>
              <span className="font-bold text-emerald-800 dark:text-emerald-200 shrink-0">
                Net Profit
              </span>
            </div>
            <div className="mt-2 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-800/60 pt-1.5">
              <span>Includes Advance Revenue:</span>
              <span className="font-bold font-mono">+ Rs. {(companySales?.customerAdvance || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Company Delivery & Return Fulfillment Rate Progress Bar */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Total Dispatched Orders: {companySales?.totalDispatched || 0} packages
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Delivered: {companySales?.totalDelivered || 0} ({companySales?.deliveryRate || 0}%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Returned: {companySales?.totalReturned || 0} ({companySales?.returnRate || 0}%)
              </span>
              {(companySales?.totalPending || 0) > 0 && (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Pending / In-Transit: {companySales?.totalPending || 0} ({companySales?.pendingRate || 0}%)
                </span>
              )}
            </div>
          </div>

          {/* Progress Stack Bar */}
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
            <div
              style={{ width: `${companySales?.deliveryRate || 0}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Delivered: ${companySales?.deliveryRate || 0}%`}
            />
            <div
              style={{ width: `${companySales?.returnRate || 0}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`Returned: ${companySales?.returnRate || 0}%`}
            />
            {(companySales?.pendingRate || 0) > 0 && (
              <div
                style={{ width: `${companySales?.pendingRate || 0}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`Pending / In-Transit: ${companySales?.pendingRate || 0}%`}
              />
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1.5 ADVANCE PAYMENTS AUDIT (BATCH-WISE & CUSTOMER DETAIL) */}
      {/* ========================================================= */}
      <div
        id="advance-audit-section"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 p-6 shadow-sm space-y-5"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 dark:border-amber-950 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mt-0.5 shadow-2xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  ADVANCE PAYMENT REVENUE TRACKER
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {advanceReport?.ordersCount || 0} Orders
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Total Advance: Rs. {(advanceReport?.totalAdvance || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                <span>Batch-Wise Customer Advance Payments & Audit</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Check which batch how much customer advance was collected, who paid it (with full contact details), and how it is credited to company sales profit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanceSection(!showAdvanceSection)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              {showAdvanceSection ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Expand ({advanceReport?.ordersCount || 0} Orders)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showAdvanceSection && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Batch Cards / Summary Pills */}
            {advanceReport && advanceReport.batches.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Advance Payments by Dispatch Batch:</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Click any batch to filter customer records below
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdvanceBatchFilter("all");
                      setAdvanceSearch("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      advanceBatchFilter === "all"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    All Batches (Rs. {advanceReport.totalAdvance.toLocaleString("en-IN")})
                  </button>

                  {advanceReport.batches.map((b) => {
                    const isSelected = advanceBatchFilter === b.batchId;
                    return (
                      <button
                        key={b.batchId}
                        type="button"
                        onClick={() => {
                          setAdvanceBatchFilter(b.batchId);
                          setAdvanceSearch("");
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400"
                        }`}
                      >
                        <span className="font-mono font-bold">{b.batchId}</span>
                        <span
                          className={`text-[11px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isSelected
                              ? "bg-amber-600 text-white"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          Rs. {b.totalAdvance.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] opacity-80">({b.ordersCount} pkg)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Controls: Search and Batch Filter Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <select
                  value={advanceBatchFilter}
                  onChange={(e) => setAdvanceBatchFilter(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">
                    -- All Batches ({advanceReport?.totalAdvance.toLocaleString("en-IN")} NPR Total) --
                  </option>
                  {advanceReport?.batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} ({b.courierName} • Rs. {b.totalAdvance.toLocaleString("en-IN")} • {b.ordersCount} orders)
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Customer, Mobile, SKU, Batch..."
                  value={advanceSearch}
                  onChange={(e) => setAdvanceSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Customer Advance Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">S.N.</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">CUSTOMER NAME</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">MOBILE NUMBER</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">BATCH ID</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">PARCEL ID</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">ADVANCE PAID</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">COD BALANCE</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">TOTAL ORDER</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">SKU / ITEM</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">DISPATCH DATE</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredAdvanceParcels.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        {advanceReport && advanceReport.parcels.length > 0
                          ? "No advance payment records match the search filter."
                          : "No customer advance payments recorded in this period. Advance payments entered during parcel entry will automatically appear here and in Company Profit Before Tax."}
                      </td>
                    </tr>
                  ) : (
                    filteredAdvanceParcels.map((p, idx) => {
                      const isDelivered = p.status === "Delivered";
                      const isReturned = p.status === "Returned to Warehouse" || p.status === "Return Initiated";
                      return (
                        <tr key={p._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {p.customerName}
                            </div>
                            {p.customerAddress && p.customerAddress !== "-" && (
                              <div
                                className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[170px]"
                                title={p.customerAddress}
                              >
                                {p.customerAddress}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {p.customerPhone}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{p.batchId}</span>
                            <span className="text-[10px] text-slate-400 block">{p.courierName}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{p.parcelId}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-amber-600 dark:text-amber-400 text-xs">
                            Rs. {p.advancePayment.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            Rs. {p.codAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-600 dark:text-slate-400">
                            Rs. {p.totalOrderValue.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                            {p.itemSku}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{p.dispatchDate}</td>
                          <td className="py-2.5 px-3 text-center">
                            {isDelivered ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Delivered</span>
                              </span>
                            ) : isReturned ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                <RotateCcw className="w-3 h-3 text-rose-600" />
                                <span>Returned</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{p.status}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. BOTTOM SECTION: COURIER PERFORMANCE & PROGRESS         */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        {/* Section Header & Courier Selector Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              LOGISTICS PARTNER AUDIT
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Courier Progress & Status Inspector</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select any courier to check their delivered COD income, delivery success rate (%), and return rate (%)
            </p>
          </div>

          {/* Courier Selection Dropdown */}
          <div className="flex items-center gap-2 sm:w-auto w-full">
            <div className="relative flex-1 sm:w-80">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedCourierId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCourierId(val);
                  setSelectedBatchId("");
                  setParcelStatusFilter("all");
                  setParcelSearch("");
                }}
                className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Choose Courier to Inspect Performance --</option>
                {couriers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.serviceArea || "Inside Valley"})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {selectedCourierId && (
              <button
                onClick={() => {
                  setSelectedCourierId("");
                  setSelectedBatchId("");
                  setCourierReport(null);
                }}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Clear courier selection"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* STATE A: NO COURIER CHOSEN YET */}
        {!selectedCourierId && (
          <div className="py-14 px-6 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 max-w-2xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Select a Courier Partner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Choose any courier from the dropdown above to view their delivered COD income, delivery success rate (%), and return percentage rate.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {couriers.slice(0, 4).map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCourierId(c._id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all shadow-2xs"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STATE B: COURIER IS SELECTED -> SHOW PROGRESS & STATS */}
        {selectedCourierId && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {loadingCourier ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                <span>Loading courier performance data...</span>
              </div>
            ) : courierReport ? (
              <>
                {/* Courier Header Bar with Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-xs">
                      {courierReport.courier?.code || "CR"}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{courierReport.courier?.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {courierReport.courier?.serviceArea || "Inside Valley"}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Contact: {courierReport.courier?.contactPerson || "-"} • Phone:{" "}
                        {courierReport.courier?.phone || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white text-slate-700 dark:text-slate-200 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={handleExportCourierCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* 4 Courier Key Performance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Metric 1: COD Income from this Courier */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      COD Income Collected
                    </span>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                      Rs. {(courierReport.codIncome || 0).toLocaleString("en-IN")}
                    </p>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      From {courierReport.deliveredCount} delivered packages
                    </span>
                  </div>

                  {/* Metric 2: Delivered Percentage Rate */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Delivery Success Rate
                      </span>
                      <span className="p-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">
                        SUCCESS
                      </span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                      {courierReport.deliveryRate}%
                    </p>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                      {courierReport.deliveredCount} of {courierReport.totalDispatched} dispatched delivered
                    </span>
                  </div>

                  {/* Metric 3: Return Percentage Rate */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Return Percentage Rate
                      </span>
                      <span className="p-1 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 text-[10px] font-bold">
                        RETURNS
                      </span>
                    </div>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                      {courierReport.returnRate}%
                    </p>
                    <span className="text-[11px] text-rose-600/90 font-semibold mt-0.5 block">
                      {courierReport.returnedCount} of {courierReport.totalDispatched} returned to warehouse
                    </span>
                  </div>

                  {/* Metric 4: Net Receivable from this Courier */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Net Receivable Due
                    </span>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono mt-1">
                      Rs. {(courierReport.netReceivable || 0).toLocaleString("en-IN")}
                    </p>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Less Rs. {(courierReport.deliveryCharges || 0).toLocaleString("en-IN")} delivery fees
                    </span>
                  </div>
                </div>

                {/* Progress Bar for this selected courier */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">
                      {courierReport.courier?.name} Fulfillment Ratio
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-600">Delivered: {courierReport.deliveryRate}%</span>
                      <span className="text-rose-600">Returned: {courierReport.returnRate}%</span>
                      {courierReport.pendingRate > 0 && (
                        <span className="text-amber-600">In Transit: {courierReport.pendingRate}%</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    <div
                      style={{ width: `${courierReport.deliveryRate}%` }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{ width: `${courierReport.returnRate}%` }}
                      className="bg-rose-500 h-full"
                    />
                    <div
                      style={{ width: `${courierReport.pendingRate}%` }}
                      className="bg-amber-400 h-full"
                    />
                  </div>
                </div>

                {/* Courier Dispatched Batch Selector (Required to view customer details) */}
                <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/90 dark:border-slate-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Dispatched Batch Selector
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Step 2: Choose Batch
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Select a Batch ID below to view customer delivery details, contact numbers, and return reasons.
                      </p>
                    </div>

                    {/* Batch Dropdown */}
                    <div className="relative w-full sm:w-80">
                      <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <select
                        value={selectedBatchId}
                        onChange={(e) => {
                          setSelectedBatchId(e.target.value);
                          setParcelStatusFilter("all");
                          setParcelSearch("");
                        }}
                        className="w-full pl-9 pr-8 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer appearance-none"
                      >
                        <option value="">-- Choose Batch ID to View Customer Details --</option>
                        {courierBatches.map((b) => (
                          <option key={b.batchId} value={b.batchId}>
                            {b.batchId} ({b.total} pkgs • {b.delivered} Del • {b.returned} Ret{b.date ? ` • ${b.date}` : ""})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Quick Select Batch Pills */}
                  {courierBatches.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Select:</span>
                      {courierBatches.map((b) => {
                        const isSelected = selectedBatchId === b.batchId;
                        return (
                          <button
                            key={b.batchId}
                            type="button"
                            onClick={() => {
                              setSelectedBatchId(b.batchId);
                              setParcelStatusFilter("all");
                              setParcelSearch("");
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all border ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600"
                            }`}
                          >
                            <span>{b.batchId}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected
                                  ? "bg-blue-700 text-blue-100"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {b.total} pkgs
                            </span>
                          </button>
                        );
                      })}
                      {selectedBatchId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBatchId("");
                            setParcelStatusFilter("all");
                            setParcelSearch("");
                          }}
                          className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold underline ml-2 transition"
                        >
                          Clear Batch
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic pt-1">
                      No dispatch batches found for {courierReport.courier?.name} in this date filter.
                    </div>
                  )}
                </div>

                {/* CONDITION 1: NO BATCH SELECTED YET */}
                {!selectedBatchId ? (
                  <div className="py-12 px-6 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 max-w-xl mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-xs">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Choose a Batch ID Above to View Customer Deliveries
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                        Customer names, mobile numbers, delivered COD amounts, and return reasons will appear here once you select a batch.
                      </p>
                    </div>
                    {courierBatches.length > 0 && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBatchId(courierBatches[0].batchId)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Latest Batch: {courierBatches[0].batchId}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* CONDITION 2: BATCH SELECTED -> SHOW BATCH BANNER & CUSTOMER TABLE */
                  <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                    {/* Active Selected Batch Summary Banner */}
                    <div className="p-4 rounded-xl bg-linear-to-r from-blue-50/90 to-indigo-50/40 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200/90 dark:border-blue-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-600 text-white font-mono font-bold text-sm shadow-xs">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                              {selectedBatchId}
                            </span>
                            {selectedBatchSummary?.date && (
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                (Dispatched: {selectedBatchSummary.date})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Fulfillment breakdown for this batch under {courierReport.courier?.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                        <div className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Total Parcels</span>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                            {selectedBatchSummary?.total || 0}
                          </span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold block">
                            Delivered COD
                          </span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            Rs. {(selectedBatchSummary?.cod || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Delivered Rate</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {selectedBatchSummary?.total
                              ? Math.round(((selectedBatchSummary.delivered || 0) / selectedBatchSummary.total) * 100)
                              : 0}% ({selectedBatchSummary?.delivered || 0})
                          </span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] uppercase text-rose-500 font-bold block">Returns</span>
                          <span className="text-sm font-bold text-rose-600">
                            {selectedBatchSummary?.total
                              ? Math.round(((selectedBatchSummary.returned || 0) / selectedBatchSummary.total) * 100)
                              : 0}% ({selectedBatchSummary?.returned || 0})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Table Control Bar: Status Tabs & Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <button
                          onClick={() => setParcelStatusFilter("all")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                            parcelStatusFilter === "all"
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          All ({selectedBatchSummary?.total || 0})
                        </button>
                        <button
                          onClick={() => setParcelStatusFilter("Delivered")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                            parcelStatusFilter === "Delivered"
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          Delivered ({selectedBatchSummary?.delivered || 0})
                        </button>
                        <button
                          onClick={() => setParcelStatusFilter("Returned")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                            parcelStatusFilter === "Returned"
                              ? "bg-rose-600 text-white"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          Returned ({selectedBatchSummary?.returned || 0})
                        </button>
                        {(selectedBatchSummary?.pending || 0) > 0 && (
                          <button
                            onClick={() => setParcelStatusFilter("Pending")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              parcelStatusFilter === "Pending"
                                ? "bg-amber-600 text-white"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            Pending ({selectedBatchSummary?.pending || 0})
                          </button>
                        )}
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search Mobile, Customer, SKU..."
                          value={parcelSearch}
                          onChange={(e) => setParcelSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Customer Deliveries Table */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden overflow-x-auto shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">S.N.</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">PARCEL ID</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">CUSTOMER</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">MOBILE NUMBER</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">COD (RS.)</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">ADVANCE (RS.)</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">CHARGE (RS.)</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-center">STATUS</th>
                            <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300">RETURN REASON / NOTES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {filteredCourierParcels.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-slate-400">
                                No customer records found matching this status filter in Batch {selectedBatchId}.
                              </td>
                            </tr>
                          ) : (
                            filteredCourierParcels.map((p, idx) => {
                              const isReturned =
                                p.status === "Returned to Warehouse" || p.status === "Return Initiated";
                              const isDelivered = p.status === "Delivered";

                              return (
                                <tr key={p._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                  <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>

                                  <td className="py-2.5 px-3 font-mono">
                                    <div className="font-bold text-blue-600 dark:text-blue-400">
                                      {p.parcelId}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{p.batchId}</div>
                                  </td>

                                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                    {p.customerName || "-"}
                                  </td>

                                  <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                                    {p.customerPhone}
                                  </td>

                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    Rs. {(p.codAmount || 0).toLocaleString("en-IN")}
                                  </td>

                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-600">
                                    {(p.advancePayment || 0) > 0
                                      ? `Rs. ${(p.advancePayment || 0).toLocaleString("en-IN")}`
                                      : "-"}
                                  </td>

                                  <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                                    Rs. {p.deliveryCharge || 0}
                                  </td>

                                  <td className="py-2.5 px-3 text-center">
                                    {isDelivered ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Delivered</span>
                                      </span>
                                    ) : isReturned ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                        <RotateCcw className="w-3 h-3 text-rose-600" />
                                        <span>Returned</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>{p.status}</span>
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                                    {p.returnReason ? (
                                      <span className="text-rose-600 font-medium">
                                        {p.returnReason}
                                      </span>
                                    ) : p.remarks ? (
                                      <span>{p.remarks}</span>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
