"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  PlusCircle,
  RotateCcw,
  Receipt,
  Boxes,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ICourierCompany } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourier, setSelectedCourier] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = () => {
    fetch("/api/couriers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.couriers) {
          setCouriers(data.couriers);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedCourier, startDate, endDate]);

  const fetchDashboardStats = () => {
    setLoading(true);
    let url = "/api/dashboard/stats?";
    if (selectedCourier !== "all") url += `courierId=${selectedCourier}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
            DaisyHub E-Commerce Pvt. Ltd.
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Courier Logistics & COD Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of parcel dispatches, delivery reconciliations, and courier COD settlement dues
          </p>
        </div>

        {/* Quick Action Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/parcels/new">
            <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all">
              <PlusCircle className="w-4 h-4" />
              <span>Bulk Parcel Entry</span>
            </button>
          </Link>
          <Link href="/returns">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 dark:text-rose-400 transition-all">
              <RotateCcw className="w-4 h-4" />
              <span>Inward Return</span>
            </button>
          </Link>
          <Link href="/settlements">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-all">
              <Receipt className="w-4 h-4" />
              <span>COD Settlement</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Date & Courier Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
              className="font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Courier Partners</option>
              {couriers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <DateQuickFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>

        {startDate || endDate ? (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-blue-600 hover:underline font-semibold"
          >
            Reset All
          </button>
        ) : null}
      </div>

      {/* 6 Required Primary KPI Cards (Pending / In Transit removed as requested) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Dispatched Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Dispatched Today
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats?.dispatchedToday ?? 0}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Parcels</span>
        </div>

        {/* Total Delivered */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Total Delivered
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {stats?.totalDelivered ?? 0}
          </p>
          <span className="text-[10px] text-emerald-700/80 mt-1 block">Confirmed delivered</span>
        </div>

        {/* Total Returned */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950 shadow-sm">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
            Total Returned
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {stats?.totalReturned ?? 0}
          </p>
          <span className="text-[10px] text-rose-700/80 mt-1 block">Inward warehouse</span>
        </div>

        {/* Total COD Collected */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            COD Collected
          </span>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
            Rs. {(stats?.totalCodCollected || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">From delivered</span>
        </div>

        {/* Total Delivery Charges */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
            Delivery Charges
          </span>
          <p className="text-xl font-bold font-mono text-rose-500 mt-1">
            Rs. {(stats?.totalDeliveryCharges || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">For delivered packages</span>
        </div>

        {/* Total Outstanding from Couriers */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
            Total Outstanding
          </span>
          <p className="text-xl font-black font-mono text-white mt-1">
            Rs. {(stats?.totalOutstanding || 0).toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Net receivable (COD - Fees)</span>
        </div>
      </div>

      {/* Courier-wise Performance Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Courier Partner Performance & Outstanding Balance
            </h3>
            <p className="text-xs text-slate-500">
              Live delivery success rates, collected COD, and financial balance per courier
            </p>
          </div>
          <Link href="/couriers">
            <button className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
              <span>Manage Couriers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">COURIER PARTNER</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">CONTACT PERSON</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">TOTAL DISPATCHED</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">DELIVERED</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">RETURNED</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">SUCCESS RATE</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">COLLECTED COD</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">OUTSTANDING DUE</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading performance data...</td>
                </tr>
              ) : !stats?.courierPerformance || stats.courierPerformance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">No courier statistics available.</td>
                </tr>
              ) : (
                stats.courierPerformance.map((c: any) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {c.contactPerson} ({c.phone})
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-200">
                      {c.totalDispatched}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                      {c.delivered}
                    </td>
                    <td className="py-3 px-4 text-center text-rose-600 font-bold">
                      {c.returned}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {c.deliveryRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      Rs. {c.totalCod.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      Rs. {c.outstanding.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <Link href={`/ledger?courierId=${c._id}`}>
                        <button className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors">
                          Ledger
                        </button>
                      </Link>
                      <Link href={`/settlements?courierId=${c._id}`}>
                        <button className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 transition-colors">
                          Settle
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Dispatches & Parcels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Batches */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Recent Dispatch Batches
              </h3>
            </div>
            <Link href="/batches" className="text-xs text-blue-600 font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {stats?.recentBatches?.map((b: any) => (
              <div key={b._id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-blue-600">{b.batchId}</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                    {b.courierName} • {b.dispatchDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {b.totalParcels} parcels
                  </span>
                  <span className="block text-[11px] text-slate-500 font-mono">
                    Rs. {b.totalCodAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Parcels */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Latest Parcel Activity
              </h3>
            </div>
            <Link href="/parcels" className="text-xs text-blue-600 font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {stats?.recentParcels?.slice(0, 5).map((p: any) => (
              <div key={p._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono text-blue-600 font-semibold">{p.parcelId}</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {p.customerName} ({p.customerPhone})
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.status === "Delivered"
                        ? "bg-emerald-50 text-emerald-700"
                        : p.status === "Returned to Warehouse"
                        ? "bg-rose-50 text-rose-700"
                        : p.status === "Delivery Attempt Failed"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {p.status}
                  </span>
                  <span className="block text-[11px] font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    Rs. {p.codAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
