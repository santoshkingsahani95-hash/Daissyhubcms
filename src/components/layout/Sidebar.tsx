"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  LayoutDashboard,
  PlusCircle,
  Boxes,
  Truck,
  RotateCcw,
  Building2,
  Receipt,
  CreditCard,
  BookOpen,
  BarChart3,
  FileSpreadsheet,
  Users2,
  Settings,
  LogOut,
  X,
  Shield,
  Layers,
} from "lucide-react";
import { PermissionKey } from "@/types";

interface NavItemConfig {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: PermissionKey;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: "dashboard:view",
  },
  {
    label: "New Parcel Entry",
    href: "/parcels/new",
    icon: PlusCircle,
    permission: "parcels:create",
    badge: "BULK",
    badgeColor: "bg-blue-600 text-white",
  },
  {
    label: "Parcel Batches",
    href: "/batches",
    icon: Boxes,
    permission: "batches:manage",
  },
  {
    label: "Delivery Updates",
    href: "/delivery-updates",
    icon: Truck,
    permission: "delivery:update",
  },
  {
    label: "Return Management",
    href: "/returns",
    icon: RotateCcw,
    permission: "returns:manage",
    badge: "INWARD",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  },
  {
    label: "Courier Info Management",
    href: "/couriers",
    icon: Building2,
    permission: "couriers:manage",
  },
  {
    label: "COD Settlements",
    href: "/settlements",
    icon: Receipt,
    permission: "settlements:view",
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    permission: "payments:manage",
  },
  {
    label: "Courier Ledger",
    href: "/ledger",
    icon: BookOpen,
    permission: "ledger:view",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: "reports:view",
  },
  {
    label: "Import / Export",
    href: "/import-export",
    icon: FileSpreadsheet,
    permission: "parcels:import",
  },
  {
    label: "User Management",
    href: "/users",
    icon: Users2,
    permission: "users:manage",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    permission: "settings:manage",
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight block">
                Courier Hub
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider block">
                COD Settlement Pro
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Navigation Menu
          </div>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                      }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${item.badgeColor || "bg-blue-600 text-white"
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                {user?.name
                  ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                  : "SA"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user?.name || "Santosh Sahani (Admin)"}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <Shield className="w-2.5 h-2.5" />
                  <span className="uppercase tracking-wider">
                    {user?.role || "ADMIN"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;
