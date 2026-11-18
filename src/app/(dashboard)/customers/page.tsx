"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Phone,
  Package,
  CheckCircle2,
  Clock,
  RotateCcw,
  Coins,
  Eye,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ICustomer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 15;

  const loadCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCustomers(data.customers);
          setTotalRecords(data.total);
          setTotalPages(data.totalPages);
          setCurrentPage(page);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(1);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Directory & Order History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automatic mobile identification, delivery success ratios, and lifetime value
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer name or 10-digit mobile number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search Customers
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  loadCustomers(1);
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile Number (Unique ID)</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Total Orders</th>
                <th className="py-3 px-4 text-center">Delivered</th>
                <th className="py-3 px-4 text-center">Pending</th>
                <th className="py-3 px-4 text-center">Returned</th>
                <th className="py-3 px-4 text-right">Lifetime COD</th>
                <th className="py-3 px-4">Last Order</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      <Link
                        href={`/customers/${c._id}`}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400">
                      <Link
                        href={`/customers/${encodeURIComponent(c.phone)}`}
                        className="hover:underline inline-flex items-center gap-1.5"
                        title="View all parcels registered to this mobile number"
                      >
                        <Phone className="w-3 h-3 text-brand-500/70" />
                        <span>{c.phone}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {c.address}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                      {c.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">
                      {c.deliveredOrders}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">
                      {c.pendingOrders}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">
                      {c.returnedOrders}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(c.totalCodAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(c.lastOrderDate)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link href={`/customers/${c._id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          <span>History</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No customers found matching &quot;{search}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={(page) => loadCustomers(page)}
        />
      </Card>
    </div>
  );
}

