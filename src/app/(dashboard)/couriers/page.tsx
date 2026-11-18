"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  User,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Receipt,
  BookOpen,
  DollarSign,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ICourierCompany } from "@/types";

export default function CourierManagementPage() {
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState<ICourierCompany | null>(null);

  // Delete modal state
  const [deletingCourier, setDeletingCourier] = useState<ICourierCompany | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    defaultDeliveryCharge: "70",
    openingBalance: "0",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = () => {
    setLoading(true);
    fetch("/api/couriers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.couriers) {
          setCouriers(data.couriers);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleOpenAdd = () => {
    setEditingCourier(null);
    setFormData({
      name: "",
      code: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      defaultDeliveryCharge: "70",
      openingBalance: "0",
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: ICourierCompany) => {
    setEditingCourier(c);
    const charge = c.defaultDeliveryCharge || c.defaultChargeInsideValley || 70;

    setFormData({
      name: c.name,
      code: c.code || "",
      contactPerson: c.contactPerson || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      defaultDeliveryCharge: charge.toString(),
      openingBalance: (c.openingBalance || 0).toString(),
      isActive: c.isActive,
    });
    setShowAddModal(true);
  };

  const handleToggleStatus = async (c: ICourierCompany) => {
    try {
      const res = await fetch(`/api/couriers/${c._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success(`Courier ${c.name} ${!c.isActive ? "activated" : "deactivated"}`);
      fetchCouriers();
    } catch (err: any) {
      toast.error(err.message || "Error updating courier status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourier) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/couriers/${deletingCourier._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      toast.success(`Courier "${deletingCourier.name}" deleted successfully`);
      setDeletingCourier(null);
      fetchCouriers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete courier");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Courier name is required");
      return;
    }

    setSaving(true);
    try {
      const url = editingCourier ? `/api/couriers/${editingCourier._id}` : "/api/couriers";
      const method = editingCourier ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      toast.success(editingCourier ? "Courier updated successfully" : "Courier created successfully");
      setShowAddModal(false);
      fetchCouriers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save courier");
    } finally {
      setSaving(false);
    }
  };

  const filteredCouriers = couriers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Courier Info Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure partner couriers, representative contacts, standard delivery rates, and independent financial ledgers
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Courier Partner</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search couriers by name, representative, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Courier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">Loading couriers...</div>
        ) : filteredCouriers.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400">No couriers found.</div>
        ) : (
          filteredCouriers.map((c) => {
            const charge = c.defaultDeliveryCharge || c.defaultChargeInsideValley || 70;

            return (
              <div
                key={c._id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                  c.isActive
                    ? "border-slate-200/80 dark:border-slate-800"
                    : "border-slate-200/40 dark:border-slate-800/40 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center">
                      {c.code || c.name.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {c.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            c.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{c.contactPerson || "No contact person"}</span>
                        {c.phone && <span>• {c.phone}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(c)}
                      title={c.isActive ? "Deactivate" : "Activate"}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {c.isActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      title="Edit Courier"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingCourier(c)}
                      title="Delete Courier"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Delivery Rate & Dispatched Strip */}
                <div className="grid grid-cols-2 gap-3 my-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Standard Delivery Charge
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base block mt-0.5">
                      Rs. {charge}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Total Dispatched
                    </span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base block mt-0.5 font-mono">
                      {c.totalParcelsDispatched || 0} Parcels
                    </span>
                  </div>
                </div>

                {/* Outstanding Balance & Financial Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Outstanding Due
                    </span>
                    <span
                      className={`text-base font-bold font-mono ${
                        (c.currentBalance || 0) > 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      Rs. {(c.currentBalance || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/ledger?courierId=${c._id}`}>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ledger</span>
                      </button>
                    </Link>

                    <Link href={`/settlements?courierId=${c._id}`}>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Settlement</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCourier && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Delete Courier Partner?
                </h3>
                <p className="text-xs text-slate-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete courier partner{" "}
              <strong className="text-slate-900 dark:text-white font-bold">
                "{deletingCourier.name}"
              </strong>
              ?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingCourier(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
              >
                {deleting ? "Deleting..." : "Yes, Delete Courier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Courier Modal (Matches requested design with NO RETURN CHARGES) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {editingCourier ? "Edit Courier Company" : "Add New Courier Partner"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure service area, default delivery rate, and contact details
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Courier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Express"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Courier Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GEX"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Representative Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Sharma"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Representative Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9801122334"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@googleexpress.np"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Office Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Baneshwor, Kathmandu"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Delivery Pricing Policy Section - NO RETURN CHARGES */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                    Delivery Pricing Policy (NPR)
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    Returns are 100% Free (Rs. 0)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Delivery Charge (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 70"
                    value={formData.defaultDeliveryCharge}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultDeliveryCharge: e.target.value })
                    }
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {!editingCourier && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Initial Opening Balance (Rs.) - positive if courier already owes us
                    </label>
                    <input
                      type="number"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                      className="w-full max-w-xs text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  {saving ? "Saving..." : editingCourier ? "Update Courier" : "Save Courier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
