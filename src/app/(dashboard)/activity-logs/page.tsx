"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  RotateCw,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  User,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { IActivityLog } from "@/types";
import { DateQuickFilter } from "@/components/ui/DateQuickFilter";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const pageSize = 25;

  const filteredLogs = logs.filter((log) => {
    if (startDate) {
      const logDate = log.createdAt.slice(0, 10);
      if (logDate < startDate) return false;
    }
    if (endDate) {
      const logDate = log.createdAt.slice(0, 10);
      if (logDate > endDate) return false;
    }
    return true;
  });

  const loadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activity-logs?page=${page}&limit=${pageSize}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
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
    loadLogs(1);
  }, []);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("LOGIN") || action.includes("CREATED") || action.includes("ADDED")) {
      return "success";
    }
    if (action.includes("CANCELLED") || action.includes("DEACTIVATED") || action.includes("DELETED")) {
      return "danger";
    }
    if (action.includes("UPDATED") || action.includes("STATUS")) {
      return "info";
    }
    return "default";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Security & Audit Activity Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable audit trail of staff actions, logins, status updates, bulk imports, and settlements
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => loadLogs(currentPage)}
          isLoading={loading}
          className="h-9"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Filter by Date:</span>
          <DateQuickFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>

        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Clear Date Filter
          </button>
        )}
      </div>

      {/* Activity Logs Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator / Staff</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Record Ref #</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {formatDate(log.createdAt, true)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {log.user?.name || log.user?.username || "System"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default" size="sm">
                        {log.user?.role || "Staff"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-brand-600">
                      {log.relatedRecordId || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-sm">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No activity logs recorded yet.
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
          onPageChange={(page) => loadLogs(page)}
        />
      </Card>
    </div>
  );
}

