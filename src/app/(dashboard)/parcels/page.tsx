"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Filter,
  Download,
  PlusCircle,
  FileSpreadsheet,
  Eye,
  Truck,
  RotateCw,
  Building2,
  Calendar,
  X,
  History,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ParcelStatusBadge } from "@/components/ui/ParcelStatusBadge";
import { toast } from "react-hot-toast";
import { IParcel, ICourierCompany, ParcelStatus } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";

const ALL_STATUSES: ParcelStatus[] = [
  "With Courier",
  "Delivered",
  "Delivery Attempt Failed",
  "Return Initiated",
  "Returned to Warehouse",
  "Pending Verification",
];

export default function ParcelsListPage() {
  const [parcels, setParcels] = useState<IParcel[]>([]);
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Inspect Modal
  const [inspectParcel, setInspectParcel] = useState<IParcel | null>(null);

  // Edit Parcel Modal State
  const [editParcel, setEditParcel] = useState<IParcel | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerPhone: "",
    codAmount: 0,
    advancePayment: 0,
    deliveryCharge: 0,
    itemSku: "",
    customerAddress: "",
    remarks: "",
  });
  const [savingParcel, setSavingParcel] = useState(false);

  const handleOpenEdit = (p: IParcel) => {
    setEditParcel(p);
    setEditForm({
      customerName: p.customerName || "",
      customerPhone: p.customerPhone || "",
      codAmount: p.codAmount || 0,
      advancePayment: p.advancePayment || 0,
      deliveryCharge: p.deliveryCharge || 0,
      itemSku: p.itemSku || "",
      customerAddress: p.customerAddress || "",
      remarks: p.remarks || "",
    });
  };

  const handleSaveParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParcel) return;
    setSavingParcel(true);
    try {
      const res = await fetch(`/api/parcels/${editParcel.parcelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success(data.message || "Parcel updated successfully!");
      setEditParcel(null);
      fetchParcels();
    } catch (err: any) {
      toast.error(err.message || "Failed to update parcel");
    } finally {
      setSavingParcel(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
    fetchParcels();
  }, []);

  const fetchCouriers = () => {
    fetch("/api/couriers?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.couriers) setCouriers(data.couriers);
      });
  };

  const fetchParcels = (overrideSearch?: string) => {
    setLoading(true);
    let url = "/api/parcels?limit=1000";
    if (selectedCourier) url += `&courierId=${selectedCourier}`;
    if (selectedStatus) url += `&status=${selectedStatus}`;
    if (selectedBatch) url += `&batchId=${selectedBatch}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const s = overrideSearch !== undefined ? overrideSearch : search;
    if (s) url += `&search=${encodeURIComponent(s)}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.parcels) {
          setParcels(data.parcels);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchParcels();
  }, [selectedCourier, selectedStatus, selectedBatch, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParcels();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Parcel Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, inspect, and track lifecycle status of individual parcels
          </p>
        </div>

        <Link href="/parcels/new">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all shrink-0">
            <PlusCircle className="w-4 h-4" />
            <span>Bulk Parcel Entry</span>
          </button>
        </Link>
      </div>

      {/* Filter Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Parcel ID, Customer, Phone, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
            className="font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Couriers</option>
            {couriers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <DateQuickFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          {(search || selectedCourier || selectedStatus || selectedBatch || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCourier("");
                setSelectedStatus("");
                setSelectedBatch("");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Parcels Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Parcel Records ({parcels.length})
          </span>
          <span className="text-slate-400">
            Showing all matching parcels
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">PARCEL ID</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">BATCH ID</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">COURIER</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">CUSTOMER</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">MOBILE (UNIQUE ID)</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">COD AMOUNT</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">CHARGE</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">STATUS</th>
                <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading parcels...</td>
                </tr>
              ) : parcels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">No parcels found.</td>
                </tr>
              ) : (
                parcels.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {p.parcelId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.batchId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {p.courierName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.customerName}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          setSearch(p.customerPhone);
                          fetchParcels(p.customerPhone);
                        }}
                        title="Click to search all parcels for this mobile number"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline font-semibold text-left inline-flex items-center gap-1"
                      >
                        <span>{p.customerPhone}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                      Rs. {p.codAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      Rs. {p.deliveryCharge}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ParcelStatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition-colors"
                        title="Edit parcel COD amount or customer details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setInspectParcel(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parcel Status History & Details Modal */}
      {inspectParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base font-mono">
                    {inspectParcel.parcelId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batch: {inspectParcel.batchId} • Courier: {inspectParcel.courierName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectParcel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectParcel.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                <span className="font-mono">{inspectParcel.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">COD Amount</span>
                <span className="font-bold text-blue-600">Rs. {inspectParcel.codAmount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Charge</span>
                <span className="font-mono">Rs. {inspectParcel.deliveryCharge}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Advance Paid</span>
                <span className="font-bold text-amber-600">Rs. {(inspectParcel.advancePayment || 0).toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Settled?</span>
                <span className={inspectParcel.isSettled ? "text-emerald-600 font-bold" : "text-slate-500"}>
                  {inspectParcel.isSettled ? `Yes (${inspectParcel.settlementNumber})` : "Not Settled"}
                </span>
              </div>
            </div>

            {/* Status History Audit Trail Timeline (Required by Prompt) */}
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <History className="w-4 h-4 text-blue-600" />
                <span>Status Change Audit Trail</span>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 pl-6">
                {inspectParcel.statusHistory && inspectParcel.statusHistory.length > 0 ? (
                  inspectParcel.statusHistory.map((h, i) => (
                    <div key={i} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {h.newStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Updated by: <strong>{h.updatedBy}</strong>
                        {h.reason && <span className="text-rose-600 ml-1">• Reason: {h.reason}</span>}
                        {h.remarks && <span className="text-slate-600 dark:text-slate-300 ml-1">({h.remarks})</span>}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No status transitions recorded.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInspectParcel(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parcel Modal */}
      {editParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>Edit Parcel Entry</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      #{editParcel.parcelId}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batch: {editParcel.batchId} • Courier: {editParcel.courierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditParcel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParcel} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-1.5 font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    COD Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.codAmount}
                    onChange={(e) => setEditForm({ ...editForm, codAmount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 font-mono font-bold text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Delivery Charge (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.deliveryCharge}
                    onChange={(e) => setEditForm({ ...editForm, deliveryCharge: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 font-mono text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    SKU / Item
                  </label>
                  <input
                    type="text"
                    value={editForm.itemSku}
                    onChange={(e) => setEditForm({ ...editForm, itemSku: e.target.value })}
                    placeholder="e.g. Cotton Hoodie"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Advance Payment (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.advancePayment}
                    onChange={(e) => setEditForm({ ...editForm, advancePayment: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-1.5 font-mono text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={editForm.customerAddress}
                  onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
                  placeholder="e.g. New Baneshwor, Kathmandu"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Remarks / Special Instructions
                </label>
                <input
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="e.g. Call before delivery"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditParcel(null)}
                  disabled={savingParcel}
                  className="px-4 py-2 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingParcel}
                  className="inline-flex items-center gap-1.5 px-5 py-2 font-semibold text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${savingParcel ? "animate-spin" : ""}`} />
                  <span>{savingParcel ? "Saving..." : "Save Parcel"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
