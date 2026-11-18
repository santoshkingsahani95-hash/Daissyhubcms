"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  PlusCircle,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  X,
  DollarSign,
  TrendingUp,
  Eye,
  Receipt,
  ExternalLink,
  ArrowRight,
  Wallet,
  Landmark,
  BadgePercent,
  Layers,
  Banknote,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { IPayment, ICourierCompany, PaymentMethod, ISettlement } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";
import { SettlementDetailsModal } from "@/components/settlements/SettlementDetailsModal";

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"settlements" | "receipts">("settlements");
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [settlements, setSettlements] = useState<ISettlement[]>([]);
  const [couriers, setCouriers] = useState<ICourierCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCourierFilter, setSelectedCourierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Unpaid" | "Partially Paid" | "Fully Paid">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Delete Settlement Statement State (Admin Only)
  const [settlementToDelete, setSettlementToDelete] = useState<ISettlement | null>(null);
  const [deletingSettlement, setDeletingSettlement] = useState(false);

  // Audit Detail Modal States
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<IPayment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Pay Settlement Due Modal State
  const [payingSettlement, setPayingSettlement] = useState<ISettlement | null>(null);
  const [payCashAmount, setPayCashAmount] = useState<string>("0");
  const [payOnlineAmount, setPayOnlineAmount] = useState<string>("");
  const [payOnlineMethod, setPayOnlineMethod] = useState<string>("Bank Transfer");
  const [payReference, setPayReference] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [payRemarks, setPayRemarks] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Standalone Ad-hoc Payment Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formCourierId, setFormCourierId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formMethod, setFormMethod] = useState<PaymentMethod>("Bank Transfer");
  const [formRef, setFormRef] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [savingAdHoc, setSavingAdHoc] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/settlements").then((r) => r.json()),
      fetch("/api/couriers?active=true").then((r) => r.json()),
    ])
      .then(([payData, settsData, couriersData]) => {
        if (payData.success && payData.payments) {
          setPayments(payData.payments);
        }
        if (settsData.success && settsData.settlements) {
          setSettlements(settsData.settlements);
        }
        if (couriersData.success && couriersData.couriers?.length > 0) {
          setCouriers(couriersData.couriers);
          if (!formCourierId) setFormCourierId(couriersData.couriers[0]._id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // Helper to open Pay Settlement Modal
  const openPayModal = (s: ISettlement) => {
    setPayingSettlement(s);
    const due = s.remainingDue !== undefined ? s.remainingDue : Math.max(0, s.totalReceivable - (s.paymentReceived || 0));
    setPayCashAmount("0");
    setPayOnlineAmount(due > 0 ? due.toString() : "0");
    setPayOnlineMethod("Bank Transfer");
    setPayReference("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayRemarks(`Payment installment for ${s.settlementNumber}`);
  };

  // Handle Pay Settlement Due Submit
  const handleRecordSettlementPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSettlement) return;

    const cash = parseFloat(payCashAmount) || 0;
    const online = parseFloat(payOnlineAmount) || 0;
    const totalPaying = Math.round((cash + online) * 100) / 100;

    if (totalPaying <= 0) {
      toast.error("Please enter a valid Cash or Online amount to pay");
      return;
    }

    const currentDue = payingSettlement.remainingDue !== undefined
      ? payingSettlement.remainingDue
      : Math.max(0, payingSettlement.totalReceivable - (payingSettlement.paymentReceived || 0));

    if (totalPaying > currentDue + 0.01) {
      toast.error(`Total payment (Rs. ${totalPaying.toLocaleString("en-IN")}) cannot exceed remaining due (Rs. ${currentDue.toLocaleString("en-IN")})`);
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/settlements/${encodeURIComponent(payingSettlement._id)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashAmount: cash,
          onlineAmount: online,
          onlineMethod: payOnlineMethod,
          paymentDate: payDate,
          referenceNumber: payReference,
          remarks: payRemarks,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to record settlement payment");
      }

      toast.success(data.message || "Settlement payment recorded successfully!");
      setPayingSettlement(null);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Delete Settlement Statement (Admin Only)
  const handleConfirmDeleteSettlement = async () => {
    if (!settlementToDelete) return;
    setDeletingSettlement(true);
    const toastId = toast.loading(`Deleting settlement ${settlementToDelete.settlementNumber}...`);
    try {
      const res = await fetch(
        `/api/settlements/${encodeURIComponent(settlementToDelete._id || settlementToDelete.settlementNumber)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete settlement statement");
      }
      toast.success(
        data.message || `Settlement statement ${settlementToDelete.settlementNumber} deleted!`,
        { id: toastId }
      );
      setSettlementToDelete(null);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete settlement statement", { id: toastId });
    } finally {
      setDeletingSettlement(false);
    }
  };

  // Handle Ad-hoc Payment Submit
  const handleSubmitAdHocPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourierId) {
      toast.error("Please select a courier");
      return;
    }
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setSavingAdHoc(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierId: formCourierId,
          amount: amt,
          paymentDate: formDate,
          paymentMethod: formMethod,
          referenceNumber: formRef,
          remarks: formRemarks,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      toast.success(`Payment of Rs. ${amt.toLocaleString("en-IN")} recorded!`);
      setShowAddModal(false);
      setFormAmount("");
      setFormRef("");
      setFormRemarks("");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSavingAdHoc(false);
    }
  };

  // Filtered Settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      if (selectedCourierFilter !== "all" && s.courierId !== selectedCourierFilter) return false;
      if (startDate && s.settlementDate < startDate) return false;
      if (endDate && s.settlementDate > endDate) return false;

      const remaining = s.remainingDue !== undefined ? s.remainingDue : Math.max(0, s.totalReceivable - (s.paymentReceived || 0));
      const status: "Unpaid" | "Partially Paid" | "Fully Paid" =
        s.paymentStatus || (remaining <= 0 ? "Fully Paid" : (s.paymentReceived || 0) > 0 ? "Partially Paid" : "Unpaid");

      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.settlementNumber.toLowerCase().includes(q) ||
          s.courierName.toLowerCase().includes(q) ||
          (s.paymentReference && s.paymentReference.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [settlements, selectedCourierFilter, startDate, endDate, statusFilter, search]);

  // Filtered Payments (Receipts)
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (selectedCourierFilter !== "all" && p.courierId !== selectedCourierFilter) return false;
      if (startDate && p.paymentDate < startDate) return false;
      if (endDate && p.paymentDate > endDate) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.paymentNumber.toLowerCase().includes(q) ||
          p.courierName.toLowerCase().includes(q) ||
          p.referenceNumber.toLowerCase().includes(q) ||
          (p.remarks && p.remarks.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [payments, selectedCourierFilter, startDate, endDate, search]);

  // Top Metrics Calculation
  const totalInvoicedReceivables = settlements.reduce((sum, s) => sum + (s.totalReceivable || 0), 0);
  const totalAmountDeposited = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOutstandingDue = settlements.reduce((sum, s) => {
    const rem = s.remainingDue !== undefined ? s.remainingDue : Math.max(0, s.totalReceivable - (s.paymentReceived || 0));
    return sum + rem;
  }, 0);
  const pendingSettlementsCount = settlements.filter((s) => {
    const rem = s.remainingDue !== undefined ? s.remainingDue : Math.max(0, s.totalReceivable - (s.paymentReceived || 0));
    return rem > 0;
  }).length;

  const handleViewPaymentDetails = (payment: IPayment) => {
    const match = payment.remarks?.match(/(#SET-[\w-]+|SET-[\w-]+)/i);
    const settleRef = payment.settlementId || payment.settlementNumber || (match ? match[0] : null);

    if (settleRef) {
      setSelectedSettlementId(settleRef);
      setShowSettlementModal(true);
    } else {
      setSelectedPaymentReceipt(payment);
      setShowReceiptModal(true);
    }
  };

  // Modal Calculation Helpers
  const payingCashNum = parseFloat(payCashAmount) || 0;
  const payingOnlineNum = parseFloat(payOnlineAmount) || 0;
  const payingTotalSum = payingCashNum + payingOnlineNum;
  const payingCurrentDue = payingSettlement
    ? (payingSettlement.remainingDue !== undefined ? payingSettlement.remainingDue : Math.max(0, payingSettlement.totalReceivable - (payingSettlement.paymentReceived || 0)))
    : 0;
  const payingNewRemainingDue = Math.max(0, payingCurrentDue - payingTotalSum);
  const payingWillBeFullyPaid = payingNewRemainingDue <= 0 && payingTotalSum > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Courier Payments & Settlement Receivables</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pay settlement bills, track cash & online receipts, and manage remaining due balances
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Record Ad-hoc Payment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Invoiced Bills
            </span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Rs. {totalInvoicedReceivables.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {settlements.length} settlement statements
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Total Payments Received
            </span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            Rs. {totalAmountDeposited.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">
            {payments.length} deposit installments recorded
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Total Outstanding Due
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">
            Rs. {totalOutstandingDue.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-rose-500/80 mt-0.5 block">
            Unpaid / remaining due across couriers
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Pending Settlements
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {pendingSettlementsCount}
          </p>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block">
            Settlements needing payment or remaining due
          </span>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 pt-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("settlements")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "settlements"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Settlement Invoices & Receivables</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "settlements" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {filteredSettlements.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("receipts")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "receipts"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Receipts & Deposits</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === "receipts" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {filteredPayments.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === "settlements"
                    ? "Search Settlement #, Courier, Reference..."
                    : "Search Payment #, Courier, Reference..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCourierFilter}
              onChange={(e) => setSelectedCourierFilter(e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Couriers</option>
              {couriers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {activeTab === "settlements" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Fully Paid">Fully Paid</option>
              </select>
            )}

            <DateQuickFilter
              startDate={startDate}
              endDate={endDate}
              onDateChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>

          {(startDate || endDate || search || selectedCourierFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearch("");
                setSelectedCourierFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* TAB 1: SETTLEMENT INVOICES & RECEIVABLES */}
        {activeTab === "settlements" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">INVOICE / SETTLEMENT #</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">COURIER PARTNER</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">DATE</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">TOTAL RECEIVABLE</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">PAYMENT RECEIVED</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">REMAINING DUE</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-center">PAYMENT STATUS</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">Loading settlement invoices...</td>
                  </tr>
                ) : filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">No settlement invoices found matching criteria.</td>
                  </tr>
                ) : (
                  filteredSettlements.map((s) => {
                    const remaining = s.remainingDue !== undefined ? s.remainingDue : Math.max(0, s.totalReceivable - (s.paymentReceived || 0));
                    const status: "Unpaid" | "Partially Paid" | "Fully Paid" =
                      s.paymentStatus || (remaining <= 0 ? "Fully Paid" : (s.paymentReceived || 0) > 0 ? "Partially Paid" : "Unpaid");

                    const hasCashSplit = (s.cashReceived || 0) > 0;
                    const hasOnlineSplit = (s.onlineReceived || 0) > 0;

                    return (
                      <tr key={s._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          <button
                            onClick={() => {
                              setSelectedSettlementId(s.settlementNumber);
                              setShowSettlementModal(true);
                            }}
                            className="hover:underline flex items-center gap-1"
                            title="Click to view full manifest & breakdown"
                          >
                            <span>{s.settlementNumber}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {s.courierName}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {s.settlementDate}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {s.totalReceivable.toLocaleString("en-IN")}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Rs. {(s.paymentReceived || 0).toLocaleString("en-IN")}
                          </div>
                          {(hasCashSplit || hasOnlineSplit) && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {hasCashSplit && `Cash: Rs. ${s.cashReceived?.toLocaleString("en-IN")}`}
                              {hasCashSplit && hasOnlineSplit && " • "}
                              {hasOnlineSplit && `Online: Rs. ${s.onlineReceived?.toLocaleString("en-IN")}`}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {remaining > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              Rs. {remaining.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">
                              Rs. 0
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {status === "Fully Paid" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Fully Paid</span>
                            </span>
                          ) : status === "Partially Paid" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Partially Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Unpaid</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {remaining > 0 ? (
                              <button
                                onClick={() => openPayModal(s)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 transition-all"
                                title="Pay remaining due or record installment"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>{status === "Unpaid" ? "Pay Settlement" : "Pay Due"}</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                                <Check className="w-3.5 h-3.5" />
                                <span>Cleared</span>
                              </span>
                            )}

                            <button
                              onClick={() => {
                                setSelectedSettlementId(s.settlementNumber);
                                setShowSettlementModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                              title="View delivery breakdown, returns, and statement details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Manifest</span>
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => setSettlementToDelete(s)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800 transition"
                                title="Delete settlement statement (Admin Only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PAYMENT RECEIPTS & DEPOSITS */}
        {activeTab === "receipts" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">PAYMENT #</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">COURIER</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">DATE</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">METHOD</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">SPLIT BREAKDOWN</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">REFERENCE / TXN</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">AMOUNT RECEIVED</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">REMARKS & SETTLEMENT</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">RECORDED BY</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">Loading payment receipts...</td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">No payment receipts found.</td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const match = p.remarks?.match(/(#SET-[\w-]+|SET-[\w-]+)/i);
                    const settleRef = p.settlementId || p.settlementNumber || (match ? match[0] : null);

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{p.paymentNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{p.courierName}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.paymentDate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {p.cashAmount !== undefined && p.onlineAmount !== undefined ? (
                            <span>
                              Cash: Rs. {p.cashAmount.toLocaleString("en-IN")} | Online: Rs. {p.onlineAmount.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{p.referenceNumber || "-"}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          Rs. {p.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[260px]">
                          {settleRef ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-500">{p.remarks?.replace(match ? match[0] : "", "").trim() || "Settlement"}</span>
                              <button
                                onClick={() => {
                                  setSelectedSettlementId(settleRef);
                                  setShowSettlementModal(true);
                                }}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 transition"
                                title="Click to view full settlement manifest"
                              >
                                <span>{p.settlementNumber || (match ? match[0] : settleRef)}</span>
                                <ExternalLink className="w-3 h-3 text-blue-500" />
                              </button>
                            </div>
                          ) : (
                            p.remarks || "-"
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{p.recordedBy}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewPaymentDetails(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 transition-colors shadow-xs"
                            title="View customer delivery details, returns and settlement manifest"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAY SETTLEMENT DUE MODAL */}
      {payingSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Collect Settlement Payment
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {payingSettlement.settlementNumber} • {payingSettlement.courierName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayingSettlement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Status Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Invoiced</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
                  Rs. {payingSettlement.totalReceivable.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-700 px-2">
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">Paid So Far</span>
                <span className="font-mono font-bold text-emerald-600 text-sm mt-0.5 block">
                  Rs. {(payingSettlement.paymentReceived || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 uppercase font-bold block">Current Due</span>
                <span className="font-mono font-black text-rose-600 text-sm mt-0.5 block">
                  Rs. {payingCurrentDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordSettlementPay} className="space-y-3.5 text-xs">
              {/* Cash & Online Split Inputs */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cash Amount (Rs.)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={payCashAmount}
                      onChange={(e) => setPayCashAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Online Amount (Rs.)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={payOnlineAmount}
                      onChange={(e) => setPayOnlineAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Online Method & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Online Method
                  </label>
                  <select
                    value={payOnlineMethod}
                    onChange={(e) => setPayOnlineMethod(e.target.value)}
                    className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Esewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="ConnectIPS">ConnectIPS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Txn ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NABIL-TXN-998822"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Payment Date & Remarks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. First partial installment"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Live Preview Calculation */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Total Paying Now:</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    Rs. {payingTotalSum.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-1.5">
                  <span className="text-slate-400 font-semibold">Remaining Due After Payment:</span>
                  <span className="font-mono font-extrabold text-base text-white">
                    Rs. {payingNewRemainingDue.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] border-t border-slate-800 pt-1.5">
                  <span className="text-slate-400">Resulting Status:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    payingWillBeFullyPaid
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {payingWillBeFullyPaid ? "Fully Paid (Settlement Closed)" : "Partially Paid (Due Stored)"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingSettlement(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || payingTotalSum <= 0}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-500/20 transition-all"
                >
                  {submittingPayment ? "Processing..." : `Confirm Payment (Rs. ${payingTotalSum.toLocaleString("en-IN")})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STANDALONE AD-HOC PAYMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Record Ad-hoc Courier Deposit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct advance or bulk ledger payment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdHocPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Courier Partner <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCourierId}
                  onChange={(e) => setFormCourierId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {couriers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} (Due: Rs. {(c.currentBalance || 0).toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (NPR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 40000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full text-xs font-bold text-emerald-600 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Esewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. NABIL-TXN-884920"
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deposited into company account"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdHoc}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  {savingAdHoc ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Linked Settlement Audit & Manifest Modal */}
      <SettlementDetailsModal
        settlementIdOrNumber={selectedSettlementId}
        isOpen={showSettlementModal}
        onClose={() => {
          setShowSettlementModal(false);
          setSelectedSettlementId(null);
        }}
      />

      {/* Manual Non-Settlement Payment Receipt Modal */}
      {showReceiptModal && selectedPaymentReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Payment Receipt Details
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedPaymentReceipt.paymentNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Courier Partner:</span>
                <strong className="text-slate-900 dark:text-white">{selectedPaymentReceipt.courierName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedPaymentReceipt.paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedPaymentReceipt.paymentMethod}</span>
              </div>
              {selectedPaymentReceipt.cashAmount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Received:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    Rs. {selectedPaymentReceipt.cashAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {selectedPaymentReceipt.onlineAmount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Online Received:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    Rs. {selectedPaymentReceipt.onlineAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Reference / Txn:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedPaymentReceipt.referenceNumber || "-"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Amount:</span>
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  Rs. {selectedPaymentReceipt.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Remarks:</span>
                <span className="text-slate-700 dark:text-slate-300 max-w-[260px] text-right">{selectedPaymentReceipt.remarks || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recorded By:</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedPaymentReceipt.recordedBy}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Settlement Confirmation Modal (Admin Only) */}
      {settlementToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Settlement Statement?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This action is permanent and restricted to <strong>Admin</strong> users.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Settlement #:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {settlementToDelete.settlementNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Courier Partner:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {settlementToDelete.courierName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Total Receivable:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  Rs. {settlementToDelete.totalReceivable?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Parcels Included:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {settlementToDelete.totalProcessedCount || ((settlementToDelete.deliveredParcelsCount || 0) + (settlementToDelete.returnedParcelsCount || 0))} packages
                </span>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
              ⚠️ Deleting this statement will unlock all associated parcels, returning them to unsettled status so they can be re-settled. Any linked ledger debit/credit entries will be reversed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSettlementToDelete(null)}
                disabled={deletingSettlement}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSettlement}
                disabled={deletingSettlement}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingSettlement ? "Deleting..." : "Confirm & Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
