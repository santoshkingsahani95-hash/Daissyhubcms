"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  CheckSquare,
  Square,
  Clock,
  Layers,
  Building2,
  Phone,
  User,
  MapPin,
  Calendar,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { IBatch, IParcel, ICourierCompany } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";

export default function DeliveryUpdatesPage() {
  const searchParams = useSearchParams();
  const initialBatchParam = searchParams.get("batchId") || "";

  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [batches, setBatches] = useState<IBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchParam);
  const [parcels, setParcels] = useState<IParcel[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Selection for bulk action
  const [selectedParcelIds, setSelectedParcelIds] = useState<Set<string>>(new Set());

  // Load couriers
  useEffect(() => {
    fetch("/api/couriers?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.couriers?.length > 0) {
          setCouriers(data.couriers);
          setSelectedCourierId(data.couriers[0]._id);
        }
      })
      .catch(console.error);
  }, []);

  // Load batches for selected courier
  useEffect(() => {
    if (!selectedCourierId) return;
    fetch(`/api/batches?courierId=${selectedCourierId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.batches) {
          setBatches(data.batches);
          if (initialBatchParam) {
            setSelectedBatchId(initialBatchParam);
          } else if (data.batches.length > 0) {
            setSelectedBatchId(data.batches[0].batchId);
          } else {
            setSelectedBatchId("");
            setParcels([]);
          }
        }
      })
      .catch(console.error);
  }, [selectedCourierId, initialBatchParam]);

  // Load parcels for selected batch
  const loadParcels = (bId: string) => {
    if (!bId) {
      setParcels([]);
      return;
    }
    setLoadingParcels(true);
    setSelectedParcelIds(new Set());
    fetch(`/api/parcels?batchId=${encodeURIComponent(bId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.parcels) {
          setParcels(data.parcels);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingParcels(false));
  };

  useEffect(() => {
    loadParcels(selectedBatchId);
  }, [selectedBatchId]);

  // Selected batch object
  const currentBatch = useMemo(() => {
    return batches.find((b) => b.batchId === selectedBatchId);
  }, [batches, selectedBatchId]);

  // Real database stats from actual parcel records
  const stats = useMemo(() => {
    const total = parcels.length;
    const returned = parcels.filter(
      (p) => p.status === "Returned to Warehouse" || p.status === "Return Initiated"
    ).length;
    const delivered = Math.max(0, total - returned);
    const nonReturned = parcels.filter(
      (p) => p.status !== "Returned to Warehouse" && p.status !== "Return Initiated"
    );
    const totalDeliveredCod = nonReturned.reduce((sum, p) => sum + (p.codAmount || 0), 0);

    return { total, delivered, returned, totalDeliveredCod };
  }, [parcels]);

  // Filtered parcels
  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      const isReturned = p.status === "Returned to Warehouse" || p.status === "Return Initiated";
      if (filterStatus === "Delivered" && isReturned) return false;
      if (filterStatus === "Returned to Warehouse" && !isReturned) return false;
      if (startDate && p.dispatchDate < startDate) return false;
      if (endDate && p.dispatchDate > endDate) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.parcelId.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.customerPhone.includes(q) ||
          (p.itemSku && p.itemSku.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [parcels, filterStatus, search, startDate, endDate]);

  const toggleSelectAll = () => {
    if (selectedParcelIds.size === filteredParcels.length) {
      setSelectedParcelIds(new Set());
    } else {
      setSelectedParcelIds(new Set(filteredParcels.map((p) => p.parcelId)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedParcelIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  // Mark single or bulk delivered
  const handleMarkDelivered = async (parcelIds: string[]) => {
    if (parcelIds.length === 0) return;

    try {
      const res = await fetch("/api/parcels/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelIds,
          status: "Delivered",
          remarks: "Reconciled and confirmed delivered",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update delivery status");
      }

      toast.success(`Marked ${data.updatedCount} parcels as Delivered!`);
      // Refresh parcels
      refreshParcels();
      setSelectedParcelIds(new Set());
    } catch (err: any) {
      toast.error(err.message || "Error updating parcels");
    }
  };

  const refreshParcels = () => {
    if (!selectedBatchId) return;
    fetch(`/api/parcels?batchId=${selectedBatchId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.parcels) {
          setParcels(data.parcels);
        }
      });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Courier Delivery Reconciliation</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select a courier and dispatch batch to review delivered and returned parcels
            </p>
          </div>

          {/* Courier & Batch Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <select
                value={selectedCourierId}
                onChange={(e) => setSelectedCourierId(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {couriers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="text-xs font-semibold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {batches.length === 0 ? (
                  <option value="">No batches available</option>
                ) : (
                  batches.map((b) => (
                    <option key={b._id} value={b.batchId}>
                      {b.batchId} ({b.dispatchDate})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Real Batch Statistics Strip - Simplified to Total, Delivered, Returned & Delivered COD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Dispatched
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Delivered
            </span>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {stats.delivered}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Returned
            </span>
            <p className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">
              {stats.returned}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Delivered COD
            </span>
            <p className="text-lg font-bold text-white mt-0.5">
              Rs. {stats.totalDeliveredCod.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Customer Name, Mobile Number, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses ({parcels.length})</option>
            <option value="Delivered">Delivered ({stats.delivered})</option>
            <option value="Returned to Warehouse">Returned ({stats.returned})</option>
          </select>

          <DateQuickFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Bulk Action Buttons */}
        {selectedParcelIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Selected ({selectedParcelIds.size}):
            </span>
            <button
              onClick={() => handleMarkDelivered(Array.from(selectedParcelIds))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Delivered</span>
            </button>
          </div>
        )}
      </div>

      {/* Parcels Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-500 hover:text-blue-600"
                  >
                    {selectedParcelIds.size > 0 &&
                    selectedParcelIds.size === filteredParcels.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">
                  PARCEL ID
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">
                  CUSTOMER
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">
                  MOBILE
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300">
                  SKU / ITEM
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">
                  COD AMOUNT
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">
                  CHARGE
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300 text-center">
                  STATUS
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300 text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loadingParcels ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading parcels for reconciliation...
                  </td>
                </tr>
              ) : filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No parcels found for this batch and filter.
                  </td>
                </tr>
              ) : (
                filteredParcels.map((parcel) => {
                  const isChecked = selectedParcelIds.has(parcel.parcelId);
                  return (
                    <tr
                      key={parcel._id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isChecked ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(parcel.parcelId)}
                          className="text-slate-400 hover:text-blue-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {parcel.parcelId}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-100">
                        {parcel.customerName}
                        {parcel.customerAddress && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-[160px]">
                            {parcel.customerAddress}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {parcel.customerPhone}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {parcel.itemSku || "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        Rs. {parcel.codAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        Rs. {parcel.deliveryCharge}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            parcel.status === "Returned to Warehouse" || parcel.status === "Return Initiated"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {parcel.status === "Returned to Warehouse" || parcel.status === "Return Initiated" ? "Returned" : "Delivered"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {parcel.status === "Returned to Warehouse" || parcel.status === "Return Initiated" ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Parcel ${parcel.parcelId} was marked as Returned. Cancel return and restore to Delivered?`)) {
                                return;
                              }
                              try {
                                const res = await fetch(`/api/returns?parcelId=${encodeURIComponent(parcel.parcelId)}`, {
                                  method: "DELETE",
                                });
                                const d = await res.json();
                                if (!res.ok || !d.success) throw new Error(d.message || "Failed to revert return");
                                toast.success(`Parcel ${parcel.parcelId} restored to Delivered!`);
                                if (selectedBatchId) {
                                  loadParcels(selectedBatchId);
                                }
                              } catch (err: any) {
                                toast.error(err.message || "Failed to revert return");
                              }
                            }}
                            title="Mistaken return entry? Cancel return and restore to Delivered"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Revert to Delivered</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Delivered</span>
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
    </div>
  );
}

