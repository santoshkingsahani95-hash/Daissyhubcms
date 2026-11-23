"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Plus,
  Trash2,
  ClipboardPaste,
  Save,
  Upload,
  Sparkles,
  Truck,
  Calendar,
  Hash,
  FileText,
  CheckCircle2,
  Eraser,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ICourierCompany, IOutsideValleyRate } from "@/types";
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
  const [outsideRates, setOutsideRates] = useState<IOutsideValleyRate[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected courier object
  const selectedCourier = useMemo(() => {
    return couriers.find((c) => c._id === selectedCourierId);
  }, [couriers, selectedCourierId]);

  const isOutsideValleyCourier = useMemo(() => {
    return Boolean(
      selectedCourier?.isOutsideValley ||
      selectedCourier?.serviceArea === "Outside Valley"
    );
  }, [selectedCourier]);

  // Load couriers
  useEffect(() => {
    fetch("/api/couriers?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.couriers?.length > 0) {
          setCouriers(data.couriers);
          const first = data.couriers[0];
          setSelectedCourierId(first._id);
          const initialRate = (first.defaultDeliveryCharge ?? first.defaultChargeInsideValley ?? 70).toString();
          setRows((prev) =>
            prev.map((row) => ({
              ...row,
              deliveryCharge: row.deliveryCharge && row.deliveryCharge !== "0" ? row.deliveryCharge : initialRate,
            }))
          );
        }
      })
      .catch(console.error);

    fetch("/api/outside-rates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.rates) {
          setOutsideRates(data.rates);
        }
      })
      .catch(console.error);
  }, []);

  // Auto-generate batch ID with courier initial prefix (e.g. GE, SE, KE, NCM) and date
  useEffect(() => {
    if (isCustomBatchId) return;
    const prefix = getCourierBatchPrefix(selectedCourier?.name || "Google Express");
    const datePart = (batchDate || new Date().toISOString().split("T")[0]).replace(/-/g, "");

    // Immediately set clean pattern (e.g. GE-20261120-001)
    setBatchId(`${prefix}-${datePart}-001`);

    if (selectedCourierId) {
      fetch(
        `/api/batches?action=next-id&courierId=${encodeURIComponent(selectedCourierId)}&courierName=${encodeURIComponent(selectedCourier?.name || "")}&date=${datePart}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.nextBatchId) {
            setBatchId(data.nextBatchId);
          }
        })
        .catch(() => {});
    }
  }, [selectedCourierId, selectedCourier, batchDate, isCustomBatchId]);

  // Initialize initial 10 blank rows
  useEffect(() => {
    if (rows.length === 0) {
      addRows(10);
    }
  }, []);

  // Delivery charge set from Courier Info Management
  const defaultCharge = useMemo(() => {
    if (!selectedCourier) return 70;
    return Number(
      selectedCourier.defaultDeliveryCharge ??
      selectedCourier.defaultChargeInsideValley ??
      70
    );
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

  const clearEmptyRows = () => {
    const filled = rows.filter((r) => r.customerName.trim() || r.customerPhone.trim());
    if (filled.length === 0) {
      // Keep 1 clean blank row
      setRows([
        {
          id: "row-" + Date.now(),
          customerName: "",
          customerPhone: "",
          codAmount: "0",
          advancePayment: "0",
          itemSku: "",
          deliveryCharge: defaultCharge.toString(),
          customerAddress: "",
          remarks: "",
        },
      ]);
      toast.success("Table reset to 1 blank row");
    } else {
      setRows(filled);
      toast.success(`Cleaned empty rows. ${filled.length} active row(s) remaining.`);
    }
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
      const isOutside = Boolean(
        selectedCourier?.isOutsideValley || selectedCourier?.serviceArea === "Outside Valley"
      );
      const serviceArea = isOutside ? "Outside Valley" : "Inside Valley";

      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierId: selectedCourierId,
          dispatchDate: batchDate,
          serviceArea: serviceArea,
          notes: batchNotes,
          batchId,
          parcels: parcelsToSave.map((p) => ({
            customerName: p.customerName.trim(),
            customerPhone: p.customerPhone.trim(),
            customerAddress: p.customerAddress.trim(),
            deliveryArea: serviceArea,
            codAmount: parseFloat(p.codAmount) || 0,
            advancePayment: parseFloat(p.advancePayment) || 0,
            itemSku: p.itemSku.trim(),
            deliveryCharge: isNaN(parseFloat(p.deliveryCharge)) ? defaultCharge : parseFloat(p.deliveryCharge),
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
    <div className="space-y-4 pb-36">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Bulk Parcel Entry
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                  Fast Paced
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fast spreadsheet entry &bull; Paste directly from Excel &bull; Auto customer lookup by 10-digit mobile
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition-all"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Paste from Excel</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import CSV</span>
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : `Save Batch (${validRows.length})`}</span>
            </button>
          </div>
        </div>

        {/* Batch Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* Courier Service */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Courier Partner</span>
                <span className="text-rose-500">*</span>
              </label>
              {isOutsideValleyCourier && (
                <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
                  OUTSIDE VALLEY
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedCourierId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedCourierId(id);
                  setIsCustomBatchId(false);
                  const c = couriers.find((item) => item._id === id);
                  const rate = String(c?.defaultDeliveryCharge ?? c?.defaultChargeInsideValley ?? 70);
                  setRows((prev) =>
                    prev.map((row) => ({
                      ...row,
                      deliveryCharge: rate,
                    }))
                  );
                }}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer"
              >
                {couriers.map((c) => {
                  const isOutside = Boolean(c.isOutsideValley || c.serviceArea === "Outside Valley");
                  const rate = c.defaultDeliveryCharge ?? c.defaultChargeInsideValley ?? 0;
                  return (
                    <option key={c._id} value={c._id}>
                      {c.name} {isOutside ? "[Outside Valley]" : ""} {rate > 0 ? `(Rs. ${rate})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Batch Date */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Batch Date</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Batch Code / Number (Manual or Auto) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                <span>Batch Code</span>
                <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomBatchId(!isCustomBatchId)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                  isCustomBatchId
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 hover:bg-blue-100"
                }`}
                title="Toggle Auto or Manual Custom Batch ID"
              >
                {isCustomBatchId ? "Custom" : "Auto Prefix"}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. GE-20261120-001"
                value={batchId}
                onChange={(e) => {
                  setIsCustomBatchId(true);
                  setBatchId(e.target.value);
                }}
                className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Batch Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Batch Notes (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Afternoon dispatch, Cotton hoodies"
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Row Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Add Rows:
          </span>
          <button
            onClick={() => addRows(1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>1 Row</span>
          </button>
          <button
            onClick={() => addRows(10)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>10 Rows</span>
          </button>
          <button
            onClick={() => addRows(50)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>50 Rows</span>
          </button>
          <button
            onClick={() => addRows(100)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>100 Rows</span>
          </button>

          <button
            onClick={clearEmptyRows}
            title="Remove unfilled empty rows"
            className="inline-flex items-center gap-1.5 ml-2 px-3 py-1.5 text-xs font-medium rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clean Empty</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            Total Rows: <span className="font-bold text-slate-900 dark:text-white">{rows.length}</span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
            Filled: <span className="font-bold">{validRows.length}</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/90 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 w-12 font-bold text-slate-500 dark:text-slate-400 text-center tracking-wider uppercase text-[11px]">
                  #
                </th>
                <th className="py-3 px-3 min-w-[180px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase text-[11px]">
                  Customer Name <span className="text-rose-500">*</span>
                </th>
                <th className="py-3 px-3 min-w-[150px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase text-[11px]">
                  Mobile Number <span className="text-rose-500">*</span>
                </th>
                <th className="py-3 px-3 min-w-[190px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase text-[11px]">
                  Address / City
                </th>
                <th className="py-3 px-3 min-w-[130px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase text-[11px]">
                  SKU / Item
                </th>
                <th className="py-3 px-3 min-w-[130px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase text-[11px] text-right">
                  COD Amount (Rs.) <span className="text-rose-500">*</span>
                </th>
                <th className="py-3 px-3 min-w-[120px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase text-[11px] text-right">
                  Advance (Rs.)
                </th>
                <th className="py-3 px-3 min-w-[110px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase text-[11px] text-right">
                  Charge (Rs.)
                </th>
                <th className="py-3 px-3 min-w-[150px] font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase text-[11px]">
                  Remarks
                </th>
                <th className="py-3 px-2 w-10 font-bold text-slate-400 text-center">
                  &bull;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
              {rows.map((row, idx) => {
                const isDup = duplicatePhones.has(row.customerPhone.trim());
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* S.N. */}
                    <td className="py-1.5 px-3 text-center text-slate-400 font-mono select-none text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Customer Name */}
                    <td className="py-1.5 px-2">
                      <input
                        id={`cell-${idx}-0`}
                        type="text"
                        placeholder="Customer name"
                        value={row.customerName}
                        onChange={(e) => updateRow(idx, "customerName", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 0)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                      />
                    </td>

                    {/* Mobile Number */}
                    <td className="py-1.5 px-2 relative">
                      {(() => {
                        const phoneVal = row.customerPhone.trim();
                        const isInvalidPhone = phoneVal.length > 0 && phoneVal.length !== 10;
                        return (
                          <div className="relative">
                            <input
                              id={`cell-${idx}-1`}
                              type="text"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="98XXXXXXXX"
                              value={row.customerPhone}
                              onChange={(e) => updateRow(idx, "customerPhone", e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                              className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-mono transition-all focus:outline-none ${
                                isInvalidPhone
                                  ? "border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200 ring-1 ring-rose-400 pr-12 font-semibold"
                                  : isDup
                                  ? "border-amber-400 bg-amber-50/40 text-amber-900 dark:text-amber-200 pr-14"
                                  : "border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                              }`}
                            />
                            {isInvalidPhone && (
                              <span
                                title={`Mobile number must be 10 digits (${phoneVal.length}/10)`}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 select-none pointer-events-none"
                              >
                                {phoneVal.length}/10
                              </span>
                            )}
                            {!isInvalidPhone && isDup && (
                              <span
                                title="Same mobile used for multiple parcels in this batch"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-1 cursor-help"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                MULTI
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Address / Destination City */}
                    <td className="py-1.5 px-2">
                      {isOutsideValleyCourier ? (
                        <div className="space-y-1">
                          <select
                            value={
                              outsideRates.find(
                                (r) =>
                                  row.customerAddress.toLowerCase().startsWith(r.placeName.toLowerCase()) ||
                                  row.customerAddress.toLowerCase() === r.placeName.toLowerCase()
                              )?.placeName || ""
                            }
                            onChange={(e) => {
                              const selectedPlace = e.target.value;
                              const matched = outsideRates.find((r) => r.placeName === selectedPlace);
                              if (matched) {
                                setRows((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = {
                                    ...copy[idx],
                                    customerAddress: matched.placeName,
                                    deliveryCharge: matched.deliveryCharge.toString(),
                                  };
                                  return copy;
                                });
                              }
                            }}
                            className="w-full px-2 py-1 text-[11px] font-bold rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                          >
                            <option value="">📍 Choose Destination Place...</option>
                            {outsideRates.map((r) => (
                              <option key={r.id} value={r.placeName}>
                                {r.placeName} (Rs. {r.deliveryCharge})
                              </option>
                            ))}
                          </select>
                          <input
                            id={`cell-${idx}-2`}
                            type="text"
                            placeholder="Street, Landmark / Tole"
                            value={row.customerAddress}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateRow(idx, "customerAddress", val);
                              const matched = outsideRates.find((r) =>
                                val.toLowerCase().includes(r.placeName.toLowerCase())
                              );
                              if (matched) {
                                updateRow(idx, "deliveryCharge", matched.deliveryCharge.toString());
                              }
                            }}
                            onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all"
                          />
                        </div>
                      ) : (
                        <input
                          id={`cell-${idx}-2`}
                          type="text"
                          placeholder="Street, Landmark, City"
                          value={row.customerAddress}
                          onChange={(e) => updateRow(idx, "customerAddress", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                        />
                      )}
                    </td>

                    {/* SKU / Item */}
                    <td className="py-1.5 px-2">
                      <input
                        id={`cell-${idx}-3`}
                        type="text"
                        placeholder="Item SKU"
                        value={row.itemSku}
                        onChange={(e) => updateRow(idx, "itemSku", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 3)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                      />
                    </td>

                    {/* COD Amount */}
                    <td className="py-1.5 px-2">
                      <input
                        id={`cell-${idx}-4`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.codAmount}
                        onChange={(e) => updateRow(idx, "codAmount", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 4)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none text-right transition-all font-mono"
                      />
                    </td>

                    {/* Advance Payment */}
                    <td className="py-1.5 px-2">
                      <input
                        id={`cell-${idx}-5`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.advancePayment}
                        onChange={(e) => updateRow(idx, "advancePayment", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 5)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-emerald-600 dark:text-emerald-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none text-right transition-all font-mono"
                      />
                    </td>

                    {/* Delivery Charge (Default 0, editable) */}
                    <td className="py-1.5 px-2">
                      <input
                        id={`cell-${idx}-6`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.deliveryCharge}
                        onChange={(e) => updateRow(idx, "deliveryCharge", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 6)}
                        className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300 focus:outline-none text-right transition-all font-mono"
                      />
                    </td>

                    {/* Remarks */}
                    <td className="py-1.5 px-2">
                      <input
                        id={`cell-${idx}-7`}
                        type="text"
                        placeholder="Special notes"
                        value={row.remarks}
                        onChange={(e) => updateRow(idx, "remarks", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 7)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="py-1.5 px-2 text-center">
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

      {/* Floating Modern Calculation & Action Dock (Above taskbar, clean, spaced) */}
      <div className="fixed bottom-3 left-4 right-4 lg:left-72 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl px-5 py-3 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Metrics chips */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Entries */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Entries</span>
              <span className="font-mono font-black text-sm">{validRows.length}</span>
            </div>

            {/* Total COD */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <span className="text-[10px] uppercase font-bold text-blue-500">COD</span>
              <span className="font-mono font-black text-sm">Rs. {totalCod.toLocaleString("en-IN")}</span>
            </div>

            {/* Advance */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <span className="text-[10px] uppercase font-bold text-amber-500">Advance</span>
              <span className="font-mono font-black text-sm">Rs. {totalAdvance.toLocaleString("en-IN")}</span>
            </div>

            {/* Delivery Charge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400">Charges</span>
              <span className="font-mono font-bold text-sm">Rs. {totalDeliveryCharge.toLocaleString("en-IN")}</span>
            </div>

            {/* Net Receivable */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Net Receivable</span>
              <span className="font-mono font-black text-sm">Rs. {estimatedNet.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveBatch}
              disabled={saving || validRows.length === 0}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Batch..." : `Save Batch (${validRows.length} Parcels)`}</span>
            </button>
          </div>
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
                    Paste Parcels from Excel / Google Sheets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copy rows from your spreadsheet and paste below
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
                <p className="mt-0.5 text-slate-500 dark:text-slate-400 italic text-[11px]">* Delivery Charge defaults to 0 if omitted.</p>
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
