"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  Building2,
  Phone,
  User,
  MapPin,
  Boxes,
  ShieldAlert,
  ArrowRight,
  History,
  FileCheck2,
  Plus,
  Trash2,
  ClipboardPaste,
  CheckSquare,
  Square,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { IParcel, IReturnRecord, ICourierCompany, IBatch } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";
import { BatchReturnsModal } from "@/components/returns/BatchReturnsModal";

const RETURN_REASONS = [
  "Customer rejected parcel",
  "Customer did not answer / unreachable",
  "Address not found / incorrect location",
  "Customer unavailable",
  "Damaged during courier transit",
  "Cancelled by buyer",
  "Wrong item ordered",
  "Other",
];

interface BulkReturnRow {
  id: string;
  customerPhone: string;
  returnReason: string;
  notes: string;
}

export default function ReturnManagementPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  // View Mode: Bulk Batch Return vs Quick Single Search
  const [viewMode, setViewMode] = useState<"bulk" | "single">("bulk");

  // Couriers list
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState("");

  // Batches list for selected courier
  const [batches, setBatches] = useState<IBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [isManualBatch, setIsManualBatch] = useState(false);
  const [manualBatchCode, setManualBatchCode] = useState("");

  // Return Date
  const [returnDate, setReturnDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Batch parcels loaded from backend
  const [batchParcels, setBatchParcels] = useState<IParcel[]>([]);
  const [loadingBatchParcels, setLoadingBatchParcels] = useState(false);

  // Bulk Rows
  const [bulkRows, setBulkRows] = useState<BulkReturnRow[]>([
    { id: "row-1", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
    { id: "row-2", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
    { id: "row-3", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
    { id: "row-4", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
    { id: "row-5", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
  ]);

  const [savingBulk, setSavingBulk] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showBatchReturnsModal, setShowBatchReturnsModal] = useState(false);

  // Single Search State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<IParcel[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<IParcel | null>(null);
  const [singleReturnReason, setSingleReturnReason] = useState(RETURN_REASONS[0]);
  const [singleReturnNotes, setSingleReturnNotes] = useState("");
  const [processingSingle, setProcessingSingle] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Recent Inward Returns Log
  const [recentReturns, setRecentReturns] = useState<IReturnRecord[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [returnStartDate, setReturnStartDate] = useState("");
  const [returnEndDate, setReturnEndDate] = useState("");

  // Revert / Cancel Return Modal State
  const [revertTarget, setRevertTarget] = useState<{
    returnId?: string;
    parcelId: string;
    customerName?: string;
    customerPhone?: string;
    batchId?: string;
  } | null>(null);
  const [cancellingReturn, setCancellingReturn] = useState(false);

  const filteredReturns = recentReturns.filter((r) => {
    if (returnStartDate && r.returnDate < returnStartDate) return false;
    if (returnEndDate && r.returnDate > returnEndDate) return false;
    return true;
  });

  // Effective Batch ID
  const effectiveBatchId = isManualBatch ? manualBatchCode.trim() : selectedBatchId;

  // Selected courier object
  const selectedCourier = useMemo(() => {
    return couriers.find((c) => c._id === selectedCourierId);
  }, [couriers, selectedCourierId]);

  // Load couriers on mount
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

    fetchRecentReturns();

    if (initialQuery) {
      setViewMode("single");
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  // Load batches when selected courier changes
  useEffect(() => {
    if (!selectedCourierId) return;
    fetch(`/api/batches?courierId=${selectedCourierId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.batches) {
          setBatches(data.batches);
          if (data.batches.length > 0) {
            setSelectedBatchId(data.batches[0].batchId);
          } else {
            setSelectedBatchId("");
          }
        }
      })
      .catch(console.error);
  }, [selectedCourierId]);

  // Load parcels for selected batch
  const loadBatchParcels = (bId: string, cId: string) => {
    if (!bId) {
      setBatchParcels([]);
      return;
    }
    setLoadingBatchParcels(true);
    fetch(`/api/parcels?batchId=${encodeURIComponent(bId)}&courierId=${encodeURIComponent(cId)}&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.parcels) {
          const sorted = [...data.parcels].sort((a: any, b: any) =>
            (a.parcelId || "").localeCompare(b.parcelId || "", undefined, { numeric: true, sensitivity: "base" })
          );
          setBatchParcels(sorted);
        } else {
          setBatchParcels([]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingBatchParcels(false));
  };

  useEffect(() => {
    if (effectiveBatchId && selectedCourierId) {
      loadBatchParcels(effectiveBatchId, selectedCourierId);
    } else {
      setBatchParcels([]);
    }
  }, [effectiveBatchId, selectedCourierId]);

  const fetchRecentReturns = () => {
    setLoadingReturns(true);
    fetch("/api/returns")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.returns) {
          setRecentReturns(data.returns);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingReturns(false));
  };

  const handleConfirmRevertToDelivered = async () => {
    if (!revertTarget) return;
    setCancellingReturn(true);
    const toastId = toast.loading(`Reverting parcel ${revertTarget.parcelId} to Delivered...`);
    try {
      const query = new URLSearchParams();
      if (revertTarget.returnId) query.set("returnId", revertTarget.returnId);
      if (revertTarget.parcelId) query.set("parcelId", revertTarget.parcelId);

      const res = await fetch(`/api/returns?${query.toString()}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel return");
      }

      toast.success(data.message || `Parcel ${revertTarget.parcelId} restored to Delivered!`, {
        id: toastId,
      });

      setRevertTarget(null);
      fetchRecentReturns();

      // Refresh current batch parcels if viewing a batch
      if (effectiveBatchId && selectedCourierId) {
        loadBatchParcels(effectiveBatchId, selectedCourierId);
      }

      // If the currently selected parcel was the reverted one, update its state
      if (selectedParcel?.parcelId === revertTarget.parcelId) {
        setSelectedParcel((prev) =>
          prev ? { ...prev, status: "Delivered", returnDate: undefined, returnReason: undefined } : null
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel return", { id: toastId });
    } finally {
      setCancellingReturn(false);
    }
  };

  // Batch stats summary
  const batchStats = useMemo(() => {
    const total = batchParcels.length;
    const returned = batchParcels.filter((p) => p.status === "Returned to Warehouse").length;
    const delivered = batchParcels.filter((p) => p.status === "Delivered").length;
    const withCourier = batchParcels.filter(
      (p) => p.status === "With Courier" || p.status === "Pending Verification"
    ).length;
    const failed = batchParcels.filter((p) => p.status === "Delivery Attempt Failed").length;
    const availableToReturn = total - returned;
    return { total, returned, delivered, withCourier, failed, availableToReturn };
  }, [batchParcels]);

  // Map mobile numbers to matching parcel in this batch
  const getParcelByPhone = (phone: string) => {
    const clean = phone.trim();
    if (!clean || clean.length < 7) return null;
    return batchParcels.find((p) => p.customerPhone.trim() === clean) || null;
  };

  // Valid rows that have matched an unreturned parcel
  const validMatchedReturns = useMemo(() => {
    const valid: Array<{
      row: BulkReturnRow;
      matchedParcel: IParcel;
    }> = [];
    for (const r of bulkRows) {
      const p = r.customerPhone.trim();
      if (!p) continue;
      const matched = batchParcels.find((item) => item.customerPhone.trim() === p);
      if (matched && matched.status !== "Returned to Warehouse") {
        valid.push({ row: r, matchedParcel: matched });
      }
    }
    return valid;
  }, [bulkRows, batchParcels]);

  const totalReturnCod = useMemo(() => {
    return validMatchedReturns.reduce((sum, item) => sum + item.matchedParcel.codAmount, 0);
  }, [validMatchedReturns]);

  // Row Manipulation
  const addRows = (count: number) => {
    const newRows: BulkReturnRow[] = Array.from({ length: count }, (_, i) => ({
      id: "row-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6) + "-" + i,
      customerPhone: "",
      returnReason: RETURN_REASONS[0],
      notes: "",
    }));
    setBulkRows((prev) => [...prev, ...newRows]);
  };

  const updateBulkRow = (index: number, field: keyof BulkReturnRow, value: string) => {
    setBulkRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const deleteBulkRow = (index: number) => {
    setBulkRows((prev) => {
      if (prev.length <= 1) {
        toast("Must keep at least one row", { icon: "ℹ️" });
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Paste from Excel
  const handlePasteExcel = (text: string) => {
    if (!text.trim()) return;
    const lines = text.trim().split(/\r\n|\n|\r/);
    const newRows: BulkReturnRow[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = line.split(/\t|,/);
      let phone = "";
      let reason = RETURN_REASONS[0];
      let notes = "";

      if (
        i === 0 &&
        (cols[0].toLowerCase().includes("phone") ||
          cols[0].toLowerCase().includes("mobile") ||
          cols[0].toLowerCase().includes("customer"))
      ) {
        continue;
      }

      phone = cols[0]?.replace(/[^0-9]/g, "") || "";
      if (!phone && cols[1]) {
        phone = cols[1]?.replace(/[^0-9]/g, "") || "";
      }
      if (cols[1] && isNaN(Number(cols[1]))) {
        const foundReason = RETURN_REASONS.find(
          (r) => r.toLowerCase() === cols[1].trim().toLowerCase()
        );
        reason = foundReason || cols[1].trim();
      }
      if (cols[2]) {
        notes = cols[2].trim();
      }

      if (phone) {
        newRows.push({
          id: "row-paste-" + Date.now() + "-" + i,
          customerPhone: phone,
          returnReason: reason,
          notes,
        });
      }
    }

    if (newRows.length > 0) {
      setBulkRows((prev) => {
        const existingNonEmpty = prev.filter((r) => r.customerPhone.trim());
        return [...existingNonEmpty, ...newRows];
      });
      toast.success(`Imported ${newRows.length} customer mobile entries!`);
      setShowPasteModal(false);
      setPasteText("");
    } else {
      toast.error("No valid customer phone numbers found in pasted text.");
    }
  };

  // Pick parcel directly from batch list
  const handlePickBatchParcel = (parcel: IParcel) => {
    if (parcel.status === "Returned to Warehouse") {
      toast.error(`Parcel ${parcel.parcelId} is already marked as returned`);
      return;
    }
    const exists = bulkRows.some(
      (r) => r.customerPhone.trim() === parcel.customerPhone.trim()
    );
    if (exists) {
      toast("Customer mobile is already in the return list", { icon: "ℹ️" });
      return;
    }

    setBulkRows((prev) => {
      const emptyIdx = prev.findIndex((r) => !r.customerPhone.trim());
      if (emptyIdx !== -1) {
        const copy = [...prev];
        copy[emptyIdx] = {
          ...copy[emptyIdx],
          customerPhone: parcel.customerPhone,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: "row-" + Date.now() + "-" + Math.random(),
          customerPhone: parcel.customerPhone,
          returnReason: RETURN_REASONS[0],
          notes: "",
        },
      ];
    });
    toast.success(`Added ${parcel.customerName} (${parcel.customerPhone}) to return list`);
  };

  // Submit Bulk Returns
  const handleSaveBulkReturns = async () => {
    if (!selectedCourierId) {
      toast.error("Please select a Courier Partner.");
      return;
    }
    if (!effectiveBatchId) {
      toast.error("Please select or enter a Batch Number / Code.");
      return;
    }
    if (validMatchedReturns.length === 0) {
      toast.error(
        "Please enter at least one valid customer mobile number that matches an unreturned parcel in this batch."
      );
      return;
    }

    setSavingBulk(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk",
          courierId: selectedCourierId,
          batchId: effectiveBatchId,
          returnDate,
          returns: validMatchedReturns.map((v) => ({
            customerPhone: v.row.customerPhone.trim(),
            parcelId: v.matchedParcel.parcelId,
            returnReason: v.row.returnReason,
            notes: v.row.notes,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process bulk returns");
      }

      toast.success(
        `Successfully inwarded ${data.successCount} returned parcel(s) for Batch ${effectiveBatchId}! Status updated to 'Returned to Warehouse'.`,
        { duration: 6000 }
      );

      // Refresh
      loadBatchParcels(effectiveBatchId, selectedCourierId);
      fetchRecentReturns();

      // Reset rows to 5 fresh rows
      setBulkRows([
        { id: "row-" + Date.now() + "-1", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
        { id: "row-" + Date.now() + "-2", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
        { id: "row-" + Date.now() + "-3", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
        { id: "row-" + Date.now() + "-4", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
        { id: "row-" + Date.now() + "-5", customerPhone: "", returnReason: RETURN_REASONS[0], notes: "" },
      ]);
    } catch (err: any) {
      toast.error(err.message || "Error processing bulk returns");
    } finally {
      setSavingBulk(false);
    }
  };

  // Single Search Functions
  const handleSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/returns?action=search&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success && data.parcels) {
        setSearchResults(data.parcels);
        if (data.parcels.length === 1) {
          handleSelectParcel(data.parcels[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectParcel = (parcel: IParcel) => {
    setSelectedParcel(parcel);
    setSingleReturnNotes("");
  };

  const handleConfirmSingleReturn = async () => {
    if (!selectedParcel) return;

    if (selectedParcel.status === "Returned to Warehouse") {
      toast.error(
        "This parcel is already marked as 'Returned to Warehouse'. Duplicate returns are prevented."
      );
      setShowConfirmModal(false);
      return;
    }

    setProcessingSingle(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId: selectedParcel.parcelId,
          returnReason: singleReturnReason,
          returnCharge: 0,
          notes: singleReturnNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process return");
      }

      toast.success(
        `Parcel ${selectedParcel.parcelId} physically accepted into warehouse! Status: 'Returned to Warehouse'.`,
        { duration: 5000 }
      );

      setShowConfirmModal(false);
      setSelectedParcel(data.parcel);
      fetchRecentReturns();
    } catch (err: any) {
      toast.error(err.message || "Error processing return inward");
    } finally {
      setProcessingSingle(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800">
                Warehouse Inwarding
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Return Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bulk inward returns by courier and batch using Customer Mobile Number as unique ID, or search individual parcels
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode("bulk")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "bulk"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Bulk Batch Return Entry</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "single"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Quick Search Inward</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: BULK BATCH RETURN ENTRY (USER REQUESTED WORKFLOW)  */}
      {/* ========================================================= */}
      {viewMode === "bulk" && (
        <div className="space-y-4">
          {/* Header Controls: Courier, Batch & Return Date */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Courier Partner */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Courier Partner <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {couriers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Code / Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Batch Code <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManualBatch(!isManualBatch)}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {isManualBatch ? "Choose from Dropdown" : "Type Custom Code"}
                  </button>
                </div>

                {isManualBatch ? (
                  <input
                    type="text"
                    placeholder="e.g. GE-20261106-001, SE-20261106-001"
                    value={manualBatchCode}
                    onChange={(e) => setManualBatchCode(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                ) : (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {batches.length === 0 ? (
                      <option value="">No batches found for this courier</option>
                    ) : (
                      batches.map((b) => (
                        <option key={b.batchId} value={b.batchId}>
                          {b.batchId} ({b.totalParcels} parcels &bull; {b.dispatchDate})
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              {/* Return Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Return Date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Batch Quick Stats Pill */}
              <div className="flex flex-col justify-end">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-around text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Dispatched</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                      {batchStats.total}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                  <div>
                    <span className="text-[10px] text-blue-600 block uppercase font-bold">Available</span>
                    <span className="text-xs font-extrabold text-blue-600 font-mono">
                      {batchStats.availableToReturn}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                  <button
                    type="button"
                    onClick={() => setShowBatchReturnsModal(true)}
                    className="cursor-pointer hover:opacity-80 transition group text-center"
                    title="Click to see return details from courier with this batch ID"
                  >
                    <span className="text-[10px] text-rose-600 block uppercase font-bold flex items-center justify-center gap-1">
                      <span>Returned</span>
                      <RotateCcw className="w-2.5 h-2.5 inline group-hover:rotate-45 transition-transform" />
                    </span>
                    <span className="text-xs font-extrabold text-rose-600 font-mono group-hover:underline">
                      {batchStats.returned}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Return Spreadsheet Table Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Table Control Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Add Rows:
                </span>
                <button
                  type="button"
                  onClick={() => addRows(1)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                >
                  +1 Row
                </button>
                <button
                  type="button"
                  onClick={() => addRows(5)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                >
                  +5 Rows
                </button>
                <button
                  type="button"
                  onClick={() => addRows(10)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                >
                  +10 Rows
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasteModal(true)}
                  className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
                  <span>Paste Mobiles from Excel</span>
                </button>

                {batchParcels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPickerModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select from Batch List ({batchStats.availableToReturn})</span>
                  </button>
                )}

                {/* Button to see the return details from courier with batch ID */}
                <button
                  type="button"
                  onClick={() => setShowBatchReturnsModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-xs"
                  title="See return details from courier with this batch ID"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>See Return Details ({batchStats.returned})</span>
                </button>
              </div>

              {/* Status summary */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Total Rows: <strong className="text-slate-800 dark:text-slate-100 font-mono">{bulkRows.length}</strong>
                </span>
                <span className="text-slate-500">
                  Matched & Ready: <strong className="text-emerald-600 font-mono font-bold">{validMatchedReturns.length}</strong>
                </span>
                <span className="text-slate-500">
                  Return COD Sum: <strong className="text-blue-600 font-mono font-bold">Rs. {totalReturnCod.toLocaleString("en-IN")}</strong>
                </span>
              </div>
            </div>

            {/* Bulk Return Spreadsheet Table */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/90 dark:bg-slate-800/90 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center font-bold text-slate-600 dark:text-slate-300">
                      S.N.
                    </th>
                    <th className="py-2.5 px-3 min-w-[180px] font-bold text-slate-600 dark:text-slate-300">
                      CUSTOMER MOBILE NUMBER (UNIQUE ID) <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-2.5 px-3 min-w-[200px] font-bold text-slate-600 dark:text-slate-300">
                      MATCHED CUSTOMER & PARCEL
                    </th>
                    <th className="py-2.5 px-3 min-w-[130px] font-bold text-slate-600 dark:text-slate-300 text-right">
                      COD AMOUNT (RS.)
                    </th>
                    <th className="py-2.5 px-3 min-w-[200px] font-bold text-slate-600 dark:text-slate-300">
                      RETURN REASON <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-2.5 px-3 min-w-[180px] font-bold text-slate-600 dark:text-slate-300">
                      WAREHOUSE NOTES
                    </th>
                    <th className="py-2.5 px-2 w-10 text-center font-bold text-slate-600 dark:text-slate-300">
                      DEL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                  {bulkRows.map((row, idx) => {
                    const phone = row.customerPhone.trim();
                    const matched = getParcelByPhone(phone);
                    const alreadyRet = matched ? matched.status === "Returned to Warehouse" : false;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors ${
                          matched && !alreadyRet ? "bg-emerald-50/20 dark:bg-emerald-950/10" : ""
                        }`}
                      >
                        {/* S.N. */}
                        <td className="py-1 px-3 text-center text-slate-400 font-mono select-none">
                          {idx + 1}
                        </td>

                        {/* Customer Mobile Number */}
                        <td className="py-1 px-2 relative">
                          <input
                            type="text"
                            placeholder="Enter 10-digit mobile..."
                            value={row.customerPhone}
                            onChange={(e) => updateBulkRow(idx, "customerPhone", e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:outline-none transition-all"
                          />
                        </td>

                        {/* Matched Customer & Parcel */}
                        <td className="py-1 px-2">
                          {phone.length >= 7 ? (
                            matched ? (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      alreadyRet
                                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    }`}
                                  >
                                    {alreadyRet ? "ALREADY INWARDED" : "MATCHED ✓"}
                                  </span>
                                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                                    {matched.customerName}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {matched.parcelId} &bull; {matched.itemSku || "No SKU"}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Not found in batch {effectiveBatchId || "..."}</span>
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-300 italic">
                              Enter mobile to auto-match parcel
                            </span>
                          )}
                        </td>

                        {/* COD Amount */}
                        <td className="py-1 px-2 text-right">
                          {matched ? (
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white font-mono">
                                Rs. {matched.codAmount.toLocaleString("en-IN")}
                              </span>
                              <span className="text-[9px] text-rose-600 block font-medium">
                                Rs. 0 Receivable
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>

                        {/* Return Reason */}
                        <td className="py-1 px-2">
                          <select
                            value={row.returnReason}
                            onChange={(e) => updateBulkRow(idx, "returnReason", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                          >
                            {RETURN_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Notes */}
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            placeholder="Optional warehouse remarks"
                            value={row.notes}
                            onChange={(e) => updateBulkRow(idx, "notes", e.target.value)}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                          />
                        </td>

                        {/* Del Action */}
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => deleteBulkRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Bulk Confirmation Strip */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Inwarding these parcels will mark them as <strong>Returned to Warehouse</strong> under Batch <strong>{effectiveBatchId || "..."}</strong>. During COD settlement, their COD amount will automatically be fetched and excluded from payable collections.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveBulkReturns}
                  disabled={savingBulk || validMatchedReturns.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-md shadow-rose-500/20 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {savingBulk
                      ? "Inwarding..."
                      : `Confirm & Inward (${validMatchedReturns.length}) Returned Parcels`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: SINGLE PARCEL / MOBILE SEARCH INWARD (LEGACY/INSTANT) */}
      {/* ========================================================= */}
      {viewMode === "single" && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2 max-w-3xl"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Customer Mobile (Unique ID), Parcel ID, or Batch ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all shrink-0"
            >
              {searching ? "Searching..." : "Search Parcel"}
            </button>
          </form>

          {/* Customer & Associated Parcels Section (Mobile as Unique ID) */}
          {searchResults.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    Customer: {searchResults[0].customerName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Mobile ID: {searchResults[0].customerPhone}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {searchResults.length} parcel{searchResults.length > 1 ? "s" : ""} registered to this mobile number
                </span>
              </div>

              {/* Table of all parcels for this mobile number */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="text-[10px] text-slate-500 uppercase bg-slate-100/70 dark:bg-slate-800">
                    <tr>
                      <th className="py-2 px-3">Parcel ID</th>
                      <th className="py-2 px-3">Item / SKU</th>
                      <th className="py-2 px-3">COD Amount</th>
                      <th className="py-2 px-3">Courier</th>
                      <th className="py-2 px-3">Batch & Date</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                    {searchResults.map((p) => {
                      const isSelected = selectedParcel?.parcelId === p.parcelId;
                      const isAlreadyReturned = p.status === "Returned to Warehouse";
                      return (
                        <tr
                          key={p._id}
                          className={`transition-colors ${
                            isSelected
                              ? "bg-blue-50/80 dark:bg-blue-950/40"
                              : "hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-semibold text-blue-600">{p.parcelId}</td>
                          <td className="py-2 px-3">{p.itemSku || "—"}</td>
                          <td className="py-2 px-3 font-bold">Rs. {p.codAmount.toLocaleString("en-IN")}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{p.courierName}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                            {p.batchId} ({p.dispatchDate})
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isAlreadyReturned
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : p.status === "Delivered"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : p.status === "Delivery Attempt Failed"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isAlreadyReturned ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setRevertTarget({
                                    parcelId: p.parcelId,
                                    customerName: p.customerName,
                                    customerPhone: p.customerPhone,
                                    batchId: p.batchId,
                                  })
                                }
                                title="Wrong entry? Cancel return and restore to Delivered"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Revert to Delivered</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectParcel(p)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isSelected
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white"
                                }`}
                              >
                                {isSelected ? "Selected ✓" : "Select for Return"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Selected Parcel Inward Confirmation Box */}
          {selectedParcel && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-3">
                <div className="flex items-center gap-2.5">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-mono text-xs text-blue-600 font-bold block">
                      {selectedParcel.parcelId}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedParcel.customerName} &bull; {selectedParcel.customerPhone}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">COD Amount (Excluded)</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Rs. {selectedParcel.codAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {selectedParcel.status === "Returned to Warehouse" ? (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold block">✓ This parcel is currently marked as Returned to Warehouse ({selectedParcel.returnDate || "inwarded"}).</span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400">Mistaken return entry? You can cancel this return and restore the parcel to Delivered status.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRevertTarget({
                        parcelId: selectedParcel.parcelId,
                        customerName: selectedParcel.customerName,
                        customerPhone: selectedParcel.customerPhone,
                        batchId: selectedParcel.batchId,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Revert to Delivered</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Return Reason <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={singleReturnReason}
                        onChange={(e) => setSingleReturnReason(e.target.value)}
                        className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        {RETURN_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Warehouse Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Item intact, box undamaged"
                        value={singleReturnNotes}
                        onChange={(e) => setSingleReturnNotes(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Confirm Inward Return</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: PASTE FROM EXCEL (MOBILE NUMBERS)                */}
      {/* ========================================================= */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Paste Returned Customer Mobiles from Excel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Copy customer phone numbers from Excel and paste here. You can paste just mobile numbers, or mobile numbers with reason.
            </p>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="9841000001&#10;9841000002&#10;9841000003	Customer rejected"
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePasteExcel(pasteText)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                Import Rows
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: BATCH PARCEL PICKER CHECKLIST                    */}
      {/* ========================================================= */}
      {showPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Select Returned Parcels from Batch {effectiveBatchId}
                </h3>
                <p className="text-xs text-slate-500">
                  Click on any parcel to add its customer mobile number to the bulk return entry table
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {batchParcels.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No parcels found in this batch.</div>
              ) : (
                batchParcels.map((p) => {
                  const isRet = p.status === "Returned to Warehouse";
                  const alreadyInList = bulkRows.some(
                    (r) => r.customerPhone.trim() === p.customerPhone.trim()
                  );

                  return (
                    <div
                      key={p._id}
                      className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-xs font-mono">
                          {p.parcelId.slice(-3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {p.customerName}
                            </span>
                            <span className="font-mono font-bold text-blue-600 text-[11px]">
                              {p.customerPhone}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                isRet
                                  ? "bg-rose-100 text-rose-700"
                                  : p.status === "Delivered"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {p.parcelId} &bull; {p.itemSku || "No SKU"} &bull; COD: Rs. {p.codAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isRet ? (
                          <span className="text-[11px] text-slate-400 italic">Already returned</span>
                        ) : alreadyInList ? (
                          <span className="text-[11px] text-emerald-600 font-semibold">Added in table ✓</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePickBatchParcel(p)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                          >
                            Add to Return
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPickerModal(false)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SINGLE CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      {showConfirmModal && selectedParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Confirm Return Inward
                </h3>
                <p className="text-xs text-slate-500">
                  Please verify parcel details before confirming
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Parcel ID:</span>
                <span className="font-mono font-bold text-blue-600">{selectedParcel.parcelId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold">
                  {selectedParcel.customerName} ({selectedParcel.customerPhone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Original Batch:</span>
                <span className="font-mono">{selectedParcel.batchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Courier:</span>
                <span className="font-semibold">{selectedParcel.courierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">COD (Not collected):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Rs. {selectedParcel.codAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Return Reason:</span>
                <span className="font-semibold text-rose-600">{singleReturnReason}</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
              ⚠️ Note: This will update the original parcel status to <strong>Returned to Warehouse</strong>. It does NOT create a duplicate parcel.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleReturn}
                disabled={processingSingle}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-md shadow-rose-500/20 transition-colors"
              >
                {processingSingle ? "Processing..." : "Confirm & Inward"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RECENT INWARDED RETURNS LOG TABLE                         */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Warehouse Inwarded Returns Log
            </h3>
            <span className="text-xs text-slate-400">
              ({filteredReturns.length} of {recentReturns.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DateQuickFilter
              startDate={returnStartDate}
              endDate={returnEndDate}
              onDateChange={(start, end) => {
                setReturnStartDate(start);
                setReturnEndDate(end);
              }}
            />
            {(returnStartDate || returnEndDate) && (
              <button
                onClick={() => {
                  setReturnStartDate("");
                  setReturnEndDate("");
                }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">RETURN ID</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">PARCEL ID</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">BATCH</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">CUSTOMER (MOBILE)</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">COURIER</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">COD AMOUNT</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">RETURN REASON</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">RETURN DATE</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">PROCESSED BY</th>
                <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loadingReturns ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading returns...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No returns found for the selected date range.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {r.returnId}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-blue-600 dark:text-blue-400">
                      {r.parcelId}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {r.batchId || "—"}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      <div>{r.customerName}</div>
                      <div className="font-mono text-[10px] text-blue-600">{r.customerPhone}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{r.courierName}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                      Rs. {r.codAmount ? r.codAmount.toLocaleString("en-IN") : "0"}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {r.returnReason}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{r.returnDate}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{r.processedBy}</td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          setRevertTarget({
                            returnId: r.returnId,
                            parcelId: r.parcelId,
                            customerName: r.customerName,
                            customerPhone: r.customerPhone,
                            batchId: r.batchId,
                          })
                        }
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

      {/* Revert / Cancel Return Confirmation Modal */}
      {revertTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Revert Return to Delivered?
                </h3>
                <p className="text-xs text-slate-500">
                  Cancel accidental return and restore parcel status
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Parcel ID:</span>
                <span className="font-mono font-bold text-blue-600">{revertTarget.parcelId}</span>
              </div>
              {revertTarget.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{revertTarget.customerName}</span>
                </div>
              )}
              {revertTarget.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-mono">{revertTarget.customerPhone}</span>
                </div>
              )}
              {revertTarget.batchId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch Code:</span>
                  <span className="font-mono font-semibold">{revertTarget.batchId}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              This will remove the return record, decrement the batch & courier return counters, and restore the parcel to <strong>Delivered</strong> status.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRevertTarget(null)}
                disabled={cancellingReturn}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevertToDelivered}
                disabled={cancellingReturn}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-500/20 transition-colors"
              >
                {cancellingReturn ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Mark Delivered</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Details Modal from Courier with Batch ID */}
      <BatchReturnsModal
        isOpen={showBatchReturnsModal}
        onClose={() => setShowBatchReturnsModal(false)}
        batchId={effectiveBatchId}
        courierName={selectedCourier?.name || "Selected Courier"}
        parcels={batchParcels}
        onReturnCancelled={() => {
          fetchRecentReturns();
          if (effectiveBatchId && selectedCourierId) {
            loadBatchParcels(effectiveBatchId, selectedCourierId);
          }
        }}
      />
    </div>
  );
}
