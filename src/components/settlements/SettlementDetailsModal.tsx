"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Receipt,
  CheckCircle2,
  RotateCcw,
  Boxes,
  Printer,
  Search,
  ExternalLink,
  Phone,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Truck,
  Building2,
  Banknote,
  CreditCard,
  Clock,
} from "lucide-react";
import { ISettlement, ICourierCompany, IParcel } from "@/types";

interface ReturnParcelWithMeta extends IParcel {
  returnReason?: string;
  returnDate?: string;
  returnProcessedBy?: string;
}

interface BatchBreakdownItem {
  batchId: string;
  deliveredCount: number;
  returnedCount: number;
  deliveredCod: number;
  totalAdvance: number;
  deliveryCharge: number;
}

interface SettlementDetailsModalProps {
  settlementIdOrNumber: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SettlementDetailsModal({
  settlementIdOrNumber,
  isOpen,
  onClose,
}: SettlementDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [settlement, setSettlement] = useState<ISettlement | null>(null);
  const [courier, setCourier] = useState<ICourierCompany | null>(null);
  const [deliveredParcels, setDeliveredParcels] = useState<IParcel[]>([]);
  const [returnedParcels, setReturnedParcels] = useState<ReturnParcelWithMeta[]>([]);
  const [batchBreakdown, setBatchBreakdown] = useState<BatchBreakdownItem[]>([]);
  const [activeTab, setActiveTab] = useState<"delivered" | "returned" | "batches" | "payments">("delivered");

  const [deliveredSearch, setDeliveredSearch] = useState("");
  const [returnedSearch, setReturnedSearch] = useState("");

  useEffect(() => {
    if (!isOpen || !settlementIdOrNumber) return;

    setLoading(true);
    fetch(`/api/settlements/${encodeURIComponent(settlementIdOrNumber)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settlement) {
          setSettlement(data.settlement);
          setCourier(data.courier);
          setDeliveredParcels(data.deliveredParcels || []);
          setReturnedParcels(data.returnedParcels || []);
          setBatchBreakdown(data.batchBreakdown || []);
        } else {
          setSettlement(null);
        }
      })
      .catch((err) => {
        console.error("Error fetching settlement manifest:", err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, settlementIdOrNumber]);

  // Filtered delivered parcels
  const filteredDelivered = useMemo(() => {
    if (!deliveredSearch.trim()) return deliveredParcels;
    const q = deliveredSearch.toLowerCase();
    return deliveredParcels.filter(
      (p) =>
        p.parcelId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.includes(q) ||
        (p.batchId && p.batchId.toLowerCase().includes(q)) ||
        (p.itemSku && p.itemSku.toLowerCase().includes(q)) ||
        (p.customerAddress && p.customerAddress.toLowerCase().includes(q))
    );
  }, [deliveredParcels, deliveredSearch]);

  // Filtered returned parcels
  const filteredReturned = useMemo(() => {
    if (!returnedSearch.trim()) return returnedParcels;
    const q = returnedSearch.toLowerCase();
    return returnedParcels.filter(
      (p) =>
        p.parcelId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.includes(q) ||
        (p.batchId && p.batchId.toLowerCase().includes(q)) ||
        (p.itemSku && p.itemSku.toLowerCase().includes(q)) ||
        (p.returnReason && p.returnReason.toLowerCase().includes(q))
    );
  }, [returnedParcels, returnedSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Settlement Details & Manifest
                </h2>
                {settlement && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                    {settlement.settlementNumber}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                  Finalized & Settled
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Courier: <strong>{settlement?.courierName || "Courier Partner"}</strong> • Date:{" "}
                <span className="font-mono">{settlement?.settlementDate}</span> • Period:{" "}
                <span className="font-mono">{settlement?.startDate} – {settlement?.endDate}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading settlement customer deliveries and return audit trail...
          </div>
        ) : !settlement ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">Settlement statement not found</p>
            <p className="text-xs text-slate-400 mt-1">Could not find record for {settlementIdOrNumber}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Financial Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Delivered COD
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
                  Rs. {settlement.grossCodCollection.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-400">
                  {settlement.deliveredParcelsCount} parcels
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                  Delivery Charges
                </span>
                <span className="text-base font-extrabold text-rose-600 font-mono mt-0.5 block">
                  - Rs. {settlement.deliveryCharges.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-400">
                  Rs. 70 flat rate
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Net Receivable
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 block">
                  Rs. {settlement.currentNetReceivable.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-400">
                  COD - Charges
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Previous Due
                </span>
                <span className="text-base font-extrabold text-slate-700 dark:text-slate-300 font-mono mt-0.5 block">
                  + Rs. {settlement.previousOutstandingDue.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-400">
                  Brought Forward
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                  Payment Received
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                  Rs. {settlement.paymentReceived.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400">
                  {settlement.paymentMethod}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Remaining Due
                </span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
                  Rs. {settlement.remainingDue.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-400">
                  Carried Forward
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab("delivered")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "delivered"
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Customer Delivered Details</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                  {deliveredParcels.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("returned")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "returned"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return Details</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-mono font-bold">
                  {returnedParcels.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("batches")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "batches"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Batch Breakdown</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono font-bold">
                  {batchBreakdown.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "payments"
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Payment Installments</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                  {settlement?.paymentInstallments?.length || (settlement && settlement.paymentReceived > 0 ? 1 : 0)}
                </span>
              </button>
            </div>

            {/* TAB 1: CUSTOMER DELIVERED DETAILS */}
            {activeTab === "delivered" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Customer, Mobile, SKU, or Batch..."
                      value={deliveredSearch}
                      onChange={(e) => setDeliveredSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>
                      Delivered Parcels: <strong>{filteredDelivered.length}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Total COD Collected:{" "}
                      <strong className="text-emerald-600 font-mono">
                        Rs. {filteredDelivered.reduce((s, p) => s + (p.codAmount || 0), 0).toLocaleString("en-IN")}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">S.N.</th>
                        <th className="py-2.5 px-3">PARCEL ID</th>
                        <th className="py-2.5 px-3">CUSTOMER NAME</th>
                        <th className="py-2.5 px-3">MOBILE (UNIQUE ID)</th>
                        <th className="py-2.5 px-3 text-right">COD AMOUNT</th>
                        <th className="py-2.5 px-3 text-right">ADVANCE</th>
                        <th className="py-2.5 px-3 text-right">TOTAL ORDER</th>
                        <th className="py-2.5 px-3">SKU / ITEM</th>
                        <th className="py-2.5 px-3 text-right">CHARGE</th>
                        <th className="py-2.5 px-3">BATCH ID</th>
                        <th className="py-2.5 px-3">DELIVERY ADDRESS</th>
                        <th className="py-2.5 px-3">DELIVERED DATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredDelivered.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-8 text-center text-slate-400">
                            No delivered parcels match the search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDelivered.map((p, idx) => (
                          <tr key={p._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {p.parcelId}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                              {p.customerName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                              {p.customerPhone}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              Rs. {(p.codAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-semibold">
                              Rs. {(p.advancePayment || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                              Rs. {((p.codAmount || 0) + (p.advancePayment || 0)).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                              {p.itemSku || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-medium">
                              Rs. {p.deliveryCharge || 70}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{p.batchId}</td>
                            <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate">
                              {p.customerAddress || "-"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-emerald-600 font-medium">
                              {p.deliveredDate || settlement.settlementDate}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: RETURN DETAILS */}
            {activeTab === "returned" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Customer, Mobile, Reason, or Batch..."
                      value={returnedSearch}
                      onChange={(e) => setReturnedSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>
                      Returned to Warehouse: <strong>{filteredReturned.length}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Return Fee Applied:{" "}
                      <strong className="text-emerald-600 font-mono">
                        Rs. 0 (Free Returns)
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">S.N.</th>
                        <th className="py-2.5 px-3">PARCEL ID</th>
                        <th className="py-2.5 px-3">CUSTOMER NAME</th>
                        <th className="py-2.5 px-3">MOBILE (UNIQUE ID)</th>
                        <th className="py-2.5 px-3 text-right">UNCOLLECTED COD</th>
                        <th className="py-2.5 px-3">SKU / ITEM</th>
                        <th className="py-2.5 px-3">BATCH ID</th>
                        <th className="py-2.5 px-3">RETURN REASON</th>
                        <th className="py-2.5 px-3">RETURN DATE</th>
                        <th className="py-2.5 px-3">PROCESSED BY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredReturned.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400">
                            No returned parcels match the search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredReturned.map((p, idx) => (
                          <tr key={p._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {p.parcelId}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                              {p.customerName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                              {p.customerPhone}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              Rs. {(p.codAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                              {p.itemSku || "-"}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{p.batchId}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                                {p.returnReason || "Customer rejected parcel"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-rose-600">
                              {p.returnDate || settlement.settlementDate}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {p.returnProcessedBy || "Warehouse Staff"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: BATCH BREAKDOWN */}
            {activeTab === "batches" && (
              <div className="space-y-3">
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">BATCH ID</th>
                        <th className="py-2.5 px-3 text-center">DELIVERED</th>
                        <th className="py-2.5 px-3 text-center">RETURNED</th>
                        <th className="py-2.5 px-3 text-center">TOTAL PROCESSED</th>
                        <th className="py-2.5 px-3 text-right">DELIVERED COD</th>
                        <th className="py-2.5 px-3 text-right">ADVANCE PAID</th>
                        <th className="py-2.5 px-3 text-right">DELIVERY CHARGES</th>
                        <th className="py-2.5 px-3 text-right">NET RECEIVABLE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {batchBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No batch breakdown available.
                          </td>
                        </tr>
                      ) : (
                        batchBreakdown.map((b) => (
                          <tr key={b.batchId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {b.batchId}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                              {b.deliveredCount}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                              {b.returnedCount}
                            </td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                              {b.deliveredCount + b.returnedCount}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              Rs. {b.deliveredCod.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-semibold">
                              Rs. {b.totalAdvance.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                              - Rs. {b.deliveryCharge.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                              Rs. {(b.deliveredCod - b.deliveryCharge).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: PAYMENT INSTALLMENTS & DUES */}
            {activeTab === "payments" && (
              <div className="space-y-4">
                {/* Financial Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Receivable</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-base mt-0.5 block">
                      Rs. {settlement.totalReceivable.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Total Paid So Far</span>
                    <span className="font-mono font-bold text-emerald-600 text-base mt-0.5 block">
                      Rs. {(settlement.paymentReceived || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 uppercase font-bold block">Remaining Due</span>
                    <span className="font-mono font-black text-rose-600 text-base mt-0.5 block">
                      Rs. {(settlement.remainingDue || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                    <span className="mt-1 inline-block">
                      {settlement.remainingDue <= 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Fully Paid
                        </span>
                      ) : (settlement.paymentReceived || 0) > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Partially Paid
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Unpaid
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Installments Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">PAYMENT #</th>
                        <th className="py-2.5 px-3">DATE</th>
                        <th className="py-2.5 px-3 text-right">TOTAL PAID</th>
                        <th className="py-2.5 px-3 text-right">CASH (RS.)</th>
                        <th className="py-2.5 px-3 text-right">ONLINE (RS.)</th>
                        <th className="py-2.5 px-3">METHOD</th>
                        <th className="py-2.5 px-3">REFERENCE</th>
                        <th className="py-2.5 px-3">REMARKS</th>
                        <th className="py-2.5 px-3">RECORDED BY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {settlement.paymentInstallments && settlement.paymentInstallments.length > 0 ? (
                        settlement.paymentInstallments.map((inst, idx) => (
                          <tr key={inst._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {inst.paymentNumber}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{inst.paymentDate}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                              Rs. {inst.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                              Rs. {(inst.cashAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                              Rs. {(inst.onlineAmount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {inst.paymentMethod}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {inst.referenceNumber || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[200px]">
                              {inst.remarks || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{inst.recordedBy}</td>
                          </tr>
                        ))
                      ) : (settlement.paymentReceived || 0) > 0 ? (
                        <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">Initial Payment</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{settlement.settlementDate}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                            Rs. {settlement.paymentReceived.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            Rs. {(settlement.cashReceived || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            Rs. {(settlement.onlineReceived || (settlement.paymentReceived - (settlement.cashReceived || 0))).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {settlement.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {settlement.paymentReference || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">Payment recorded at settlement generation</td>
                          <td className="py-2.5 px-3 text-slate-500">{settlement.preparedBy || "Admin"}</td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            No payment installments recorded yet. This settlement bill is currently unpaid.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Recorded By: <strong>{settlement?.preparedBy || "Admin"}</strong>
          </div>

          <div className="flex items-center gap-2">
            {settlement && settlement.remainingDue > 0 && (
              <Link href="/payments">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Pay Due (Rs. {settlement.remainingDue.toLocaleString("en-IN")})</span>
                </button>
              </Link>
            )}
            {settlement && (
              <Link href={`/settlements/${settlement._id}`}>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-semibold transition">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Open Official Printable Invoice</span>
                </button>
              </Link>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

