"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Calendar,
  AlertCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ParcelStatusBadge } from "@/components/ui/ParcelStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IParcel, ParcelStatus } from "@/types";

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [parcel, setParcel] = useState<IParcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const executeTrack = async (searchStr: string) => {
    if (!searchStr.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/parcels/track/${encodeURIComponent(searchStr.trim())}`);
      const data = await res.json();
      if (data.success && data.parcel) {
        setParcel(data.parcel);
      } else {
        setParcel(null);
        setErrorMessage(data.message || `No record found for "${searchStr}"`);
      }
    } catch {
      setParcel(null);
      setErrorMessage("Network error while tracking parcel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeTrack(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTrack(query);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 mb-1">
          <Truck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Multi-Courier Parcel Tracker
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Look up shipments instantly by Internal Order ID (e.g. APX-...) or Courier Tracking ID
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto pt-4 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Enter Order ID or Courier Tracking #..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={loading}
            className="h-11 px-6 font-bold shadow-md shadow-brand-600/20"
          >
            <span>Track</span>
          </Button>
        </form>
      </div>

      {/* Error state */}
      {searched && errorMessage && (
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
            Shipment Not Found
          </h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
            {errorMessage}
          </p>
        </Card>
      )}

      {/* Tracking Result */}
      {parcel && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Header Card */}
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 border-0 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block mb-1">
                  Tracking Summary
                </span>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight">
                    {parcel.orderId}
                  </h2>
                  <ParcelStatusBadge status={parcel.status} />
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Courier: <strong className="text-white">{parcel.courierName}</strong>
                  {parcel.externalTrackingId && (
                    <span> &bull; Partner Ref: {parcel.externalTrackingId}</span>
                  )}
                </p>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-700 text-xs">
                <span className="text-slate-400 block">Collectible COD</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatCurrency(parcel.codAmount)}
                </span>
                {Boolean(parcel.advancePayment) && (
                  <span className="text-amber-400 block text-[11px] mt-0.5">
                    Advance Paid: {formatCurrency(parcel.advancePayment || 0)}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Shipment Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Recipient Customer
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">
                {parcel.customerName}
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {parcel.customerPhone}
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Booking Date
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">
                {formatDate(parcel.bookingDate)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Status: {parcel.status}
              </p>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Package SKU & Quantity
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1 font-mono">
                {parcel.itemSku}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantity: {parcel.quantity} unit(s)
              </p>
            </Card>
          </div>

          {/* Visual Tracking Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <CardTitle>Delivery Progression Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {parcel.trackingHistory && parcel.trackingHistory.length > 0 ? (
                  parcel.trackingHistory.map((item, idx) => {
                    const st = (item.status || item.newStatus || "With Courier") as ParcelStatus;
                    return (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-[30px] sm:-left-[38px] top-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] ${
                          st === "Delivered"
                            ? "bg-emerald-500 text-white"
                            : st === "Returned to Warehouse" || st === "Return Initiated" || st === "Returned"
                            ? "bg-rose-500 text-white"
                            : "bg-brand-600 text-white"
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-2">
                            <ParcelStatusBadge status={st} size="sm" />
                            {item.location && (
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {item.location}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            {formatDate(item.timestamp, true)}
                          </span>
                        </div>
                        {item.remarks && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {item.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                  <p className="text-xs text-slate-400">No milestones available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

