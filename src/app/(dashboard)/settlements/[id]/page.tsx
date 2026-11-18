"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Building2,
  Boxes,
  RotateCcw,
  Search,
  Receipt,
  User,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  Banknote,
} from "lucide-react";
import { ISettlement, ICourierCompany, ICompanySettings, IParcel } from "@/types";

interface ReturnParcelWithMeta extends IParcel {
  returnReason?: string;
  returnDate?: string;
  returnProcessedBy?: string;
}

interface BatchBreakdownItem {
  batchId: string;
  deliveredCount: number;
  returnedCount: number;
  deliveredCod: number;
  totalAdvance: number;
  deliveryCharge: number;
}

export default function SettlementInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const settlementId = decodeURIComponent(rawId || "");

  const [settlement, setSettlement] = useState<ISettlement | null>(null);
  const [courier, setCourier] = useState<ICourierCompany | null>(null);
  const [settings, setSettings] = useState<ICompanySettings | null>(null);
  const [deliveredParcels, setDeliveredParcels] = useState<IParcel[]>([]);
  const [returnedParcels, setReturnedParcels] = useState<ReturnParcelWithMeta[]>([]);
  const [batchBreakdown, setBatchBreakdown] = useState<BatchBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<"invoice" | "delivered" | "returned" | "batches">("invoice");
  const [deliveredSearch, setDeliveredSearch] = useState("");
  const [returnedSearch, setReturnedSearch] = useState("");

  useEffect(() => {
    if (!settlementId) return;
    setLoading(true);
    fetch(`/api/settlements/${encodeURIComponent(settlementId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settlement) {
          setSettlement(data.settlement);
          setCourier(data.courier);
          setSettings(data.settings);
          setDeliveredParcels(data.deliveredParcels || []);
          setReturnedParcels(data.returnedParcels || []);
          setBatchBreakdown(data.batchBreakdown || []);
        } else {
          // If not found by specific id, try fetching latest settlement
          fetch("/api/settlements?limit=1")
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.settlements && d.settlements.length > 0) {
                setSettlement(d.settlements[0]);
              }
            })
            .catch(console.error);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Also fetch fresh company settings to ensure real-time update
    fetch("/api/settings")
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.settings) {
          setSettings(d.settings);
        }
      })
      .catch(console.error);
  }, [settlementId]);

  // Listen to beforeprint / afterprint to guarantee blank document title during printing
  useEffect(() => {
    const handleBeforePrint = () => {
      document.title = "";
    };
    const handleAfterPrint = () => {
      document.title = "DaisyHub | Courier Management & COD Settlement System";
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    setActiveTab("invoice");
    const prevTitle = document.title;
    document.title = "";
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
      }, 1000);
    }, 150);
  };

  // Filtered delivered parcels
  const filteredDelivered = useMemo(() => {
    if (!deliveredSearch.trim()) return deliveredParcels;
    const q = deliveredSearch.toLowerCase();
    return deliveredParcels.filter(
      (p) =>
        p.parcelId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.includes(q) ||
        (p.batchId && p.batchId.toLowerCase().includes(q)) ||
        (p.itemSku && p.itemSku.toLowerCase().includes(q)) ||
        (p.customerAddress && p.customerAddress.toLowerCase().includes(q))
    );
  }, [deliveredParcels, deliveredSearch]);

  // Filtered returned parcels
  const filteredReturned = useMemo(() => {
    if (!returnedSearch.trim()) return returnedParcels;
    const q = returnedSearch.toLowerCase();
    return returnedParcels.filter(
      (p) =>
        p.parcelId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.includes(q) ||
        (p.batchId && p.batchId.toLowerCase().includes(q)) ||
        (p.itemSku && p.itemSku.toLowerCase().includes(q)) ||
        (p.returnReason && p.returnReason.toLowerCase().includes(q))
    );
  }, [returnedParcels, returnedSearch]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading settlement details, customer deliveries, and returns manifest...
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Settlement Statement Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested settlement statement does not exist or may have been deleted.
        </p>
        <Link
          href="/settlements"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          Back to Settlements
        </Link>
      </div>
    );
  }

  const activeSettlement: ISettlement = settlement;

  const company = settings || {
    companyName: "DaisyHub E-Commerce Pvt. Ltd.",
    panVatNumber: "609876543",
    corporateAddress: "New Baneshwor, Kathmandu, Nepal",
    phones: "+977-1-4789012 / 9801122334",
    email: "accounts@garmentsnepal.com",
    signatoryNameTitle: "Santosh Mukhiya (Finance Manager)",
    billFooterNotice:
      "This is a computer-generated courier settlement statement. For any queries, contact accounts department within 7 business days.",
    currency: "NPR",
    currencySymbol: "Rs.",
    dateFormat: "YYYY-MM-DD",
    defaultChargeInsideValley: 70,
    defaultChargeOutsideValley: 150,
    defaultReturnChargeInsideValley: 0,
    defaultReturnChargeOutsideValley: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar (Hidden during Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/settlements">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </Link>

          {/* Module View Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("invoice")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "invoice"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Official Invoice (A4)</span>
            </button>

            <button
              onClick={() => setActiveTab("delivered")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "delivered"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Customer Delivered ({deliveredParcels.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("returned")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "returned"
                  ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return Details ({returnedParcels.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("batches")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "batches"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Batch Breakdown ({batchBreakdown.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSettlement.remainingDue > 0 && (
            <Link href="/payments">
              <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all">
                <Banknote className="w-4 h-4" />
                <span>Pay Due (Rs. {activeSettlement.remainingDue.toLocaleString("en-IN")})</span>
              </button>
            </Link>
          )}

          <Link href="/settings">
            <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Billing Settings</span>
            </button>
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice (A4)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: OFFICIAL A4 INVOICE (PIXEL PERFECT FOR DISPLAY & PRINT) */}
      <div className={`${activeTab === "invoice" ? "block" : "hidden print:block"}`}>
        <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none print:m-0 space-y-6">
          {/* Document Header */}
          <div className="flex justify-between items-start pt-1">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {company.companyName}
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {company.corporateAddress}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                Phone: {company.phones} • Email: {company.email}
              </p>
              <p className="text-xs font-bold text-slate-800 mt-1">
                PAN / VAT Reg:  <span className="font-mono">{company.panVatNumber}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-sm font-extrabold tracking-wider text-blue-700 block uppercase">
                COURIER SETTLEMENT
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                {activeSettlement.settlementNumber}
              </span>
              <span className="text-xs text-slate-600 block mt-0.5">
                Settlement Date: <strong className="text-slate-900 font-mono">{activeSettlement.settlementDate}</strong>
              </span>
            </div>
          </div>

          {/* Horizontal Divider Line */}
          <hr className="border-t border-slate-300 my-2" />

          {/* Bill To / Courier Partner Box */}
          <div className="p-4 rounded-xl border border-slate-300 bg-white">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              BILL TO / COURIER PARTNER
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Courier Name:</span>
                <strong className="text-base font-bold text-slate-900 block mt-0.5">
                  {activeSettlement.courierName}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Contact Person & Mobile:</span>
                <strong className="text-slate-900 block text-xs mt-0.5">
                  {courier?.contactPerson || activeSettlement.courierRepName || "Ramesh Sharma"} ({courier?.phone || "9801122334"})
                </strong>
                <span className="text-slate-500 block text-[11px] mt-2.5">Settlement Period:</span>
                <strong className="text-slate-900 font-mono block text-xs mt-0.5">
                  {activeSettlement.startDate} – {activeSettlement.endDate}
                </strong>
              </div>
            </div>
          </div>

          {/* Parcel Processing Summary Strip */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-700 text-center mb-3">
              PARCEL PROCESSING SUMMARY
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-300 text-center bg-white">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  DELIVERED PARCELS
                </span>
                <span className="text-2xl font-black text-emerald-700 block mt-1">
                  {activeSettlement.deliveredParcelsCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-300 text-center bg-white">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                  RETURNED PARCELS
                </span>
                <span className="text-2xl font-black text-rose-700 block mt-1">
                  {activeSettlement.returnedParcelsCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-300 text-center bg-white">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  TOTAL PROCESSED
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-1">
                  {activeSettlement.totalProcessedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Settlement Details & Description Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-50 px-4 py-2.5 flex justify-between font-bold text-slate-800 border-b border-slate-300 uppercase tracking-wider">
              <span>SETTLEMENT DETAILS & DESCRIPTION</span>
              <span>AMOUNT (NPR)</span>
            </div>

            <div className="divide-y divide-slate-200">
              {/* Gross COD Collection */}
              <div className="px-4 py-3 flex justify-between font-medium bg-slate-50/60">
                <span className="font-semibold text-slate-800">Gross COD Collection to be Received from Courier</span>
                <span className="font-bold font-mono text-slate-900">
                  Rs. {activeSettlement.grossCodCollection.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Less: Delivery Charges */}
              <div className="px-4 py-3 flex justify-between text-rose-600 font-medium pl-6">
                <span>Less: Delivery Charges ({activeSettlement.deliveredParcelsCount} packages)</span>
                <span className="font-mono">
                  - Rs. {activeSettlement.deliveryCharges.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Current Net Receivable (Shown when previous outstanding due exists to separate current from total) */}
              {(activeSettlement.previousOutstandingDue || 0) > 0 && (
                <div className="px-4 py-3 flex justify-between bg-slate-50 font-bold text-slate-900">
                  <span>Current Net Receivable</span>
                  <span className="font-mono">
                    Rs. {activeSettlement.currentNetReceivable.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {/* Add: Previous Outstanding Due (Only shown if > 0) */}
              {(activeSettlement.previousOutstandingDue || 0) > 0 && (
                <div className="px-4 py-3 flex justify-between font-medium text-slate-700 pl-6">
                  <span>Add: Previous Outstanding Due (Brought Forward)</span>
                  <span className="font-mono">
                    + Rs. {activeSettlement.previousOutstandingDue.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {/* Total Receivable from Courier */}
              <div className="px-4 py-3.5 flex justify-between bg-blue-50/60 font-black text-sm text-blue-900 border-t border-b border-blue-200">
                <span>TOTAL RECEIVABLE FROM COURIER</span>
                <span className="font-mono">
                  Rs. {activeSettlement.totalReceivable.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Less: Payment Received */}
              <div className="px-4 py-3 flex justify-between font-semibold text-emerald-700 pl-6">
                <div>
                  <span>Less: Total Payment Received / Deposited</span>
                  {((activeSettlement.cashReceived || 0) > 0 || (activeSettlement.onlineReceived || 0) > 0) && (
                    <div className="text-[11px] text-slate-500 font-normal">
                      {(activeSettlement.cashReceived || 0) > 0 && `Cash: Rs. ${activeSettlement.cashReceived?.toLocaleString("en-IN")}`}
                      {(activeSettlement.cashReceived || 0) > 0 && (activeSettlement.onlineReceived || 0) > 0 && " • "}
                      {(activeSettlement.onlineReceived || 0) > 0 && `Online: Rs. ${activeSettlement.onlineReceived?.toLocaleString("en-IN")}`}
                      {activeSettlement.paymentReference && ` (Ref: ${activeSettlement.paymentReference})`}
                    </div>
                  )}
                </div>
                <span className="font-mono font-bold">
                  - Rs. {activeSettlement.paymentReceived.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Remaining Due Carried Forward */}
              <div className="px-4 py-3.5 flex justify-between bg-slate-100 font-black text-base text-slate-900">
                <div className="flex items-center gap-2">
                  <span>REMAINING DUE (CARRIED FORWARD)</span>
                  {activeSettlement.remainingDue > 0 ? (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                      Unpaid Balance
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      Fully Cleared
                    </span>
                  )}
                </div>
                <span className={`font-mono font-black ${activeSettlement.remainingDue > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  Rs. {activeSettlement.remainingDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Installments Audit Box */}
          {activeSettlement.paymentInstallments && activeSettlement.paymentInstallments.length > 0 && (
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs mt-4">
              <div className="bg-slate-50 px-4 py-2 font-bold text-slate-800 border-b border-slate-300 uppercase tracking-wider text-[11px]">
                Payment Installment Receipts & Settlement Dues
              </div>
              <div className="divide-y divide-slate-200">
                {activeSettlement.paymentInstallments.map((inst, idx) => (
                  <div key={inst._id || idx} className="px-4 py-2 flex items-center justify-between">
                    <div>
                      <strong className="font-mono text-blue-700 mr-2">{inst.paymentNumber}</strong>
                      <span className="text-slate-500 mr-2">{inst.paymentDate}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-medium">{inst.paymentMethod}</span>
                      {inst.referenceNumber && <span className="font-mono text-[11px] text-slate-600 ml-2">Ref: {inst.referenceNumber}</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 text-xs mr-3">
                        Rs. {inst.amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Cash: Rs. {inst.cashAmount} • Online: Rs. {inst.onlineAmount})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures Section */}
          <div className="mt-14 pt-8 border-t border-slate-300">
            <div className="grid grid-cols-2 gap-16 text-center text-xs max-w-2xl mx-auto">
              <div>
                <div className="border-b border-slate-400 mb-2 h-14 flex items-end justify-center pb-1">
                  {/* Clean blank area for courier physical signature */}
                </div>
                <strong className="block text-slate-900 text-sm">Courier Representative</strong>
                <span className="text-[11px] text-slate-500">Received & Acknowledged</span>
              </div>

              <div>
                <div className="border-b border-slate-400 mb-2 h-14 flex items-end justify-center pb-1">
                  {/* Clean blank area for authorized company physical signature & stamp */}
                </div>
                <strong className="block text-slate-900 text-sm">{company.signatoryNameTitle}</strong>
                <span className="text-[11px] text-slate-500">Authorized Signatory • {company.companyName}</span>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-10 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold tracking-wider uppercase text-slate-700">THANK YOU</p>
            <p className="text-[11px] italic max-w-xl mx-auto">{company.billFooterNotice}</p>
          </div>
        </div>
      </div>

      {/* VIEW 2: CUSTOMER DELIVERED DETAILS */}
      {activeTab === "delivered" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Customer Delivered Details</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                  {deliveredParcels.length} Parcels
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All parcels successfully delivered by {activeSettlement.courierName} and reconciled in statement {activeSettlement.settlementNumber}
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Customer, Mobile, SKU, or Batch..."
                value={deliveredSearch}
                onChange={(e) => setDeliveredSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
            <div>
              <span className="text-slate-400">Total Delivered:</span>{" "}
              <strong className="text-slate-900 dark:text-white font-mono">{filteredDelivered.length} packages</strong>
            </div>
            <div>•</div>
            <div>
              <span className="text-slate-400">Total Collected COD:</span>{" "}
              <strong className="text-emerald-600 font-mono">
                Rs. {filteredDelivered.reduce((sum, p) => sum + (p.codAmount || 0), 0).toLocaleString("en-IN")}
              </strong>
            </div>
            <div>•</div>
            <div>
              <span className="text-slate-400">Total Delivery Charges:</span>{" "}
              <strong className="text-rose-600 font-mono">
                Rs. {filteredDelivered.reduce((sum, p) => sum + (p.deliveryCharge || 70), 0).toLocaleString("en-IN")}
              </strong>
            </div>
            <div>•</div>
            <div>
              <span className="text-slate-400">Net Receivable (COD - Charges):</span>{" "}
              <strong className="text-blue-600 font-mono">
                Rs. {(
                  filteredDelivered.reduce((sum, p) => sum + (p.codAmount || 0), 0) -
                  filteredDelivered.reduce((sum, p) => sum + (p.deliveryCharge || 70), 0)
                ).toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">S.N.</th>
                  <th className="py-3 px-3">PARCEL ID</th>
                  <th className="py-3 px-3">CUSTOMER NAME</th>
                  <th className="py-3 px-3">MOBILE NUMBER</th>
                  <th className="py-3 px-3 text-right">COD AMOUNT</th>
                  <th className="py-3 px-3 text-right">ADVANCE PAID</th>
                  <th className="py-3 px-3 text-right">TOTAL ORDER</th>
                  <th className="py-3 px-3">SKU / ITEM</th>
                  <th className="py-3 px-3 text-right">CHARGE</th>
                  <th className="py-3 px-3">BATCH ID</th>
                  <th className="py-3 px-3">DELIVERY ADDRESS</th>
                  <th className="py-3 px-3">DELIVERED DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDelivered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      No delivered parcels found matching the query.
                    </td>
                  </tr>
                ) : (
                  filteredDelivered.map((p, idx) => (
                    <tr key={p._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.parcelId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {p.customerName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {p.customerPhone}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {(p.codAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-semibold">
                        Rs. {(p.advancePayment || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        Rs. {((p.codAmount || 0) + (p.advancePayment || 0)).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                        {p.itemSku || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-medium">
                        Rs. {p.deliveryCharge || 70}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.batchId}</td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate">
                        {p.customerAddress || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 font-semibold">
                        {p.deliveredDate || activeSettlement.settlementDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: RETURN DETAILS */}
      {activeTab === "returned" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <span>Return Details (Warehouse Inward)</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800">
                  {returnedParcels.length} Parcels
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Parcels physically received back at warehouse with reasons and zero return fee policy applied
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Customer, Mobile, Reason, or Batch..."
                value={returnedSearch}
                onChange={(e) => setReturnedSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">S.N.</th>
                  <th className="py-3 px-3">PARCEL ID</th>
                  <th className="py-3 px-3">CUSTOMER NAME</th>
                  <th className="py-3 px-3">MOBILE NUMBER</th>
                  <th className="py-3 px-3 text-right">UNCOLLECTED COD</th>
                  <th className="py-3 px-3">SKU / ITEM</th>
                  <th className="py-3 px-3">BATCH ID</th>
                  <th className="py-3 px-3">RETURN REASON</th>
                  <th className="py-3 px-3">RETURN DATE</th>
                  <th className="py-3 px-3">PROCESSED BY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReturned.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No returned parcels found matching the query.
                    </td>
                  </tr>
                ) : (
                  filteredReturned.map((p, idx) => (
                    <tr key={p._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.parcelId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {p.customerName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {p.customerPhone}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        Rs. {(p.codAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                        {p.itemSku || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.batchId}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                          {p.returnReason || "Customer rejected parcel"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-600 font-semibold">
                        {p.returnDate || activeSettlement.settlementDate}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {p.returnProcessedBy || "Warehouse Staff"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: BATCH BREAKDOWN */}
      {activeTab === "batches" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              <span>Batch-Wise Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Summary of all dispatch batches reconciled in statement {activeSettlement.settlementNumber}
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-3">BATCH ID</th>
                  <th className="py-3 px-3 text-center">DELIVERED</th>
                  <th className="py-3 px-3 text-center">RETURNED</th>
                  <th className="py-3 px-3 text-center">TOTAL PROCESSED</th>
                  <th className="py-3 px-3 text-right">DELIVERED COD</th>
                  <th className="py-3 px-3 text-right">ADVANCE PAID</th>
                  <th className="py-3 px-3 text-right">DELIVERY CHARGES</th>
                  <th className="py-3 px-3 text-right">NET SETTLEMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batchBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No batch breakdown available.
                    </td>
                  </tr>
                ) : (
                  batchBreakdown.map((b) => (
                    <tr key={b.batchId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {b.batchId}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                        {b.deliveredCount}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-rose-600">
                        {b.returnedCount}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {b.deliveredCount + b.returnedCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        Rs. {b.deliveredCod.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-600 font-semibold">
                        Rs. {b.totalAdvance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        - Rs. {b.deliveryCharge.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        Rs. {(b.deliveredCod - b.deliveryCharge).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
