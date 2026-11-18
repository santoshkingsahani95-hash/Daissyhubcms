/**
 * DaisyHub Logistics - Date Filter Utilities
 * 
 * Provides local-date calculation helpers for quick filter presets:
 * - Today
 * - Yesterday
 * - 7 Days (Last 7 Days)
 */

export function formatDateToLocalString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDateToLocalString(new Date());
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToLocalString(d);
}

export function getSevenDaysAgoDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6); // 7 days inclusive including today
  return formatDateToLocalString(d);
}

export type DatePreset = "today" | "yesterday" | "7days" | "custom" | "all";

export function getDateRangeForPreset(preset: DatePreset): { startDate: string; endDate: string } {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  switch (preset) {
    case "today":
      return { startDate: today, endDate: today };
    case "yesterday":
      return { startDate: yesterday, endDate: yesterday };
    case "7days":
      return { startDate: getSevenDaysAgoDateString(), endDate: today };
    case "all":
    default:
      return { startDate: "", endDate: "" };
  }
}

export function detectActivePreset(startDate: string, endDate: string): DatePreset {
  if (!startDate && !endDate) return "all";

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const sevenDaysAgo = getSevenDaysAgoDateString();

  if (startDate === today && endDate === today) return "today";
  if (startDate === yesterday && endDate === yesterday) return "yesterday";
  if (startDate === sevenDaysAgo && endDate === today) return "7days";

  return "custom";
}
