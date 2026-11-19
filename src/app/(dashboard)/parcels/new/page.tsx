"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Plus,
  Trash2,
  ClipboardPaste,
  Save,
  AlertTriangle,
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ICourierCompany } from "@/types";
import { getCourierBatchPrefix } from "@/lib/utils";

interface ParcelRow {
  id: string;
  customerName: string;
  customerPhone: string;
  codAmount: string;
  advancePayment: string;
  itemSku: string;
  deliveryCharge: string;
  customerAddress: string;
  remarks: string;
}

export default function BulkParcelEntryPage() {
  const router = useRouter();

  // Couriers list
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [batchDate, setBatchDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isCustomBatchId, setIsCustomBatchId] = useState(false);
  const [batchId, setBatchId] = useState(() => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `GE-${todayStr}-001`;
  });
  const [batchNotes, setBatchNotes] = useState("");

  // Table rows
  const [rows, setRows] = useState<ParcelRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected courier object
  const selectedCourier = useMemo(() => {
    return couriers.find((c) => c._id === selectedCourierId);
  }, [couriers, selectedCourierId]);

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

  // Auto-generate batch ID with courier initial prefix (e.g. GE, SE, KE, NCM) and date
  useEffect(() => {
    if (isCustomBatchId) return;
    const prefix = getCourierBatchPrefix(selectedCourier?.name || "Google Express");
    const datePart = (batchDate || new Date().toISOString().split("T")[0]).replace(/-/g, "");

    if (selectedCourierId) {
      fetch(`/api/batches?action=next-id&courierId=${encodeURIComponent(selectedCourierId)}&date=${datePart}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.nextBatchId) {
            setBatchId(data.nextBatchId);
          } else {
            setBatchId(`${prefix}-${datePart}-001`);
          }
        })
        .catch(() => {
          setBatchId(`${prefix}-${datePart}-001`);
        });
    } else {
      setBatchId(`${prefix}-${datePart}-001`);
    }
  }, [selectedCourierId, selectedCourier, batchDate, isCustomBatchId]);

  // Initialize initial 10 blank rows
  useEffect(() => {
    if (rows.length === 0) {
      addRows(10);
    }
  }, []);

  // Update default delivery charge from selected courier
  const defaultCharge = useMemo(() => {
    if (!selectedCourier) return 70;
    return selectedCourier.defaultDeliveryCharge || selectedCourier.defaultChargeInsideValley || 70;
  }, [selectedCourier]);

  const addRows = (count: number) => {
    const charge = defaultCharge.toString();
    const newRows: ParcelRow[] = Array.from({ length: count }, (_, i) => ({
      id: "row-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7) + "-" + i,
      customerName: "",
      customerPhone: "",
      codAmount: "0",
      advancePayment: "0",
      itemSku: "",
      deliveryCharge: charge,
      customerAddress: "",
      remarks: "",
    }));
    setRows((prev) => [...prev, ...newRows]);
  };

  const updateRow = (index: number, field: keyof ParcelRow, value: string) => {
    let finalValue = value;
    if (field === "customerPhone") {
      // Only digits allowed, max 10 characters
      finalValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: finalValue };
      return copy;
    });

    if (field === "customerPhone" && finalValue.length === 10) {
      autoLookupCustomer(finalValue, index);
    }
  };

  const deleteRow = (index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        toast("Must have at least one row", { icon: "ℹ️" });
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Duplicate mobile detection
  const duplicatePhones = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const p = r.customerPhone.trim();
      if (p.length >= 7) {
        counts[p] = (counts[p] || 0) + 1;
      }
    }
    const dups = new Set<string>();
    for (const [phone, count] of Object.entries(counts)) {
      if (count > 1) dups.add(phone);
    }
    return dups;
  }, [rows]);

  // Customer in-memory cache for fast auto-fill
  const customerLookupCache = useRef<Map<string, { name: string; address: string }>>(new Map());

  const autoLookupCustomer = async (phone: string, rowIndex: number) => {
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 10) return;

    // Check in-memory cache first
    const cached = customerLookupCache.current.get(cleanPhone);
    if (cached) {
      setRows((prev) => {
        const copy = [...prev];
        if (copy[rowIndex]) {
          let updated = false;
          const r = { ...copy[rowIndex] };
          if (!r.customerName.trim() && cached.name) {
            r.customerName = cached.name;
            updated = true;
          }
          if (!r.customerAddress.trim() && cached.address) {
            r.customerAddress = cached.address;
            updated = true;
          }
          if (updated) copy[rowIndex] = r;
        }
        return copy;
      });
      return;
    }

    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(cleanPhone)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.customers && data.customers.length > 0) {
          const match = data.customers.find((c: any) => c.phone === cleanPhone) || data.customers[0];
          if (match) {
            customerLookupCache.current.set(cleanPhone, {
              name: match.name || "",
              address: match.address || "",
            });
            setRows((prev) => {
              const copy = [...prev];
              if (copy[rowIndex]) {
                const r = { ...copy[rowIndex] };
                if (!r.customerName.trim() && match.name) {
                  r.customerName = match.name;
                }
                if (!r.customerAddress.trim() && match.address) {
                  r.customerAddress = match.address;
                }
                copy[rowIndex] = r;
              }
              return copy;
            });
          }
        }
      }
    } catch {}
  };

  // Aggregate Calculations
  const validRows = useMemo(() => {
    return rows.filter((r) => r.customerName.trim() || r.customerPhone.trim());
  }, [rows]);

  const totalCod = useMemo(() => {
    return validRows.reduce((sum, r) => sum + (parseFloat(r.codAmount) || 0), 0);
  }, [validRows]);

  const totalAdvance = useMemo(() => {
    return validRows.reduce((sum, r) => sum + (parseFloat(r.advancePayment) || 0), 0);
  }, [validRows]);

  const totalOrderValue = useMemo(() => {
    return totalCod + totalAdvance;
  }, [totalCod, totalAdvance]);

  const totalDeliveryCharge = useMemo(() => {
    return validRows.reduce((sum, r) => sum + (parseFloat(r.deliveryCharge) || 0), 0);
  }, [validRows]);

  const estimatedNet = useMemo(() => {
    return totalCod - totalDeliveryCharge;
  }, [totalCod, totalDeliveryCharge]);

  // Handle Tab/Enter Key Navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    fieldIndex: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // If we are at the last row, add a new row automatically
      if (rowIndex === rows.length - 1) {
        addRows(1);
        setTimeout(() => {
          const nextInput = document.getElementById(`cell-${rowIndex + 1}-0`);
          nextInput?.focus();
        }, 50);
      } else {
        // Move to the same column on next row
        const nextInput = document.getElementById(`cell-${rowIndex + 1}-${fieldIndex}`);
        nextInput?.focus();
      }
    }
  };

  // Excel / Clipboard Paste parser
  const handlePasteExcel = (text: string) => {
    if (!text.trim()) return;
    const lines = text.trim().split(/\r\n|\n|\r/);
    const parsedRows: ParcelRow[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = line.split("\t");

      // Check if header line
      if (
        i === 0 &&
        (cols[0].toLowerCase().includes("name") ||
          cols[0].toLowerCase().includes("s.n") ||
          cols[1]?.toLowerCase().includes("name"))
      ) {
        continue;
      }

      let name = "";
      let phone = "";
      let cod = "0";
      let advance = "0";
      let sku = "";
      let charge = defaultCharge.toString();
      let address = "";
      let remarks = "";

      let offset = 0;
      if (cols.length >= 2 && !isNaN(Number(cols[0])) && cols[0].trim().length <= 4) {
        // First column is S.N.
        offset = 1;
      }

      name = cols[offset]?.trim() || "";
      phone = cols[offset + 1]?.trim() || "";

      const col2 = cols[offset + 2]?.trim() || "";
      const col3 = cols[offset + 3]?.trim() || "";
      const col4 = cols[offset + 4]?.trim() || "";
      const col5 = cols[offset + 5]?.trim() || "";
      const col6 = cols[offset + 6]?.trim() || "";
      const col7 = cols[offset + 7]?.trim() || "";

      // Check whether this row is in the new layout (Name, Phone, Address, SKU, COD, Advance)
      // or legacy layout (Name, Phone, COD, Advance, SKU, Charge, Address)
      const isCol2Numeric = col2 !== "" && !isNaN(Number(col2.replace(/[^0-9.]/g, ""))) && !/[a-zA-Z\s,/-]/.test(col2);
      const isCol4Numeric = col4 !== "" && !isNaN(Number(col4.replace(/[^0-9.]/g, "")));

      if (!isCol2Numeric || isCol4Numeric) {
        // Layout A (New screen order): Name, Phone, Address, SKU, COD, Advance, Charge, Remarks
        address = col2;
        sku = col3;
        cod = col4.replace(/[^0-9.]/g, "") || "0";
        advance = col5.replace(/[^0-9.]/g, "") || "0";
        if (col6 && !isNaN(Number(col6.replace(/[^0-9.]/g, "")))) {
          charge = col6.replace(/[^0-9.]/g, "") || defaultCharge.toString();
          remarks = col7;
        } else {
          remarks = col6;
        }
      } else {
        // Layout B (Legacy order): Name, Phone, COD, Advance, SKU, Charge, Address, Remarks
        cod = col2.replace(/[^0-9.]/g, "") || "0";
        if (col3 && !isNaN(Number(col3.replace(/[^0-9.]/g, "")))) {
          advance = col3.replace(/[^0-9.]/g, "") || "0";
          sku = col4;
          if (col5 && !isNaN(Number(col5.replace(/[^0-9.]/g, "")))) {
            charge = col5;
            address = col6;
            remarks = col7;
          } else {
            address = col5;
            remarks = col6;
          }
        } else {
          // Legacy paste with area column
          if (col3.toLowerCase().includes("valley")) {
            sku = col4;
            address = col5;
            remarks = col6;
          } else {
            sku = col3;
            address = col4;
            remarks = col5;
          }
        }
      }

      if (name || phone) {
        const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
        parsedRows.push({
          id: "row-paste-" + Date.now() + "-" + i,
          customerName: name,
          customerPhone: cleanPhone,
          codAmount: cod,
          advancePayment: advance,
          itemSku: sku,
          deliveryCharge: charge,
          customerAddress: address,
          remarks,
        });
      }
    }

    if (parsedRows.length > 0) {
      setRows((prev) => {
        // Filter out blank rows from before
        const existingNonBlank = prev.filter((r) => r.customerName.trim() || r.customerPhone.trim());
        return [...existingNonBlank, ...parsedRows];
      });
      toast.success(`Imported ${parsedRows.length} parcels from clipboard!`);
      setShowPasteModal(false);
      setPasteText("");
    } else {
      toast.error("No valid parcel rows found in pasted text.");
    }
  };

  // File Upload (CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Try tab separated or comma separated
        const isComma = content.includes(",") && !content.includes("\t");
        const lines = content.split(/\r\n|\n/);
        const parsed: string[][] = lines.map((l) => (isComma ? l.split(",") : l.split("\t")));
        const tsv = parsed.map((p) => p.join("\t")).join("\n");
        handlePasteExcel(tsv);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save Batch to MongoDB
  const handleSaveBatch = async () => {
    if (!selectedCourierId) {
      toast.error("Please select a Courier Service.");
      return;
    }

    if (!batchId.trim()) {
      toast.error("Please enter a Batch Code / Number.");
      return;
    }

    const parcelsToSave = rows.filter(
      (r) => r.customerName.trim() && r.customerPhone.trim()
    );

    if (parcelsToSave.length === 0) {
      toast.error("Please enter at least one valid parcel with Customer Name and Mobile Number.");
      return;
    }

    const invalidPhoneRow = parcelsToSave.find(
      (p) => p.customerPhone.trim().length !== 10
    );
    if (invalidPhoneRow) {
      toast.error(
        `Mobile number for "${invalidPhoneRow.customerName || "Parcel"}" must be exactly 10 digits (currently ${invalidPhoneRow.customerPhone.trim().length} digits).`
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierId: selectedCourierId,
          dispatchDate: batchDate,
          serviceArea: "Inside Valley",
          notes: batchNotes,
          batchId,
          parcels: parcelsToSave.map((p) => ({
            customerName: p.customerName.trim(),
            customerPhone: p.customerPhone.trim(),
            customerAddress: p.customerAddress.trim(),
            deliveryArea: "Inside Valley",
            codAmount: parseFloat(p.codAmount) || 0,
            advancePayment: parseFloat(p.advancePayment) || 0,
            itemSku: p.itemSku.trim(),
            deliveryCharge: parseFloat(p.deliveryCharge) || defaultCharge,
            remarks: p.remarks.trim(),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save batch");
      }

      toast.success(
        `Batch ${data.batch.batchId} saved successfully with ${data.parcelsCount} parcels! Status: 'With Courier'.`,
        { duration: 5000 }
      );

      // Navigate to batches page
      router.push("/batches");
    } catch (err: any) {
      toast.error(err.message || "Error saving batch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                Fast Paced Entry
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Bulk Parcel Entry
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter 100+ parcels continuously using Tab or Enter keys, or paste directly from Excel &bull; Mobile number is unique customer ID (Multiple parcels per mobile supported)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Paste from Excel</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import File</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={handleSaveBatch}
              disabled={saving || validRows.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : `Save Batch (${validRows.length})`}</span>
            </button>
          </div>
        </div>

        {/* Batch Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Courier Service */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Courier Service <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedCourierId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCourierId(id);
                  setIsCustomBatchId(false);
                  const c = couriers.find((item) => item._id === id);
                  const newRate = (c?.defaultDeliveryCharge || c?.defaultChargeInsideValley || 70).toString();
                  setRows((prev) =>
                    prev.map((row) => ({
                      ...row,
                      deliveryCharge: row.deliveryCharge ? newRate : row.deliveryCharge,
                    }))
                  );
                }}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {couriers.map((c) => {
                  const rate = c.defaultDeliveryCharge || c.defaultChargeInsideValley || 70;
                  return (
                    <option key={c._id} value={c._id}>
                      {c.name} (Rs. {rate})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Batch Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Batch Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Batch Code / Number (Manual or Auto) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Batch Code / Number <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (isCustomBatchId) {
                    setIsCustomBatchId(false);
                  } else {
                    setIsCustomBatchId(true);
                  }
                }}
                className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-all ${
                  isCustomBatchId
                    ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800"
                    : "bg-blue-50 text-blue-600 border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800 hover:bg-blue-100"
                }`}
                title="Click to toggle between auto-generated courier prefix or manual custom batch code"
              >
                {isCustomBatchId ? "Custom (Click for Auto)" : "Auto-Generated (Courier Prefix)"}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. GE-20261106-001, SE-20261106-001"
                value={batchId}
                onChange={(e) => {
                  setIsCustomBatchId(true);
                  setBatchId(e.target.value);
                }}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition-all"
              />
            </div>
          </div>

          {/* Batch Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Batch Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Afternoon dispatch, Cotton hoodies"
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Row Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Add Rows:
          </span>
          <button
            onClick={() => addRows(1)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
          >
            +1 Row
          </button>
          <button
            onClick={() => addRows(10)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
          >
            +10 Rows
          </button>
          <button
            onClick={() => addRows(50)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
          >
            +50 Rows
          </button>
          <button
            onClick={() => addRows(100)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
          >
            +100 Rows
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Total Rows in Table: <span className="font-bold text-slate-900 dark:text-white">{rows.length}</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Filled: <span className="font-bold text-blue-600 dark:text-blue-400">{validRows.length}</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-800/90 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 w-12 font-bold text-slate-600 dark:text-slate-300 text-center">
                  S.N.
                </th>
                <th className="py-2.5 px-3 min-w-[170px] font-bold text-slate-600 dark:text-slate-300">
                  CUSTOMER NAME <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[140px] font-bold text-slate-600 dark:text-slate-300">
                  MOBILE NUMBER <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[180px] font-bold text-slate-600 dark:text-slate-300">
                  ADDRESS
                </th>
                <th className="py-2.5 px-3 min-w-[125px] font-bold text-slate-600 dark:text-slate-300">
                  SKU / ITEM
                </th>
                <th className="py-2.5 px-3 min-w-[125px] font-bold text-slate-600 dark:text-slate-300">
                  COD AMOUNT (RS.) <span className="text-rose-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[110px] font-bold text-slate-600 dark:text-slate-300">
                  ADVANCE (RS.)
                </th>
                <th className="py-2.5 px-3 min-w-[95px] font-bold text-slate-600 dark:text-slate-300">
                  CHARGE (RS.)
                </th>
                <th className="py-2.5 px-3 min-w-[140px] font-bold text-slate-600 dark:text-slate-300">
                  REMARKS
                </th>
                <th className="py-2.5 px-2 w-10 font-bold text-slate-600 dark:text-slate-300 text-center">
                  DEL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
              {rows.map((row, idx) => {
                const isDup = duplicatePhones.has(row.customerPhone.trim());
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* S.N. */}
                    <td className="py-1 px-3 text-center text-slate-400 font-mono select-none">
                      {idx + 1}
                    </td>

                    {/* Customer Name */}
                    <td className="py-1 px-2">
                      <input
                        id={`cell-${idx}-0`}
                        type="text"
                        placeholder="Customer name"
                        value={row.customerName}
                        onChange={(e) => updateRow(idx, "customerName", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 0)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                      />
                    </td>

                    {/* Mobile Number */}
                    <td className="py-1 px-2 relative">
                      {(() => {
                        const phoneVal = row.customerPhone.trim();
                        const isInvalidPhone = phoneVal.length > 0 && phoneVal.length !== 10;
                        return (
                          <>
                            <input
                              id={`cell-${idx}-1`}
                              type="text"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="98XXXXXXXX"
                              value={row.customerPhone}
                              onChange={(e) => updateRow(idx, "customerPhone", e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                              className={`w-full px-2 py-1.5 text-xs rounded-lg border font-mono transition-all focus:outline-none ${
                                isInvalidPhone
                                  ? "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200 ring-1 ring-rose-400 focus:border-rose-600 focus:ring-rose-500 pr-12 font-semibold"
                                  : isDup
                                  ? "border-amber-400 bg-amber-50/30 text-amber-900 dark:text-amber-200 pr-14"
                                  : "border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                              }`}
                            />
                            {isInvalidPhone && (
                              <span
                                title={`Mobile number must be exactly 10 digits (${phoneVal.length}/10)`}
                                className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 flex items-center select-none pointer-events-none"
                              >
                                {phoneVal.length}/10
                              </span>
                            )}
                            {!isInvalidPhone && isDup && (
                              <span
                                title="Same mobile used for multiple parcels (Allowed)"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-1 cursor-help shadow-xs"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                MULTI
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </td>

                    {/* Address (Next to Mobile Number) */}
                    <td className="py-1 px-2">
                      <input
                        id={`cell-${idx}-2`}
                        type="text"
                        placeholder="Street, Landmark, City"
                        value={row.customerAddress}
                        onChange={(e) => updateRow(idx, "customerAddress", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                      />
                    </td>

                    {/* SKU / Item (After Address) */}
                    <td className="py-1 px-2">
                      <input
                        id={`cell-${idx}-3`}
                        type="text"
                        placeholder="Item SKU"
                        value={row.itemSku}
                        onChange={(e) => updateRow(idx, "itemSku", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 3)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                      />
                    </td>

                    {/* COD Amount (After SKU) */}
                    <td className="py-1 px-2">
                      <input
                        id={`cell-${idx}-4`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.codAmount}
                        onChange={(e) => updateRow(idx, "codAmount", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 4)}
                        className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none text-right transition-all font-mono"
                      />
                    </td>

                    {/* Advance Payment (After COD) */}
                    <td className="py-1 px-2">
                      <input
                        id={`cell-${idx}-5`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.advancePayment}
                        onChange={(e) => updateRow(idx, "advancePayment", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 5)}
                        className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg border border-transparent hover:border-slate-200 focus:border-emerald-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-emerald-600 dark:text-emerald-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none text-right transition-all font-mono"
                      />
                    </td>

                    {/* Charge (Rs.) */}
                    <td className="py-1 px-2">
                      <input
                        id={`cell-${idx}-6`}
                        type="number"
                        min="0"
                        value={row.deliveryCharge}
                        onChange={(e) => updateRow(idx, "deliveryCharge", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 6)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none text-right transition-all font-mono"
                      />
                    </td>

                    {/* Remarks */}
                    <td className="py-1 px-2">
                      <input
                        id={`cell-${idx}-7`}
                        type="text"
                        placeholder="Special notes"
                        value={row.remarks}
                        onChange={(e) => updateRow(idx, "remarks", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 7)}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="py-1 px-2 text-center">
                      <button
                        onClick={() => deleteRow(idx)}
                        title="Delete Row"
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
      </div>

      {/* Sticky Bottom Calculation Bar (Matching Reference Screenshot 1) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:pl-64 bg-slate-900 text-white shadow-2xl border-t border-slate-800 px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* Entries count */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Entries:
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 font-mono font-bold text-white text-sm">
                {validRows.length}
              </span>
            </div>

            {/* Total COD */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Total COD:
              </span>
              <span className="font-bold text-blue-400 text-sm">
                Rs. {totalCod.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Total Advance */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Advance Paid:
              </span>
              <span className="font-bold text-amber-400 text-sm">
                Rs. {totalAdvance.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Total Value */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Total Order Value:
              </span>
              <span className="font-bold text-slate-200 text-sm">
                Rs. {totalOrderValue.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Estimated Delivery Charge */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Delivery Charge:
              </span>
              <span className="font-bold text-slate-300 text-sm">
                Rs. {totalDeliveryCharge.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Estimated Net */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                Net Receivable (COD - Charge):
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                Rs. {estimatedNet.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <button
            onClick={handleSaveBatch}
            disabled={saving || validRows.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Batch..." : `Save Batch (${validRows.length} Parcels)`}</span>
          </button>
        </div>
      </div>

      {/* Paste from Excel Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Paste Parcels from Excel / Sheets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copy cells from Excel or Google Sheets and paste below (Inside Valley only)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-800 dark:text-slate-100 block mb-1">
                  Supported Column Orders:
                </span>
                <p>1. Customer Name | Mobile | Address | SKU | COD Amount | Advance | Charge | Remarks</p>
                <p className="mt-0.5">2. S.N. | Customer Name | Mobile | Address | SKU | COD Amount | Advance | Charge | Remarks</p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400 italic text-[11px]">* Legacy order (Name, Mobile, COD, Advance, SKU, Charge, Address) is also supported automatically.</p>
              </div>

              <textarea
                rows={8}
                placeholder="Paste tab-separated rows here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePasteExcel(pasteText)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
              >
                Parse & Populate Rows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
