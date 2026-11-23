"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  RotateCcw,
  Search,
  Printer,
  Package,
  Phone,
  User,
  Calendar,
  AlertCircle,
  Building2,
  Boxes,
  FileCheck2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { IParcel } from "@/types";

interface BatchReturnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  courierName: string;
  parcels: IParcel[];
  onReturnCancelled?: (parcelId: string) => void;
}

export function BatchReturnsModal({
  isOpen,
  onClose,
  batchId,
  courierName,
  parcels,
  onReturnCancelled,
}: BatchReturnsModalProps) {
  const [search, setSearch] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filter only parcels returned in this batch
  const returnedParcels = useMemo(() => {
    return parcels.filter(
      (p) =>
        p.status === "Returned to Warehouse" ||
        p.returnDate !== undefined ||
        p.returnReason !== undefined
    );
  }, [parcels]);

  // Filter with search query
  const filtered = useMemo(() => {
    if (!search.trim()) return returnedParcels;
    const q = search.toLowerCase();
    return returnedParcels.filter(
      (p) =>
        p.parcelId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.includes(q) ||
        (p.itemSku && p.itemSku.toLowerCase().includes(q)) ||
        (p.returnReason && p.returnReason.toLowerCase().includes(q)) ||
        (p.remarks && p.remarks.toLowerCase().includes(q))
    );
  }, [returnedParcels, search]);

  const totalReturnedCod = useMemo(() => {
    return returnedParcels.reduce((sum, p) => sum + (p.codAmount || 0), 0);
  }, [returnedParcels]);

  const totalAdvancePaid = useMemo(() => {
    return returnedParcels.reduce((sum, p) => sum + (p.advancePayment || 0), 0);
  }, [returnedParcels]);

  const handleCancelReturn = async (parcelId: string) => {
    if (!confirm(`Cancel return for parcel #${parcelId} and restore status to Delivered?`)) {
      return;
    }
    setCancellingId(parcelId);
    const toastId = toast.loading(`Reverting parcel ${parcelId} to Delivered...`);
    try {
      const res = await fetch(`/api/returns?parcelId=${encodeURIComponent(parcelId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel return");
      }
      toast.success(data.message || `Parcel ${parcelId} restored to Delivered!`, { id: toastId });
      if (onReturnCancelled) {
        onReturnCancelled(parcelId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel return", { id: toastId });
    } finally {
      setCancellingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Return Details from Courier with Batch ID
                </h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                  {batchId || "No Batch Selected"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold uppercase tracking-wider">
                  {returnedParcels.length} Returned
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Courier Partner: <strong>{courierName || "Courier Partner"}</strong> • Batch Code:{" "}
                <span className="font-mono">{batchId}</span> • Policy:{" "}
                <strong className="text-emerald-600">Free Returns (Rs. 0 Charge)</strong>
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

        {/* Financial & Count KPI Strip */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Returned Parcels
            </span>
            <span className="text-xl font-black text-rose-600 font-mono mt-0.5 block">
              {returnedParcels.length}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Uncollected COD Value
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              Rs. {totalReturnedCod.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Customer Advance Paid
            </span>
            <span className="text-xl font-black text-blue-600 font-mono mt-0.5 block">
              Rs. {totalAdvancePaid.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Return Charge Policy
            </span>
            <span className="text-xl font-black text-emerald-600 font-mono mt-0.5 block">
              Rs. 0
            </span>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Customer, Mobile (Unique ID), SKU, or Reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Showing: <strong className="font-mono text-slate-800 dark:text-slate-200">{filtered.length}</strong> of{" "}
              <strong className="font-mono">{returnedParcels.length}</strong> returns
            </span>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">S.N.</th>
                  <th className="py-2.5 px-3">PARCEL ID</th>
                  <th className="py-2.5 px-3">CUSTOMER NAME</th>
                  <th className="py-2.5 px-3">MOBILE (UNIQUE ID)</th>
                  <th className="py-2.5 px-3 text-right">UNCOLLECTED COD</th>
                  <th className="py-2.5 px-3 text-right">ADVANCE PAID</th>
                  <th className="py-2.5 px-3">SKU / ITEM</th>
                  <th className="py-2.5 px-3">RETURN REASON</th>
                  <th className="py-2.5 px-3">RETURN DATE</th>
                  <th className="py-2.5 px-3">PROCESSED BY</th>
                  <th className="py-2.5 px-3">WAREHOUSE NOTES</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      {returnedParcels.length === 0 ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-600 dark:text-slate-300">
                            No parcels have been returned yet under Batch {batchId}.
                          </p>
                          <p className="text-xs text-slate-400">
                            All parcels in this batch are currently either delivered or with courier.
                          </p>
                        </div>
                      ) : (
                        "No returned parcels match your search query."
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr
                      key={p._id || idx}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.parcelId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {p.customerName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {p.customerPhone}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        Rs. {(p.codAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-semibold">
                        Rs. {(p.advancePayment || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                        {p.itemSku || "-"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                          {p.returnReason || "Customer rejected parcel"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-600">
                        {p.returnDate || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {p.returnedProcessedBy || "Warehouse Staff"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate">
                        {p.remarks || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCancelReturn(p.parcelId)}
                          disabled={cancellingId === p.parcelId}
                          title="Mistaken return entry? Cancel return and restore to Delivered"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Revert to Delivered</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Batch: <strong className="font-mono text-slate-800 dark:text-slate-200">{batchId}</strong> • Courier:{" "}
            <strong>{courierName}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

