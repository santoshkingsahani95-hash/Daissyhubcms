"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Eye,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Package,
  Building2,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  Save,
  Plus,
  Coins,
  Truck,
  FileText,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { IBatch, IParcel, ICourierCompany, ParcelStatus, IOutsideValleyRate } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";
import { BatchReturnsModal } from "@/components/returns/BatchReturnsModal";

interface EditParcelRow {
  _id?: string;
  parcelId?: string;
  customerName: string;
  customerPhone: string;
  codAmount: number | string;
  advancePayment: number | string;
  deliveryCharge: number | string;
  itemSku: string;
  customerAddress: string;
  remarks: string;
  status: ParcelStatus;
}

export default function ParcelBatchesPage() {
  const [batches, setBatches] = useState<IBatch[]>([]);
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Selected batch for detailed inspection modal
  const [viewBatch, setViewBatch] = useState<IBatch | null>(null);
  const [batchParcels, setBatchParcels] = useState<IParcel[]>([]);
  const [loadingParcels, setLoadingParcels] = useState(false);

  // Edit Batch & Parcels Modal State
  const [editBatch, setEditBatch] = useState<IBatch | null>(null);
  const [editParcels, setEditParcels] = useState<EditParcelRow[]>([]);
  const [outsideRates, setOutsideRates] = useState<IOutsideValleyRate[]>([]);
  const [editCourierId, setEditCourierId] = useState("");
  const [editDispatchDate, setEditDispatchDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [loadingEditParcels, setLoadingEditParcels] = useState(false);
  const [savingEditBatch, setSavingEditBatch] = useState(false);

  // Return Details Modal State
  const [returnModalBatch, setReturnModalBatch] = useState<IBatch | null>(null);
  const [returnModalParcels, setReturnModalParcels] = useState<IParcel[]>([]);
  const [showBatchReturnsModal, setShowBatchReturnsModal] = useState(false);

  // Delete Batch State
  const [deleteBatchTarget, setDeleteBatchTarget] = useState<IBatch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);

  const handleConfirmDeleteBatch = async () => {
    if (!deleteBatchTarget) return;
    setDeletingBatch(true);
    try {
      const res = await fetch(`/api/batches/${encodeURIComponent(deleteBatchTarget.batchId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete batch");
      }
      toast.success(`Batch ${deleteBatchTarget.batchId} deleted successfully!`);
      setDeleteBatchTarget(null);
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || "Error deleting batch");
    } finally {
      setDeletingBatch(false);
    }
  };

  const handleViewBatchReturns = (batch: IBatch) => {
    setReturnModalBatch(batch);
    setReturnModalParcels([]);
    setShowBatchReturnsModal(true);
    fetch(`/api/parcels?batchId=${batch.batchId}&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.parcels) {
          setReturnModalParcels(data.parcels);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchBatches();
    fetchCouriers();
    fetch("/api/outside-rates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.rates) {
          setOutsideRates(data.rates);
        }
      })
      .catch(console.error);
  }, []);

  const fetchBatches = () => {
    setLoading(true);
    fetch("/api/batches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.batches) {
          setBatches(data.batches);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

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

  const handleInspectBatch = (batch: IBatch) => {
    setViewBatch(batch);
    setLoadingParcels(true);
    fetch(`/api/parcels?batchId=${batch.batchId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.parcels) {
          setBatchParcels(data.parcels);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingParcels(false));
  };

  const handleOpenEditBatch = (batch: IBatch) => {
    setEditBatch(batch);
    setEditCourierId(batch.courierId);
    setEditDispatchDate(batch.dispatchDate);
    setEditNotes(batch.notes || "");
    setLoadingEditParcels(true);

    fetch(`/api/parcels?batchId=${batch.batchId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.parcels) {
          setEditParcels(
            data.parcels.map((p: IParcel) => ({
              _id: p._id,
              parcelId: p.parcelId,
              customerName: p.customerName || "",
              customerPhone: p.customerPhone || "",
              codAmount: p.codAmount,
              advancePayment: p.advancePayment || 0,
              deliveryCharge: p.deliveryCharge,
              itemSku: p.itemSku || "",
              customerAddress: p.customerAddress || "",
              remarks: p.remarks || "",
              status: p.status,
            }))
          );
        }
      })
      .catch(() => {
        toast.error("Failed to load parcels for this batch");
      })
      .finally(() => setLoadingEditParcels(false));
  };

  const handleAddParcelRow = () => {
    const courier = couriers.find((c) => c._id === editCourierId);
    const defaultRate = courier?.defaultDeliveryCharge || courier?.defaultChargeInsideValley || 70;
    setEditParcels((prev) => [
      ...prev,
      {
        _id: "",
        parcelId: `(New #${prev.length + 1})`,
        customerName: "",
        customerPhone: "",
        codAmount: 0,
        advancePayment: 0,
        deliveryCharge: defaultRate,
        itemSku: "",
        customerAddress: "",
        remarks: "",
        status: "With Courier",
      },
    ]);
  };

  const handleUpdateParcelField = (idx: number, field: keyof EditParcelRow, value: any) => {
    let finalValue = value;
    if (field === "customerPhone") {
      finalValue = String(value).replace(/\D/g, "").slice(0, 10);
    }
    setEditParcels((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: finalValue };
      return copy;
    });
  };

  const handleDeleteParcelRow = (idx: number) => {
    const target = editParcels[idx];
    if (target?.parcelId && !target.parcelId.startsWith("(New")) {
      if (!confirm(`Are you sure you want to remove parcel ${target.parcelId} (${target.customerName}) from this batch?`)) {
        return;
      }
    }
    setEditParcels((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveEditedBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBatch) return;

    // Validate rows
    const validRows = editParcels.filter(
      (p) => p.customerName?.trim() && p.customerPhone?.trim()
    );
    if (validRows.length === 0) {
      toast.error("At least one parcel with Customer Name and Mobile Number is required.");
      return;
    }

    const invalidPhone = validRows.find((p) => p.customerPhone?.trim().length !== 10);
    if (invalidPhone) {
      toast.error(`Mobile number for "${invalidPhone.customerName || "Parcel"}" must be exactly 10 digits.`);
      return;
    }

    setSavingEditBatch(true);
    try {
      const selectedCourierObj = couriers.find((c) => c._id === editCourierId);
      const isOutside = Boolean(
        selectedCourierObj?.isOutsideValley ||
        selectedCourierObj?.serviceArea === "Outside Valley" ||
        editBatch.serviceArea === "Outside Valley"
      );
      const serviceArea = isOutside ? "Outside Valley" : "Inside Valley";

      const res = await fetch(`/api/batches`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: editBatch.batchId,
          batchData: {
            courierId: editCourierId,
            courierName: selectedCourierObj?.name || editBatch.courierName,
            dispatchDate: editDispatchDate,
            serviceArea: serviceArea,
            notes: editNotes,
          },
          parcels: validRows.map((p) => ({
            _id: p._id && !p._id.startsWith("parcel-new") ? p._id : undefined,
            parcelId: p.parcelId && !p.parcelId.startsWith("(New") ? p.parcelId : undefined,
            customerName: p.customerName.trim(),
            customerPhone: p.customerPhone.trim(),
            customerAddress: p.customerAddress?.trim() || "",
            deliveryArea: serviceArea,
            itemSku: p.itemSku?.trim() || "",
            codAmount: Number(p.codAmount) || 0,
            advancePayment: Number(p.advancePayment) || 0,
            deliveryCharge: Number(p.deliveryCharge) || (isOutside ? 150 : 70),
            remarks: p.remarks?.trim() || "",
            status: p.status || "With Courier",
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      toast.success(data.message || "Batch and entries updated successfully!");
      setEditBatch(null);
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || "Failed to update batch details");
    } finally {
      setSavingEditBatch(false);
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (selectedCourier !== "all" && b.courierId !== selectedCourier) return false;
    if (selectedStatus !== "all" && b.status !== selectedStatus) return false;
    if (startDate && b.dispatchDate < startDate) return false;
    if (endDate && b.dispatchDate > endDate) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.batchId.toLowerCase().includes(q) ||
        b.courierName.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate live totals for the edit modal
  const editTotalCod = editParcels.reduce((sum, p) => sum + (Number(p.codAmount) || 0), 0);
  const editTotalAdvance = editParcels.reduce((sum, p) => sum + (Number(p.advancePayment) || 0), 0);
  const editTotalValue = editTotalCod + editTotalAdvance;
  const editTotalCharges = editParcels.reduce((sum, p) => sum + (Number(p.deliveryCharge) || 0), 0);
  const editNet = editTotalCod - editTotalCharges;

  const selectedEditCourierObj = couriers.find((c) => c._id === editCourierId);
  const isOutsideValleyEditBatch = Boolean(
    selectedEditCourierObj?.isOutsideValley ||
    selectedEditCourierObj?.serviceArea === "Outside Valley" ||
    editBatch?.serviceArea === "Outside Valley"
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>Parcel Batches</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track, edit parcel amounts or entries, and reconcile dispatch batches handed over to couriers
          </p>
        </div>

        <Link href="/parcels/new">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all">
            <PlusCircle className="w-4 h-4" />
            <span>Create New Batch</span>
          </button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Batch ID, Courier, or Notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Couriers</option>
            {couriers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="Settled">Settled</option>
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
      </div>

      {/* Batches Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  BATCH ID
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  COURIER
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  DISPATCH DATE
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">
                  PARCELS
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">
                  STATUS BREAKDOWN
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  ADVANCE PAID
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  TOTAL COD
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading batches...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No parcel batches found. Create your first batch in New Parcel Entry!
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr
                    key={batch._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {batch.batchId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-100">
                      {batch.courierName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {batch.dispatchDate}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {batch.totalParcels}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const returned = batch.returnedCount || 0;
                        const delivered = Math.max(0, (batch.totalParcels || 0) - returned);
                        return (
                          <div className="flex items-center justify-center gap-1.5 text-[11px]">
                            <span
                              title="Delivered"
                              className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800"
                            >
                              {delivered} Del
                            </span>
                            {returned > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleViewBatchReturns(batch)}
                                title="Click to see return details for this batch"
                                className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                              >
                                {returned} Ret
                              </button>
                            ) : (
                              <span
                                title="No Returns"
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium border border-slate-200 dark:border-slate-700"
                              >
                                0 Ret
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                      {batch.totalAdvancePaid ? `Rs. ${batch.totalAdvancePaid.toLocaleString("en-IN")}` : "Rs. 0"}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      Rs. {batch.totalCodAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {batch.returnedCount && batch.returnedCount > 0 ? (
                        <button
                          onClick={() => handleViewBatchReturns(batch)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 transition-colors border border-rose-200 dark:border-rose-800/60"
                          title="See return details from courier with this batch ID"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Returns ({batch.returnedCount})</span>
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleInspectBatch(batch)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                        title="View Dispatch Manifest"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditBatch(batch)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 transition-colors border border-amber-200 dark:border-amber-800/60"
                        title="Edit Batch & Parcel Entries (Fix amounts, mobile, etc.)"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <Link href={`/delivery-updates?batchId=${batch.batchId}`}>
                        <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 transition-colors">
                          <span>Reconcile</span>
                        </button>
                      </Link>
                      <button
                        onClick={() => setDeleteBatchTarget(batch)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 transition-colors border border-rose-200 dark:border-rose-800/60"
                        title="Delete Batch & its parcels permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Batch Manifest Modal */}
      {viewBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
                    {viewBatch.batchId}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Batch Dispatch Manifest
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Courier: <strong className="text-slate-800 dark:text-slate-200">{viewBatch.courierName}</strong> | Dispatched: {viewBatch.dispatchDate} | Total COD: Rs. {viewBatch.totalCodAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const b = viewBatch;
                    setViewBatch(null);
                    handleOpenEditBatch(b);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Batch</span>
                </button>
                <button
                  onClick={() => setViewBatch(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Parcels Table */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingParcels ? (
                <div className="py-12 text-center text-slate-400">Loading parcels...</div>
              ) : batchParcels.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No parcels in this batch.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">PARCEL ID</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">CUSTOMER</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">PHONE</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">SKU</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300 text-right">ADVANCE</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300 text-right">COD AMOUNT</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300 text-right">CHARGE</th>
                      <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {batchParcels.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono text-blue-600">{p.parcelId}</td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{p.customerName}</td>
                        <td className="py-2 px-3 font-mono">{p.customerPhone}</td>
                        <td className="py-2 px-3">{p.itemSku || "-"}</td>
                        <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                          {p.advancePayment ? `Rs. ${p.advancePayment.toLocaleString("en-IN")}` : "Rs. 0"}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">Rs. {p.codAmount.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3 text-right font-mono">Rs. {p.deliveryCharge}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.status === "Returned to Warehouse" || p.status === "Return Initiated"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {p.status === "Returned to Warehouse" || p.status === "Return Initiated" ? "Returned" : "Delivered"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Total Parcels: {batchParcels.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Manifest</span>
                </button>
                <button
                  onClick={() => setViewBatch(null)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL-FEATURED EDIT BATCH & PARCEL ENTRIES MODAL */}
      {editBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Edit Batch Details & Parcel Entries
                    </h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                      {editBatch.batchId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Correct wrong amounts, mobile numbers, customer details, delivery charges, or add/remove parcels in this batch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditBatch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedBatch} className="flex-1 flex flex-col overflow-hidden">
              {/* Batch Configuration Strip */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Courier Partner *
                    </label>
                    {isOutsideValleyEditBatch && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-extrabold px-1.5 py-0.2 rounded-full border border-purple-300 dark:border-purple-800 uppercase">
                        Outside Valley
                      </span>
                    )}
                  </div>
                  <select
                    value={editCourierId}
                    onChange={(e) => setEditCourierId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {couriers.map((c) => {
                      const isOutside = Boolean(c.isOutsideValley || c.serviceArea === "Outside Valley");
                      return (
                        <option key={c._id} value={c._id}>
                          {c.name} {isOutside ? "[Outside Valley]" : ""} (Rs. {c.defaultDeliveryCharge || 70})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Dispatch Date *
                  </label>
                  <input
                    type="date"
                    value={editDispatchDate}
                    onChange={(e) => setEditDispatchDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Batch Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Morning dispatch, Cotton hoodies"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Live Financial Metric Strip */}
              <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
                <div className="flex items-center gap-5">
                  <span className="text-slate-700 dark:text-slate-300">
                    Parcels in Batch: <strong className="font-mono text-blue-600">{editParcels.length}</strong>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Total COD: <strong className="font-mono text-emerald-600">Rs. {editTotalCod.toLocaleString("en-IN")}</strong>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Advance Paid: <strong className="font-mono text-amber-600">Rs. {editTotalAdvance.toLocaleString("en-IN")}</strong>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Total Order Value: <strong className="font-mono text-slate-800 dark:text-slate-200">Rs. {editTotalValue.toLocaleString("en-IN")}</strong>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Delivery Charges: <strong className="font-mono text-rose-600">Rs. {editTotalCharges.toLocaleString("en-IN")}</strong>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Net Estimated COD: <strong className="font-mono text-indigo-600">Rs. {editNet.toLocaleString("en-IN")}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddParcelRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Parcel to Batch</span>
                </button>
              </div>

              {/* Spreadsheet-like Editable Parcels Table */}
              <div className="flex-1 overflow-y-auto overflow-x-auto p-4">
                {loadingEditParcels ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    <span>Loading batch parcels for editing...</span>
                  </div>
                ) : editParcels.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    No parcels in this batch. Click &quot;+ Add Parcel to Batch&quot; above to add one.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                      <tr>
                        <th className="py-2.5 px-2 font-bold text-slate-500 dark:text-slate-400 w-12 text-center text-[11px] uppercase tracking-wider">#</th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 min-w-[160px] text-[11px] uppercase tracking-wider">Customer Name <span className="text-rose-500">*</span></th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 min-w-[140px] text-[11px] uppercase tracking-wider">Mobile Number <span className="text-rose-500">*</span></th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 min-w-[160px] text-[11px] uppercase tracking-wider">Address / City</th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 min-w-[120px] text-[11px] uppercase tracking-wider">SKU / Item</th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 min-w-[110px] text-right text-[11px] uppercase tracking-wider">COD Amount (Rs.) <span className="text-rose-500">*</span></th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 min-w-[105px] text-right text-[11px] uppercase tracking-wider">Advance (Rs.)</th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 min-w-[95px] text-right text-[11px] uppercase tracking-wider">Charge (Rs.)</th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 min-w-[130px] text-[11px] uppercase tracking-wider">Remarks</th>
                        <th className="py-2.5 px-2 font-bold text-slate-600 dark:text-slate-300 w-24 text-center text-[11px] uppercase tracking-wider">Status</th>
                        <th className="py-2.5 px-2 font-bold text-slate-400 w-8 text-center">&bull;</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {editParcels.map((p, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                          {/* S.N. and Parcel ID */}
                          <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{idx + 1}</div>
                            {p.parcelId && !p.parcelId.startsWith("(New") && (
                              <div className="text-[9px] text-blue-500 dark:text-blue-400 truncate max-w-[80px] mx-auto" title={p.parcelId}>
                                {p.parcelId}
                              </div>
                            )}
                          </td>

                          {/* Customer Name */}
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={p.customerName}
                              onChange={(e) => handleUpdateParcelField(idx, "customerName", e.target.value)}
                              placeholder="Customer Name"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              required
                            />
                          </td>

                          {/* Mobile Number */}
                          <td className="py-1.5 px-2 relative">
                            {(() => {
                              const pVal = (p.customerPhone || "").trim();
                              const isInvalid = pVal.length > 0 && pVal.length !== 10;
                              return (
                                <div className="relative">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={p.customerPhone}
                                    onChange={(e) => handleUpdateParcelField(idx, "customerPhone", e.target.value)}
                                    placeholder="98XXXXXXXX"
                                    className={`w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all focus:outline-none ${
                                      isInvalid
                                        ? "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200 ring-1 ring-rose-400 pr-12 font-semibold"
                                        : "border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    }`}
                                    required
                                  />
                                  {isInvalid && (
                                    <span
                                      title="Must be 10 digits"
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded text-[8px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700 select-none pointer-events-none"
                                    >
                                      {pVal.length}/10
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Address / Destination City */}
                          <td className="py-1.5 px-2">
                            {isOutsideValleyEditBatch ? (
                              <div className="space-y-1">
                                <select
                                  value={
                                    outsideRates.find(
                                      (r) =>
                                        p.customerAddress?.toLowerCase().startsWith(r.placeName.toLowerCase()) ||
                                        p.customerAddress?.toLowerCase() === r.placeName.toLowerCase()
                                    )?.placeName || ""
                                  }
                                  onChange={(e) => {
                                    const selectedPlace = e.target.value;
                                    const matched = outsideRates.find((r) => r.placeName === selectedPlace);
                                    if (matched) {
                                      setEditParcels((prev) => {
                                        const copy = [...prev];
                                        copy[idx] = {
                                          ...copy[idx],
                                          customerAddress: matched.placeName,
                                          deliveryCharge: matched.deliveryCharge,
                                        };
                                        return copy;
                                      });
                                    }
                                  }}
                                  className="w-full px-2 py-0.5 text-[11px] font-bold rounded border border-purple-300 dark:border-purple-700 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                                >
                                  <option value="">📍 Choose City / Place...</option>
                                  {outsideRates.map((r) => (
                                    <option key={r.id} value={r.placeName}>
                                      {r.placeName} (Rs. {r.deliveryCharge})
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={p.customerAddress}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleUpdateParcelField(idx, "customerAddress", val);
                                    const matched = outsideRates.find((r) =>
                                      val.toLowerCase().includes(r.placeName.toLowerCase())
                                    );
                                    if (matched) {
                                      handleUpdateParcelField(idx, "deliveryCharge", matched.deliveryCharge);
                                    }
                                  }}
                                  placeholder="Street, Landmark / Tole"
                                  className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={p.customerAddress}
                                onChange={(e) => handleUpdateParcelField(idx, "customerAddress", e.target.value)}
                                placeholder="Street, Landmark, City"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              />
                            )}
                          </td>

                          {/* SKU / Item */}
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={p.itemSku}
                              onChange={(e) => handleUpdateParcelField(idx, "itemSku", e.target.value)}
                              placeholder="Item SKU"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          </td>

                          {/* COD Amount */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={p.codAmount}
                              onChange={(e) => handleUpdateParcelField(idx, "codAmount", e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-mono text-right font-bold text-slate-900 dark:text-white rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              required
                            />
                          </td>

                          {/* Advance */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={p.advancePayment}
                              onChange={(e) => handleUpdateParcelField(idx, "advancePayment", e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-mono text-right font-semibold text-emerald-600 dark:text-emerald-400 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </td>

                          {/* Charge */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={p.deliveryCharge}
                              onChange={(e) => handleUpdateParcelField(idx, "deliveryCharge", e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs font-mono text-right rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={p.remarks}
                              onChange={(e) => handleUpdateParcelField(idx, "remarks", e.target.value)}
                              placeholder="Special notes"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          </td>

                          {/* Status */}
                          <td className="py-1.5 px-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.status === "Returned to Warehouse" || p.status === "Return Initiated"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              }`}
                            >
                              {p.status === "Returned to Warehouse" || p.status === "Return Initiated" ? "Returned" : "Delivered"}
                            </span>
                          </td>

                          {/* Delete Action */}
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteParcelRow(idx)}
                              title="Remove parcel from batch"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer with Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>
                    Saving will recalculate the batch totals, update courier stats, and refresh COD balances.
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditBatch(null)}
                    disabled={savingEditBatch}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEditBatch}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <Save className={`w-3.5 h-3.5 ${savingEditBatch ? "animate-spin" : ""}`} />
                    <span>{savingEditBatch ? "Saving Updates..." : "Save Batch & Updates"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Details Modal from Courier with Batch ID */}
      <BatchReturnsModal
        isOpen={showBatchReturnsModal}
        onClose={() => setShowBatchReturnsModal(false)}
        batchId={returnModalBatch?.batchId || ""}
        courierName={returnModalBatch?.courierName || ""}
        parcels={returnModalParcels}
      />

      {/* Delete Batch Confirmation Modal */}
      {deleteBatchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              Delete Batch {deleteBatchTarget.batchId}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to delete batch <strong>{deleteBatchTarget.batchId}</strong> ({deleteBatchTarget.courierName})?
              This will permanently delete the batch entry and all{" "}
              <strong>{deleteBatchTarget.totalParcels} parcel(s)</strong> belonging to it from MongoDB database.
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteBatchTarget(null)}
                disabled={deletingBatch}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBatch}
                disabled={deletingBatch}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-md shadow-rose-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingBatch ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
