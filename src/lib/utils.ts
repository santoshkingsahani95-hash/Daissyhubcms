import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  const val = Number(amount) || 0;
  return `Rs. ${val.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(
  dateInput: string | Date | undefined | null,
  includeTime = false
): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  if (!includeTime) {
    return `${day} ${month} ${year}`;
  }

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = String(hours).padStart(2, "0");

  return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
}

export function generateOrderId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `APX-${year}${month}${day}-${randomPart}`;
}

export function generateSettlementId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `SET-${year}${month}${day}-${randomPart}`;
}

export function getCourierBatchPrefix(courierName?: string): string {
  if (!courierName) return "GE";
  const clean = courierName.trim().replace(/\(.*?\)/g, "").trim();

  // If passed an ID like "courier-1732085732104" or 24-hex MongoDB ObjectId, do not treat it as a name
  if (clean.toLowerCase().startsWith("courier-") || /^[0-9a-fA-F]{24}$/.test(clean)) {
    return "GE";
  }

  const lower = clean.toLowerCase();

  // Known specific courier prefixes
  if (lower.startsWith("google express")) return "GE";
  if (lower.startsWith("sp express")) return "SE";
  if (lower.startsWith("kdm express") || lower.startsWith("kdm")) return "KE";
  if (lower.startsWith("nepal can move") || lower.startsWith("ncm")) return "NCM";
  if (lower.startsWith("pathao")) return "PT";
  if (lower.startsWith("sundar")) return "SN";

  // General rule: take first letters of each word (e.g. Google Express -> G + E = GE)
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const initials = words.map((w) => w[0].toUpperCase()).join("");
    return initials.length > 4 ? initials.slice(0, 3) : initials;
  } else if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return "GE";
}

export function generateBatchId(courierName?: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(100 + Math.random() * 900);
  const prefix = getCourierBatchPrefix(courierName);
  return `${prefix}-${dateStr}-${randomPart}`;
}

