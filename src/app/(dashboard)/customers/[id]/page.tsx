"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  User,
  ArrowLeft,
  Package,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Coins,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ParcelStatusBadge } from "@/components/ui/ParcelStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { ICustomer, IParcel, ICourierCompany } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";

export default function CustomerProfilePage() {
  const params = useParams();
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [orders, setOrders] = useState<IParcel[]>([]);
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for order history
  const [courierFilter, setCourierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetch("/api/couriers")
      .then((res) => res.json())
      .then((d) => d.success && setCouriers(d.couriers));
  }, []);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (courierFilter) q.set("courierId", courierFilter);
      if (statusFilter) q.set("status", statusFilter);
      if (startDate) q.set("startDate", startDate);
      if (endDate) q.set("endDate", endDate);

      const res = await fetch(`/api/customers/${params.id}?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCustomer(data.customer);
          setOrders(data.orderHistory);
        }
      }
    } catch {
      toast.error("Error loading customer history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [params.id, courierFilter, statusFilter, startDate, endDate]);

  if (loading || !customer) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/customers">
          <Button size="sm" variant="outline" className="h-9 w-9 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Profile & Order History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registered customer mobile: {customer.phone}
          </p>
        </div>
      </div>

      {/* Customer Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 border-r border-slate-100 dark:border-slate-800 pr-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center font-bold text-xl mb-3">
                {customer.name[0]?.toUpperCase()}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {customer.name}
              </h2>
              <p className="text-xs font-mono font-semibold text-brand-600 mt-0.5">
                {customer.phone}
              </p>
              <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{customer.address}</span>
              </p>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Total Orders
                </span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {customer.totalOrders}
                </p>
                <span className="text-[10px] text-slate-400">Lifetime volume</span>
              </div>

              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase">
                  Delivered
                </span>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {customer.deliveredOrders}
                </p>
                <span className="text-[10px] text-emerald-600/80">Completed shipments</span>
              </div>

              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800">
                <span className="text-[11px] font-semibold text-amber-600 uppercase">
                  Pending / Transit
                </span>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {customer.pendingOrders}
                </p>
                <span className="text-[10px] text-amber-600/80">Active in network</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Total COD Value
                </span>
                <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1 truncate">
                  {formatCurrency(customer.totalCodAmount)}
                </p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                  Advance: Rs. {(customer.totalAdvancePaid || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Order History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <CardTitle>Customer Order History ({orders.length})</CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="">All Couriers</option>
              {couriers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
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
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-4">Booking Date</th>
                <th className="py-2.5 px-4">Item SKU</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">COD Amount</th>
                <th className="py-2.5 px-4">Courier Partner</th>
                <th className="py-2.5 px-4 text-right">Advance Paid</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Tracking #</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length > 0 ? (
                orders.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-600">
                      <Link href={`/parcels/${p._id}`} className="hover:underline">
                        {p.orderId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(p.bookingDate)}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium">{p.itemSku}</td>
                    <td className="py-2.5 px-4 text-center font-bold">{p.quantity}</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(p.codAmount)}
                    </td>
                    <td className="py-2.5 px-4">{p.courierName}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      {p.advancePayment ? `Rs. ${p.advancePayment.toLocaleString("en-IN")}` : "Rs. 0"}
                    </td>
                    <td className="py-2.5 px-4">
                      <ParcelStatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 font-mono text-purple-600">
                      {p.externalTrackingId || "-"}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link href={`/parcels/${p._id}`}>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No orders recorded for this customer matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

