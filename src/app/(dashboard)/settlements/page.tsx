"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  PlusCircle,
  Calendar,
  Building2,
  CheckCircle2,
  Eye,
  Printer,
  Search,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { ISettlement, ICourierCompany, IParcel, IBatch, PaymentMethod } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";
import { SettlementDetailsModal } from "@/components/settlements/SettlementDetailsModal";

export default function SettlementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const searchParams = useSearchParams();
  const courierQuery = searchParams.get("courierId");

  const [settlements, setSettlements] = useState<ISettlement[]>([]);
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourierFilter, setSelectedCourierFilter] = useState(courierQuery || "all");
  const [tableStartDate, setTableStartDate] = useState("");
  const [tableEndDate, setTableEndDate] = useState("");

  // Manifest / Details Modal State
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Delete Settlement Statement State (Admin Only)
  const [settlementToDelete, setSettlementToDelete] = useState<ISettlement | null>(null);
  const [deletingSettlement, setDeletingSettlement] = useState(false);

  // Create Settlement Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardCourierId, setWizardCourierId] = useState("");
  const [wizardBatchId, setWizardBatchId] = useState("");
  const [wizardBatches, setWizardBatches] = useState<IBatch[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [preview, setPreview] = useState<{
    courier: ICourierCompany;
    eligibleParcels: IParcel[];
    returnedParcels: IParcel[];
    deliveredCount: number;
    returnedCount: number;
    grossCodCollection: number;
    totalAdvancePayment?: number;
    totalOrderValue?: number;
    returnedAdvancePayment?: number;
    returnedCodCollection?: number;
    deliveryCharges: number;
    returnCharges: number;
    currentNetReceivable: number;
    previousOutstandingDue: number;
    totalReceivable: number;
    isResettlementMode?: boolean;
    existingSettlementNumber?: string;
    existingCashReceived?: number;
    existingOnlineReceived?: number;
    existingPaymentMethod?: PaymentMethod;
    existingPaymentReference?: string;
    existingNotes?: string;
    batchBreakdown?: Array<{
      batchId: string;
      deliveredCount: number;
      returnedCount: number;
      deliveredCod: number;
      returnedCod: number;
      deliveredAdvance?: number;
      returnedAdvance?: number;
      deliveryCharge: number;
    }>;
  } | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [wizardCashAmount, setWizardCashAmount] = useState("0");
  const [wizardOnlineAmount, setWizardOnlineAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Bank Transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    fetchSettlements();
    fetchCouriers();
  }, []);

  const fetchSettlements = () => {
    setLoading(true);
    fetch("/api/settlements")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settlements) {
          setSettlements(data.settlements);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleConfirmDeleteSettlement = async () => {
    if (!settlementToDelete) return;
    setDeletingSettlement(true);
    const toastId = toast.loading(`Deleting settlement ${settlementToDelete.settlementNumber}...`);
    try {
      const res = await fetch(
        `/api/settlements/${encodeURIComponent(settlementToDelete._id || settlementToDelete.settlementNumber)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete settlement statement");
      }
      toast.success(
        data.message || `Settlement statement ${settlementToDelete.settlementNumber} deleted!`,
        { id: toastId }
      );
      setSettlementToDelete(null);
      fetchSettlements();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete settlement statement", { id: toastId });
    } finally {
      setDeletingSettlement(false);
    }
  };

  const fetchCouriers = () => {
    fetch("/api/couriers?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.couriers?.length > 0) {
          setCouriers(data.couriers);
          if (!wizardCourierId) {
            setWizardCourierId(courierQuery || data.couriers[0]._id);
          }
        }
      })
      .catch(console.error);
  };

  // Load batches for selected wizard courier
  useEffect(() => {
    if (!wizardCourierId) return;
    fetch(`/api/batches?courierId=${wizardCourierId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.batches) {
          setWizardBatches(data.batches);
        }
      })
      .catch(console.error);
  }, [wizardCourierId]);

  // Fetch Preview Calculation when Wizard inputs change
  useEffect(() => {
    if (!showWizard || !wizardCourierId || !startDate || !endDate) return;

    setLoadingPreview(true);
    let url = `/api/settlements/preview?courierId=${wizardCourierId}&startDate=${startDate}&endDate=${endDate}&includeSettled=true`;
    if (wizardBatchId) {
      url += `&batchId=${encodeURIComponent(wizardBatchId)}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.preview) {
          setPreview(data.preview);
          if (data.preview.isResettlementMode) {
            // In resettlement mode: populate previously recorded amounts and details
            if (data.preview.existingCashReceived !== undefined) {
              setWizardCashAmount(data.preview.existingCashReceived.toString());
            } else {
              setWizardCashAmount("0");
            }
            if (data.preview.existingOnlineReceived !== undefined) {
              setWizardOnlineAmount(data.preview.existingOnlineReceived.toString());
            } else {
              setWizardOnlineAmount("0");
            }
            if (data.preview.existingPaymentMethod) {
              setPaymentMethod(data.preview.existingPaymentMethod);
            }
            if (data.preview.existingPaymentReference) {
              setPaymentReference(data.preview.existingPaymentReference);
            }
            if (data.preview.existingNotes) {
              setNotes(data.preview.existingNotes);
            }
          } else {
            // Default received amounts to 0 since settlement generates the bill to give to courier before receiving payment
            setWizardCashAmount("0");
            setWizardOnlineAmount("0");
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingPreview(false));
  }, [showWizard, wizardCourierId, startDate, endDate, wizardBatchId]);

  const handleOpenWizard = () => {
    setShowWizard(true);
    setWizardCashAmount("0");
    setWizardOnlineAmount("0");
    setPaymentReference("");
    setNotes("");
  };

  // Calculated Live Total Paid & Remaining Due in live wizard
  const wizardTotalPaid = useMemo(() => {
    const cash = parseFloat(wizardCashAmount) || 0;
    const online = parseFloat(wizardOnlineAmount) || 0;
    return Math.round((cash + online) * 100) / 100;
  }, [wizardCashAmount, wizardOnlineAmount]);

  const wizardRemainingDue = useMemo(() => {
    if (!preview) return 0;
    return Math.max(0, Math.round((preview.totalReceivable - wizardTotalPaid) * 100) / 100);
  }, [preview, wizardTotalPaid]);

  const handleFinalizeSettlement = async () => {
    if (!wizardCourierId || !preview) return;

    setFinalizing(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierId: wizardCourierId,
          startDate,
          endDate,
          batchId: wizardBatchId || undefined,
          includeSettled: true,
          cashReceived: parseFloat(wizardCashAmount) || 0,
          onlineReceived: parseFloat(wizardOnlineAmount) || 0,
          paymentReceived: wizardTotalPaid,
          paymentMethod,
          paymentReference,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to finalize settlement");
      }

      toast.success(
        preview.isResettlementMode
          ? `Settlement statement ${data.settlement.settlementNumber} re-generated & updated successfully!`
          : `Settlement ${data.settlement.settlementNumber} finalized successfully!`,
        { duration: 5000 }
      );

      setShowWizard(false);
      fetchSettlements();
    } catch (err: any) {
      toast.error(err.message || "Error finalizing settlement");
    } finally {
      setFinalizing(false);
    }
  };

  const filteredSettlements = settlements.filter((s) => {
    if (selectedCourierFilter !== "all" && s.courierId !== selectedCourierFilter) return false;
    if (tableStartDate && s.settlementDate < tableStartDate) return false;
    if (tableEndDate && s.settlementDate > tableEndDate) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.settlementNumber.toLowerCase().includes(q) ||
        s.courierName.toLowerCase().includes(q) ||
        (s.paymentReference && s.paymentReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>COD Settlements</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reconcile delivered parcel collections, deduct charges, apply previous dues, and generate official statements
          </p>
        </div>

        <button
          onClick={handleOpenWizard}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Settlement Statement</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Statement #, Courier, or Reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCourierFilter}
            onChange={(e) => setSelectedCourierFilter(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Couriers</option>
            {couriers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <DateQuickFilter
            startDate={tableStartDate}
            endDate={tableEndDate}
            onDateChange={(start, end) => {
              setTableStartDate(start);
              setTableEndDate(end);
            }}
          />
        </div>

        {tableStartDate || tableEndDate ? (
          <button
            onClick={() => {
              setTableStartDate("");
              setTableEndDate("");
            }}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Clear Date Filter
          </button>
        ) : null}
      </div>

      {/* Settlements History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  STATEMENT #
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  COURIER PARTNER
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                  SETTLEMENT DATE
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">
                  PROCESSED
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  GROSS COD
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  CHARGES
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  TOTAL DUE
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  RECEIVED
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  REMAINING
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">
                  PAY STATUS
                </th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Loading settlements...
                  </td>
                </tr>
              ) : filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No settlements recorded yet. Click "New Settlement Statement" to generate.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {s.settlementNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {s.courierName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.settlementDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">{s.deliveredParcelsCount}</span> del / {s.returnedParcelsCount} ret
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      Rs. {s.grossCodCollection.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 font-mono">
                      - Rs. {(s.deliveryCharges + (s.returnCharges || 0)).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      Rs. {s.totalReceivable.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold font-mono">
                      Rs. {s.paymentReceived.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-mono font-bold ${
                          s.remainingDue > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600"
                        }`}
                      >
                        Rs. {s.remainingDue.toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {s.remainingDue <= 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Fully Paid
                        </span>
                      ) : (s.paymentReceived || 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Partially Paid
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.remainingDue > 0 && (
                          <Link href="/payments">
                            <button
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                              title="Go to Payments to pay settlement or remaining due"
                            >
                              <span>Pay Due</span>
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSettlementId(s._id || s.settlementNumber);
                            setShowDetailsModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
                          title="View customer delivery details, returns, and batch manifest"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setWizardCourierId(s.courierId);
                            setStartDate(s.startDate || s.settlementDate);
                            setEndDate(s.endDate || s.settlementDate);
                            if ((s as any).batchId) {
                              setWizardBatchId((s as any).batchId);
                            }
                            setShowWizard(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 transition-colors"
                          title="Re-open wizard to re-generate statement or adjust payment"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Re-generate</span>
                        </button>
                        <Link href={`/settlements/${s._id}`}>
                          <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 transition-colors">
                            <Printer className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => setSettlementToDelete(s)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 transition-colors"
                            title="Delete statement and unlock parcels (Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Settlement Modal / Wizard */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Generate Courier COD Settlement Statement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automated financial reconciliation according to official accounting formula
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Courier Partner <span className="text-rose-500">*</span>
                </label>
                <select
                  value={wizardCourierId}
                  onChange={(e) => {
                    setWizardCourierId(e.target.value);
                    setWizardBatchId("");
                  }}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {couriers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch Filter (Optional)
                </label>
                <select
                  value={wizardBatchId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setWizardBatchId(bId);
                    if (bId) {
                      const foundBatch = wizardBatches.find((b) => b.batchId === bId);
                      if (foundBatch?.dispatchDate) {
                        if (startDate > foundBatch.dispatchDate) setStartDate(foundBatch.dispatchDate);
                        if (endDate < foundBatch.dispatchDate) setEndDate(foundBatch.dispatchDate);
                      }
                    }
                  }}
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Batches in Period</option>
                  {wizardBatches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} ({b.totalParcels} parcels • {b.dispatchDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Date Period <span className="text-rose-500">*</span>
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

            {/* Accounting Calculation Card (Matching Reference Screenshot 3 Exact Formula) */}
            {loadingPreview ? (
              <div className="py-8 text-center text-slate-400">
                Calculating eligible delivered parcels and previous balances...
              </div>
            ) : preview ? (
              <div className="space-y-4">
                {/* Parcel Processing Summary Pill Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      Delivered Parcels
                    </span>
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {preview.deliveredCount}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-center">
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                      Returned Parcels
                    </span>
                    <span className="text-xl font-bold text-rose-700 dark:text-rose-300">
                      {preview.returnedCount}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Processed
                    </span>
                    <span className="text-xl font-bold text-white">
                      {preview.deliveredCount + preview.returnedCount}
                    </span>
                  </div>
                </div>

                {/* Calculation Breakdown Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-200 flex justify-between border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    <span>Settlement Details & Description</span>
                    <span>Amount (NPR)</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {/* Gross COD Collection */}
                    <div className="px-4 py-2.5 flex justify-between bg-slate-50/60 dark:bg-slate-800/20 font-medium">
                      <span className="text-slate-800 dark:text-slate-200">
                        Gross COD Collection ({preview.deliveredCount} Delivered Parcels)
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        Rs. {preview.grossCodCollection.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="px-4 py-2.5 flex justify-between text-rose-600 dark:text-rose-400 pl-6">
                      <span>Less: Delivery Charges ({preview.deliveredCount} packages)</span>
                      <span className="font-mono">
                        - Rs. {preview.deliveryCharges.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {(preview.previousOutstandingDue || 0) > 0 && (
                      <div className="px-4 py-2.5 flex justify-between bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-900 dark:text-white">
                        <span>Current Net Receivable</span>
                        <span>Rs. {preview.currentNetReceivable.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    {(preview.previousOutstandingDue || 0) > 0 && (
                      <div className="px-4 py-2.5 flex justify-between text-slate-700 dark:text-slate-300 pl-6">
                        <span>Add: Previous Outstanding Due (Brought Forward)</span>
                        <span className="font-mono">
                          + Rs. {preview.previousOutstandingDue.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <div className="px-4 py-3 flex justify-between bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 font-extrabold text-sm border-t border-b border-blue-200 dark:border-blue-800">
                      <span>TOTAL RECEIVABLE FROM COURIER</span>
                      <span className="font-mono">
                        Rs. {preview.totalReceivable.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Payment Input Lines: Cash & Online Split */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                          Less: Cash Received (Rs.)
                        </span>
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <span className="text-slate-400 font-mono text-xs">Rs.</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={wizardCashAmount}
                            onChange={(e) => setWizardCashAmount(e.target.value)}
                            placeholder="0"
                            className="w-full text-right font-bold text-xs text-slate-800 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                          Less: Online Received (Rs.)
                        </span>
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <span className="text-slate-400 font-mono text-xs">Rs.</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={wizardOnlineAmount}
                            onChange={(e) => setWizardOnlineAmount(e.target.value)}
                            placeholder="0"
                            className="w-full text-right font-bold text-xs text-emerald-600 rounded-lg border border-emerald-300 dark:border-emerald-800 p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          Total Payment Received Now
                        </span>
                        <span className="font-mono font-black text-emerald-600 text-sm">
                          - Rs. {wizardTotalPaid.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                        * Leave as 0 if this bill is currently unpaid. Any remaining due will be stored in database and can be collected in the Payments section anytime.
                      </p>
                    </div>

                    {/* Remaining Due Result */}
                    <div className="px-4 py-3 flex justify-between bg-slate-900 text-white font-extrabold text-sm">
                      <span className="text-blue-400">
                        REMAINING DUE (CARRIED FORWARD)
                      </span>
                      <span className="font-mono text-base text-white">
                        Rs. {wizardRemainingDue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Returned Parcels Accounting Card (Automatically fetched from returned batches) */}
                {preview.returnedParcels && preview.returnedParcels.length > 0 && (
                  <div className="border border-rose-200 dark:border-rose-900/60 rounded-xl overflow-hidden text-xs bg-rose-50/20 dark:bg-rose-950/10">
                    <div className="bg-rose-50 dark:bg-rose-950/40 px-4 py-2 font-bold text-rose-800 dark:text-rose-300 flex justify-between items-center border-b border-rose-200 dark:border-rose-900/60 uppercase tracking-wider text-[11px]">
                      <span>Returned Parcels in this Period (Rs. 0 COD Payable)</span>
                      <span>{preview.returnedParcels.length} Parcels</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto divide-y divide-rose-100 dark:divide-rose-900/40">
                      {preview.returnedParcels.map((rp) => (
                        <div key={rp._id} className="px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-rose-600 text-[11px]">{rp.parcelId}</span>
                            <span className="font-mono text-[10px] text-slate-400">({rp.batchId})</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{rp.customerName}</span>
                            <span className="font-mono text-[10px] text-blue-600 font-bold">{rp.customerPhone}</span>
                          </div>
                          <div className="text-right">
                            <span className="line-through text-slate-400 font-mono text-[11px] mr-2">
                              Rs. {rp.codAmount.toLocaleString("en-IN")}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              {rp.returnReason || "Returned"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Batch Breakdown Table */}
                {preview.batchBreakdown && preview.batchBreakdown.length > 1 && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-200 flex justify-between border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                      <span>Batch Reconciliation Breakdown</span>
                      <span>Delivered vs Returned</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {preview.batchBreakdown.map((b) => (
                        <div key={b.batchId} className="px-4 py-2 flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-blue-600">{b.batchId}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-emerald-700 dark:text-emerald-400">
                              Delivered: <strong>{b.deliveredCount}</strong> (Rs. {b.deliveredCod.toLocaleString("en-IN")})
                            </span>
                            <span className="text-rose-700 dark:text-rose-400">
                              Returned: <strong>{b.returnedCount}</strong> (Rs. {b.returnedCod.toLocaleString("en-IN")} excl.)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Method & Reference Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Esewa">Esewa</option>
                      <option value="Khalti">Khalti</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Payment Reference / Txn ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NABIL-TXN-998822"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Settlement Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. November cycle settlement"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowWizard(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeSettlement}
                disabled={finalizing || !preview || (preview.deliveredCount === 0 && preview.returnedCount === 0)}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-500/20 transition-all"
              >
                {preview?.isResettlementMode ? (
                  <RefreshCw className={`w-4 h-4 ${finalizing ? "animate-spin" : ""}`} />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>
                  {finalizing
                    ? (preview?.isResettlementMode ? "Updating Courier Bill..." : "Generating Courier Bill...")
                    : (preview?.isResettlementMode ? "Re-generate & Finalize Courier Bill" : "Generate & Finalize Courier Bill")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Manifest / Details Modal */}
      <SettlementDetailsModal
        settlementIdOrNumber={selectedSettlementId}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedSettlementId(null);
        }}
      />

      {/* Delete Settlement Confirmation Modal (Admin Only) */}
      {settlementToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Settlement Statement?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This action is permanent and restricted to <strong>Admin</strong> users.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Settlement #:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {settlementToDelete.settlementNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Courier Partner:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {settlementToDelete.courierName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Total Receivable:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  Rs. {settlementToDelete.totalReceivable?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Parcels Included:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {settlementToDelete.totalProcessedCount || ((settlementToDelete.deliveredParcelsCount || 0) + (settlementToDelete.returnedParcelsCount || 0))} packages
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
              ⚠️ Deleting this statement will unlock all associated parcels, returning them to unsettled status so they can be re-settled. Any linked ledger debit/credit entries will be reversed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSettlementToDelete(null)}
                disabled={deletingSettlement}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSettlement}
                disabled={deletingSettlement}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingSettlement ? "Deleting..." : "Confirm & Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
