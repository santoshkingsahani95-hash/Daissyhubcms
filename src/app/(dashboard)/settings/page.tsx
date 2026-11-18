"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  Save,
  Eye,
  CheckCircle2,
  ExternalLink,
  Printer,
  ShieldCheck,
  Zap,
  RefreshCw,
  Database,
  Server,
  Activity,
  Layers,
  Gauge,
  Trash2,
  Smartphone,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ICompanySettings } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<ICompanySettings>({
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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cache & Pre-Warming State
  const [cacheMetrics, setCacheMetrics] = useState<any>(null);
  const [warmingCache, setWarmingCache] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [benchResult, setBenchResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchCacheMetrics();
  }, []);

  const fetchCacheMetrics = () => {
    fetch("/api/cache")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.metrics) {
          setCacheMetrics(data.metrics);
        }
      })
      .catch(console.error);
  };

  const handleWarmCache = async () => {
    setWarmingCache(true);
    try {
      const res = await fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "crawl" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setCacheMetrics(data.metrics);
      toast.success(data.message || "Database cache crawled & pre-warmed!");
    } catch (err: any) {
      toast.error(err.message || "Cache warming failed");
    } finally {
      setWarmingCache(false);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "benchmark", iterations: 1000 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setBenchResult(data.benchmark);
      setCacheMetrics(data.metrics);
      toast.success(
        `⚡ Benchmark: 1,000 lookups completed in ${data.benchmark.totalTimeMs}ms (${data.benchmark.avgLatencyUs} µs/op - ${data.benchmark.opsPerSec.toLocaleString()} ops/sec)`
      );
    } catch (err: any) {
      toast.error(err.message || "Benchmark failed");
    } finally {
      setBenchmarking(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to flush the in-memory object cache?")) return;
    setClearingCache(true);
    try {
      const res = await fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setCacheMetrics(data.metrics);
      toast.success("Cache cleared successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear cache");
    } finally {
      setClearingCache(false);
    }
  };

  const handleFlushNamespace = async (namespace: string) => {
    try {
      const res = await fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "flush_namespace", namespace }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setCacheMetrics(data.metrics);
      toast.success(`Flushed '${namespace}' namespace`);
    } catch (err: any) {
      toast.error(err.message || `Failed to flush ${namespace}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.companyName.trim()) {
      toast.error("Company Name is required");
      return;
    }

    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      toast.success("Enterprise and settlement billing details saved successfully!");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      fetchCacheMetrics();
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Matching Screenshot 2) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Company & Bill Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure your enterprise billing information, logo, PAN/VAT, and authorized signature for courier settlement bills
          </p>
        </div>

        <Link href="/settlements/settlement-2">
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-sm shrink-0">
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>View Full A4 Invoice (#SET-002)</span>
          </button>
        </Link>
      </div>

      {/* Database Object Cache & Pre-Warming Engine Card */}
      <div id="cache-engine" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 scroll-mt-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>Database Object Cache & Pre-Warming Engine</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  cacheMetrics?.isCrawling
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse"
                    : cacheMetrics?.isWarmed
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}>
                  {cacheMetrics?.isCrawling
                    ? "Crawling Database..."
                    : cacheMetrics?.isWarmed
                    ? "Pre-Warmed & Hot"
                    : "Active"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                In-memory database object cache with background crawler for sub-millisecond API response latency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={benchmarking}
              onClick={handleRunBenchmark}
              title="Execute 1,000 rapid in-memory lookups to measure microsecond latency"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shrink-0"
            >
              <Gauge className={`w-3.5 h-3.5 text-blue-600 ${benchmarking ? "animate-spin" : ""}`} />
              <span>{benchmarking ? "Benchmarking..." : "Micro-Benchmark"}</span>
            </button>

            <button
              type="button"
              disabled={clearingCache}
              onClick={handleClearCache}
              title="Flush entire in-memory object cache"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-all shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              disabled={warmingCache}
              onClick={handleWarmCache}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-xs transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${warmingCache ? "animate-spin text-amber-400" : ""}`} />
              <span>{warmingCache ? "Crawling Database..." : "Re-Warm Cache (Crawl Database)"}</span>
            </button>
          </div>
        </div>

        {/* Cache Performance Metrics Grid (6 Metric Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
              Hit Ratio
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {cacheMetrics?.hitRatio !== undefined ? `${cacheMetrics.hitRatio}%` : "100%"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              {cacheMetrics?.avgLookupLatencyUs ? `${cacheMetrics.avgLookupLatencyUs} µs latency` : "< 0.05ms"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
              Pre-Warmed Objects
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                {cacheMetrics?.crawledEntitiesCount || cacheMetrics?.entriesCount || 0}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              {cacheMetrics?.entriesCount || 0} in active RAM
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
              Mobile Phone Index
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {cacheMetrics?.phoneIndexCount || 0}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              unique customer IDs
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
              Crawler Duration
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                {cacheMetrics?.crawlDurationMs || 0}
              </span>
              <span className="text-xs font-semibold text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              total DB crawl time
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
              Throughput
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                {cacheMetrics?.opsPerSecondEstimate ? `${Math.round(cacheMetrics.opsPerSecondEstimate / 1000)}k` : "65k"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              ops / second
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
              Memory Footprint
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                {cacheMetrics?.memoryEstimateKb || 12}
              </span>
              <span className="text-xs font-semibold text-slate-400">KB</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
              LRU capped (25k max)
            </span>
          </div>
        </div>

        {/* Namespace Tags & Quick-Flush Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Warmed Namespaces & Quick Flush:</span>
            </span>
            {cacheMetrics?.warmedAt && (
              <span className="text-[11px] text-slate-400 font-mono">
                Last Crawled: {new Date(cacheMetrics.warmedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "settings", label: "Settings", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
              { id: "couriers", label: "Couriers", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
              { id: "batches", label: "Batches", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
              { id: "parcels", label: "Parcels", color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
              { id: "customers", label: "Customers", color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300" },
              { id: "dashboard", label: "Dashboard", color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
              { id: "settlements", label: "Settlements", color: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
              { id: "users", label: "Users", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
              { id: "returns", label: "Returns", color: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
            ].map((ns) => {
              const count = cacheMetrics?.namespaces?.[ns.id] || 0;
              return (
                <div
                  key={ns.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors ${ns.color}`}
                >
                  <span>{ns.label}</span>
                  <span className="font-bold opacity-80">({count})</span>
                  {count > 0 && (
                    <button
                      type="button"
                      onClick={() => handleFlushNamespace(ns.id)}
                      title={`Flush '${ns.id}' namespace`}
                      className="ml-0.5 opacity-60 hover:opacity-100 hover:text-rose-600 transition-opacity"
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Enterprise & Billing Identity Card (Matching Screenshot 2 Exactly) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Enterprise & Billing Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* PAN / VAT */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                PAN / VAT Registration Number
              </label>
              <input
                type="text"
                value={settings.panVatNumber}
                onChange={(e) => setSettings({ ...settings, panVatNumber: e.target.value })}
                className="w-full text-xs font-semibold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Corporate Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Corporate Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.corporateAddress}
                onChange={(e) => setSettings({ ...settings, corporateAddress: e.target.value })}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone / Mobile Numbers */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone / Mobile Numbers <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.phones}
                onChange={(e) => setSettings({ ...settings, phones: e.target.value })}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address for Statements
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Authorized Signatory */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Authorized Signatory Name / Title
              </label>
              <input
                type="text"
                value={settings.signatoryNameTitle}
                onChange={(e) => setSettings({ ...settings, signatoryNameTitle: e.target.value })}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bill Footer Notice / Terms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Bill Footer Notice / Terms
            </label>
            <textarea
              rows={2}
              value={settings.billFooterNotice}
              onChange={(e) => setSettings({ ...settings, billFooterNotice: e.target.value })}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Live Preview on Printed Bills (Matching User's Exact COD Settlement Invoice Screenshot) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Live Preview on Printed Bills
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Updates in real-time as you edit enterprise details above
            </span>
          </div>

          {/* Exact Statement Preview matching official printed invoice layout */}
          <div className="p-8 sm:p-10 rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-sm max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start pt-2">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {settings.companyName || "DaisyHub E-Commerce Pvt. Ltd."}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {settings.corporateAddress}
                </p>
                <p className="text-xs text-slate-600">
                  Phone: {settings.phones} • Email: {settings.email}
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  PAN / VAT Reg:  <span className="font-mono">{settings.panVatNumber}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold text-blue-700 block tracking-wider uppercase">
                  COURIER SETTLEMENT
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 block mt-0.5">
                  #SET-20261104-002
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  Settlement Date: <strong className="text-slate-900 font-mono">04 Nov 2026</strong>
                </span>
              </div>
            </div>

            {/* Thin Horizontal Divider */}
            <hr className="border-t border-slate-300 my-2" />

            {/* Bill To / Courier Partner Box */}
            <div className="p-4 rounded-xl border border-slate-300 bg-white">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                BILL TO / COURIER PARTNER
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Courier Name:</span>
                  <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                    Google Express
                  </strong>
                  <span className="text-slate-500 block text-[11px] mt-2.5">Service Area:</span>
                  <strong className="text-slate-800 block text-xs mt-0.5">
                    Inside Valley
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Contact Person & Mobile:</span>
                  <strong className="text-slate-900 block text-xs mt-0.5">
                    Ramesh Sharma (9801122334)
                  </strong>
                  <span className="text-slate-500 block text-[11px] mt-2.5">Settlement Period:</span>
                  <strong className="text-slate-900 font-mono block text-xs mt-0.5">
                    04 Nov 2026 – 04 Nov 2026
                  </strong>
                </div>
              </div>
            </div>

            {/* Parcel Processing Summary Strip */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-700 text-center mb-3">
                PARCEL PROCESSING SUMMARY
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-300 text-center bg-white">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    DELIVERED PARCELS
                  </span>
                  <span className="text-2xl font-black text-emerald-700 block mt-1">
                    0
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-300 text-center bg-white">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                    RETURNED PARCELS
                  </span>
                  <span className="text-2xl font-black text-rose-700 block mt-1">
                    0
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-300 text-center bg-white">
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">
                    TOTAL PROCESSED
                  </span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">
                    0
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
                <div className="px-4 py-2.5 flex justify-between font-medium">
                  <span>Gross COD Collection (Delivered Parcels)</span>
                  <span className="font-semibold font-mono">Rs. 0</span>
                </div>

                <div className="px-4 py-2.5 flex justify-between text-rose-600 font-medium pl-6">
                  <span>Less: Delivery Charges (0 packages)</span>
                  <span className="font-mono">- Rs. 0</span>
                </div>

                <div className="px-4 py-3 flex justify-between bg-blue-50/60 font-black text-sm text-blue-900">
                  <span>TOTAL RECEIVABLE FROM COURIER</span>
                  <span className="font-mono">Rs. 0</span>
                </div>

                <div className="px-4 py-2.5 flex justify-between font-semibold text-emerald-700 pl-6">
                  <span>Less: Payment Received / Deposited</span>
                  <span className="font-mono">- Rs. 0</span>
                </div>

                <div className="px-4 py-3 flex justify-between bg-slate-100 font-black text-base text-slate-900">
                  <span>REMAINING DUE (CARRIED FORWARD)</span>
                  <span className="font-mono font-black text-blue-700">Rs. 0</span>
                </div>
              </div>
            </div>

            {/* Signatures Section */}
            <div className="mt-12 pt-8 border-t border-slate-300">
              <div className="grid grid-cols-2 gap-16 text-center text-xs max-w-2xl mx-auto">
                <div>
                  <div className="border-b border-slate-400 mb-2 h-14 flex items-end justify-center pb-1" />
                  <strong className="block text-slate-900 text-sm">Courier Representative</strong>
                  <span className="text-[11px] text-slate-500">Received & Acknowledged</span>
                </div>

                <div>
                  <div className="border-b border-slate-400 mb-2 h-14 flex items-end justify-center pb-1" />
                  <strong className="block text-slate-900 text-sm">{settings.signatoryNameTitle}</strong>
                  <span className="text-[11px] text-slate-500">Authorized Signatory • {settings.companyName}</span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
              <p className="font-bold tracking-wider uppercase text-slate-700">THANK YOU</p>
              <p className="text-[11px] italic max-w-xl mx-auto">{settings.billFooterNotice}</p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings updated and reflected in official settlement invoices!</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Changes saved here apply globally across all courier settlement bills.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Company & Bill Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
