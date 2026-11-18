"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Menu,
  Search,
  PlusCircle,
  FileSpreadsheet,
  Sun,
  Moon,
  Truck,
  RotateCcw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { user, theme, toggleTheme, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/returns?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 print:hidden">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Parcel / Return Search */}
        <form onSubmit={handleSearch} className="relative hidden md:block w-72 lg:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search Mobile (Unique ID), Parcel ID, Batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action: New Parcel Entry */}
        {hasPermission("parcels:create") && (
          <Link href="/parcels/new">
            <Button size="sm" variant="primary" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Bulk Parcel Entry</span>
            </Button>
          </Link>
        )}

        {/* Quick Action: Inward Return */}
        {hasPermission("returns:manage") && (
          <Link href="/returns">
            <Button size="sm" variant="outline" className="hidden sm:inline-flex border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Inward Return</span>
            </Button>
          </Link>
        )}

        {/* In-Memory Cache Performance Badge */}
        <Link
          href="/settings#cache-engine"
          title="Database Object Cache is pre-warmed & crawling in-memory with sub-millisecond query latency"
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-xs"
        >
          <Zap className="w-3 h-3 text-amber-500 fill-amber-400 animate-pulse" />
          <span>Cache Pre-Warmed &bull; &lt;1ms</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* User Role Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            {user?.name ? user.name[0].toUpperCase() : "S"}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
              {user?.name || "Santosh Sahani"}
            </p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase">
              {user?.role || "ADMIN"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Header;
