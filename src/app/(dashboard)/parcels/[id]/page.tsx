"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Truck,
  MapPin,
  Calendar,
  User,
  Smartphone,
  Layers,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Receipt,
  RotateCcw,
  History,
  Pencil,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ParcelStatusBadge } from "@/components/ui/ParcelStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "react-hot-toast";
import { IParcel, ParcelStatus } from "@/types";

const ALL_STATUSES: ParcelStatus[] = [
  "With Courier",
  "Delivered",
  "Delivery Attempt Failed",
  "Return Initiated",
  "Returned to Warehouse",
  "Pending Verification",
];

export default function ParcelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [parcel, setParcel] = useState<IParcel | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update
  const [newStatus, setNewStatus] = useState<ParcelStatus>("Delivered");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);

  // Edit details mode
  const [isEditing, setIsEditing] = useState(false);
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
  const [savingDetails, setSavingDetails] = useState(false);

  const parcelId = params.id as string;

  useEffect(() => {
    if (!parcelId) return;
    fetchParcel();
  }, [parcelId]);

  const fetchParcel = () => {
    setLoading(true);
    fetch(`/api/parcels?search=${parcelId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.parcels?.length > 0) {
          const match = data.parcels.find(
            (p: IParcel) => p._id === parcelId || p.parcelId === parcelId
          ) || data.parcels[0];
          setParcel(match);
          setEditForm({
            customerName: match.customerName || "",
            customerPhone: match.customerPhone || "",
            codAmount: match.codAmount || 0,
            advancePayment: match.advancePayment || 0,
            deliveryCharge: match.deliveryCharge || 0,
            itemSku: match.itemSku || "",
            customerAddress: match.customerAddress || "",
            remarks: match.remarks || "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async (status: ParcelStatus) => {
    if (!parcel) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/parcels/${parcel.parcelId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success(`Parcel status updated to ${status}`);
      setParcel(data.parcel);
      setRemarks("");
    } catch (err: any) {
      toast.error(err.message || "Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcel) return;
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/parcels/${parcel.parcelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success(data.message || "Parcel details updated successfully!");
      setParcel(data.parcel);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Error saving parcel details");
    } finally {
      setSavingDetails(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading parcel details...</div>;
  }

  if (!parcel) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-slate-500">Parcel not found.</p>
        <Link href="/parcels">
          <Button size="sm">Back to Parcels</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/parcels">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Parcels</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
          <ParcelStatusBadge status={parcel.status} size="md" />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-mono text-blue-600 text-lg">#{parcel.parcelId}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Batch: <strong className="text-slate-800 dark:text-slate-200 font-mono">{parcel.batchId}</strong> • Dispatched: {parcel.dispatchDate} • Courier: {parcel.courierName}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Edit Form or Read-only Cards */}
          {isEditing ? (
            <form onSubmit={handleSaveDetails} className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-4 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs border-b border-amber-200 dark:border-amber-800/50 pb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Editing Parcel Entry: Update wrong amount, phone number, or delivery info</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
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

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
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

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Advance Paid (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.advancePayment}
                    onChange={(e) => setEditForm({ ...editForm, advancePayment: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 font-mono font-bold text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SKU / Item
                  </label>
                  <input
                    type="text"
                    value={editForm.itemSku}
                    onChange={(e) => setEditForm({ ...editForm, itemSku: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={editForm.customerAddress}
                  onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Special Instructions
                </label>
                <input
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-amber-200 dark:border-amber-800/40">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={savingDetails}
                  className="px-4 py-1.5 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 font-semibold text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${savingDetails ? "animate-spin" : ""}`} />
                  <span>{savingDetails ? "Saving..." : "Save Details"}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{parcel.customerName}</p>
                <p className="font-mono text-slate-500">{parcel.customerPhone}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Courier Partner</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{parcel.courierName}</p>
                <p className="text-slate-500 font-mono">Charge: Rs. {parcel.deliveryCharge}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Financials</span>
                <p className="font-bold text-base text-blue-600 mt-1">COD: Rs. {parcel.codAmount.toLocaleString("en-IN")}</p>
                <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold">Advance: Rs. {(parcel.advancePayment || 0).toLocaleString("en-IN")}</p>
                <p className="text-slate-500 text-[11px]">Total Value: Rs. {((parcel.codAmount || 0) + (parcel.advancePayment || 0)).toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}

          {!isEditing && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Address</span>
              <p className="text-slate-800 dark:text-slate-200 mt-1">{parcel.customerAddress || "No address specified"}</p>
              {parcel.itemSku && (
                <p className="text-slate-500 text-[11px] mt-1">
                  SKU: <strong className="font-mono">{parcel.itemSku}</strong>
                </p>
              )}
            </div>
          )}

          {/* Status Change Audit Trail */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              <span>Status Audit Trail</span>
            </h4>
            <div className="space-y-3 pl-4 border-l-2 border-blue-500 text-xs">
              {parcel.statusHistory?.map((h, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <strong className="text-slate-900 dark:text-white">{h.newStatus}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    By: {h.updatedBy} {h.reason && `• Reason: ${h.reason}`} {h.remarks && `(${h.remarks})`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
