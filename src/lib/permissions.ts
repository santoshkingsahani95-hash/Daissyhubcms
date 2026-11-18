import { PermissionKey, IUser } from "@/types";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: "Dashboard" | "Parcels" | "Returns" | "Couriers" | "Settlements" | "Reports" | "Administration";
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: "dashboard:view",
    label: "View Dashboard",
    category: "Dashboard",
    description: "Access main dashboard and real-time business statistics",
  },
  {
    key: "parcels:create",
    label: "New Parcel Entry",
    category: "Parcels",
    description: "Create new batch and enter bulk parcels",
  },
  {
    key: "parcels:edit",
    label: "Edit Parcels",
    category: "Parcels",
    description: "Modify parcel details, addresses, and tracking status",
  },
  {
    key: "parcels:delete",
    label: "Delete Parcels",
    category: "Parcels",
    description: "Remove parcels before dispatch",
  },
  {
    key: "parcels:import",
    label: "Import / Export",
    category: "Parcels",
    description: "Bulk import/export Excel and CSV manifests",
  },
  {
    key: "batches:manage",
    label: "Manage Batches",
    category: "Parcels",
    description: "View and manage parcel batches and manifests",
  },
  {
    key: "delivery:update",
    label: "Delivery Updates",
    category: "Parcels",
    description: "Reconcile courier delivery results and mark delivered/failed",
  },
  {
    key: "returns:manage",
    label: "Return Management",
    category: "Returns",
    description: "Search, verify and inward physical warehouse returns",
  },
  {
    key: "couriers:manage",
    label: "Manage Courier Companies",
    category: "Couriers",
    description: "Add, edit, activate/deactivate courier companies and pricing",
  },
  {
    key: "settlements:view",
    label: "View Settlements",
    category: "Settlements",
    description: "Access courier COD settlement statements and history",
  },
  {
    key: "settlements:manage",
    label: "Manage COD Settlements",
    category: "Settlements",
    description: "Generate, calculate and finalize courier COD settlements",
  },
  {
    key: "payments:manage",
    label: "Manage Payments",
    category: "Settlements",
    description: "Record and manage courier payments and deposits",
  },
  {
    key: "ledger:view",
    label: "View Courier Ledger",
    category: "Settlements",
    description: "View running financial ledger and journal entries",
  },
  {
    key: "reports:view",
    label: "View Reports",
    category: "Reports",
    description: "Access comprehensive parcel, courier, and financial reports",
  },
  {
    key: "reports:export",
    label: "Export Reports",
    category: "Reports",
    description: "Export reports to Excel and PDF formats",
  },
  {
    key: "users:manage",
    label: "Manage Staff & Users",
    category: "Administration",
    description: "Create and deactivate staff accounts, customize permissions",
  },
  {
    key: "settings:manage",
    label: "Manage System Settings",
    category: "Administration",
    description: "Change enterprise billing, PAN/VAT, and courier rates",
  },
];

export function hasPermission(
  user: { role: string; permissions?: PermissionKey[] } | null | undefined,
  requiredPermission?: PermissionKey
): boolean {
  if (!user) return false;
  // Admin and Superadmin have full unconstrained access
  if (user.role === "admin" || user.role === "superadmin") return true;
  if (!requiredPermission) return true;
  return user.permissions?.includes(requiredPermission) ?? false;
}
