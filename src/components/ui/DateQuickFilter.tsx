"use client";

import React from "react";
import { Calendar, X } from "lucide-react";
import {
  DatePreset,
  detectActivePreset,
  getDateRangeForPreset,
} from "@/lib/date-utils";

interface DateQuickFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string, preset: DatePreset) => void;
  showCustomInputs?: boolean;
  className?: string;
  compact?: boolean;
}

export function DateQuickFilter({
  startDate,
  endDate,
  onDateChange,
  showCustomInputs = true,
  className = "",
  compact = false,
}: DateQuickFilterProps) {
  const activePreset = detectActivePreset(startDate, endDate);

  const handlePresetSelect = (preset: DatePreset) => {
    const range = getDateRangeForPreset(preset);
    onDateChange(range.startDate, range.endDate, preset);
  };

  const handleStartChange = (val: string) => {
    onDateChange(val, endDate, "custom");
  };

  const handleEndChange = (val: string) => {
    onDateChange(startDate, val, "custom");
  };

  const handleReset = () => {
    onDateChange("", "", "all");
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
      {/* Quick Option Pills: Today, Yesterday, 7 Days */}
      <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
        <button
          type="button"
          onClick={() => handlePresetSelect("today")}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            activePreset === "today"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => handlePresetSelect("yesterday")}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            activePreset === "yesterday"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Yesterday
        </button>

        <button
          type="button"
          onClick={() => handlePresetSelect("7days")}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            activePreset === "7days"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          7 Days
        </button>

        {activePreset !== "all" && (
          <button
            type="button"
            onClick={handleReset}
            title="Clear date filter"
            className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-0.5"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">All</span>
          </button>
        )}
      </div>

      {/* Date Pickers for Custom Range */}
      {showCustomInputs && (
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="pl-8 pr-2 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Start Date"
            />
          </div>
          <span className="text-slate-400 text-xs font-medium">to</span>
          <div className="relative flex items-center">
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndChange(e.target.value)}
              className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="End Date"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DateQuickFilter;
