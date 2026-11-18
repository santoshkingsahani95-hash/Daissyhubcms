"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Truck,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Landmark,
  PlusCircle,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ParcelStatusBadge } from "@/components/ui/ParcelStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { ICourierCompany, IParcel, ISettlement } from "@/types";

export default function CourierDetailPage() {
  const params = useParams();
  const { hasPermission } = useAuth();
  const [courier, setCourier] = useState<ICourierCompany | null>(null);
  const [ledger, setLedger] = useState<Record<string, unknown> | null>(null);
  const [recentParcels, setRecentParcels] = useState<IParcel[]>([]);
  const [recentSettlements, setRecentSettlements] = useState<ISettlement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourierDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/couriers/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCourier(data.courier);
          setLedger(data.ledger);
          setRecentParcels(data.recentParcels);
          setRecentSettlements(data.recentSettlements);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourierDetails();
  }, [params.id]);

  if (loading || !courier) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/couriers">
            <Button size="sm" variant="outline" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {courier.name}
              </h1>
              <Badge variant={courier.isActive ? "success" : "default"}>
                {courier.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Logistics Partner Ledger & Settlement Accounting
            </p>
          </div>
        </div>

        {hasPermission("settlements:manage") && (
          <Link href={`/settlements?courierId=${courier._id}&openModal=true`}>
            <Button size="sm" variant="primary" className="h-9">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Record Settlement</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Courier Profile & Accounting Rules */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 pr-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Contact Information
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {courier.contactPerson || "No contact person specified"}
              </p>
              {courier.phone && (
                <p className="text-slate-600 dark:text-slate-300 font-mono">
                  {courier.phone}
                </p>
              )}
              {courier.email && (
                <p className="text-slate-500">{courier.email}</p>
              )}
              {courier.address && (
                <p className="text-slate-500">{courier.address}</p>
              )}
            </div>

            <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 pr-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Settlement Configuration
              </span>
              <p className="font-bold text-brand-600">
                {courier.settlementType === "deduct_from_cod"
                  ? "Scenario A: Deduct Charges from COD Remittance"
                  : "Scenario B: Separate COD & Delivery Fee Accounting"}
              </p>
              <p className="text-slate-500">
                Inside Valley Rate: Rs. {courier.defaultChargeInsideValley}
              </p>
              <p className="text-slate-500">
                Outside Valley Rate: Rs. {courier.defaultChargeOutsideValley}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                API Integration Status
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="default" size="sm">
                  {courier.apiIntegrationStatus === "none"
                    ? "Manual Workflow (Adapter Ready)"
                    : courier.apiIntegrationStatus}
                </Badge>
              </div>
              <p className="text-slate-500 text-[11px]">
                API adapter interface configured for automated webhook & tracking sync.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Independent Financial Ledger */}
      {ledger && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-brand-600">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Total Delivered COD
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(Number(ledger.totalDeliveredCod))}
            </p>
            <span className="text-[10px] text-slate-400">
              {String(ledger.totalDeliveredParcels)} Delivered Parcels
            </span>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-600">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">
              Total Courier Charges
            </span>
            <p className="text-xl font-extrabold text-purple-600 mt-1">
              {formatCurrency(Number(ledger.totalCourierCharges))}
            </p>
            <span className="text-[10px] text-slate-400">Delivery service fees</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-600">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase">
              Total COD Remitted
            </span>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(Number(ledger.totalCodReceived))}
            </p>
            <span className="text-[10px] text-slate-400">Paid into company account</span>
          </Card>

          <Card
            className={`p-4 border-l-4 ${
              Number(ledger.receivable) > 0
                ? "border-l-emerald-600 bg-emerald-50/20"
                : "border-l-amber-600 bg-amber-50/20"
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              {Number(ledger.receivable) > 0 ? "Net Receivable (Courier Owes)" : "Net Payable"}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {formatCurrency(
                Number(ledger.receivable) > 0
                  ? Number(ledger.receivable)
                  : Number(ledger.payable)
              )}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600">
              {Number(ledger.receivable) > 0 ? "Outstanding balance due" : "Settled"}
            </span>
          </Card>
        </div>
      )}

      {/* Recent Parcels & Recent Settlements Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Parcels for this courier */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Parcels ({recentParcels.length})</CardTitle>
            <Link href={`/parcels?courierId=${courier._id}`}>
              <Button size="sm" variant="ghost">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">COD</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentParcels.length > 0 ? (
                  recentParcels.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand-600">
                        <Link href={`/parcels`}>{p.parcelId || p.orderId}</Link>
                      </td>
                      <td className="py-2.5 px-3 font-medium">{p.customerName}</td>
                      <td className="py-2.5 px-3 font-bold">{formatCurrency(p.codAmount)}</td>
                      <td className="py-2.5 px-3">
                        <ParcelStatusBadge status={p.status} size="sm" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No parcels booked under this courier.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Settlements */}
        <Card>
          <CardHeader>
            <CardTitle>Settlement History ({recentSettlements.length})</CardTitle>
            <Link href={`/settlements?courierId=${courier._id}`}>
              <Button size="sm" variant="ghost">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Statement #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Total Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentSettlements.length > 0 ? (
                  recentSettlements.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold">{s.settlementNumber || s.settlementId}</td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(s.settlementDate || s.transactionDate)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-emerald-600">
                        {s.status || s.transactionType || "Finalized"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold">
                        {formatCurrency(s.totalReceivable ?? s.amount ?? 0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No settlements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

