import React from "react";
import { Badge } from "./Badge";
import { ParcelStatus } from "@/types";

interface ParcelStatusBadgeProps {
  status: ParcelStatus | string;
  className?: string;
  size?: "sm" | "md";
}

export function ParcelStatusBadge({
  status,
  className,
  size = "md",
}: ParcelStatusBadgeProps) {
  let variant: "default" | "success" | "warning" | "danger" | "info" | "purple" = "default";

  switch (status) {
    case "Delivered":
      variant = "success";
      break;
    case "With Courier":
      variant = "info";
      break;
    case "Delivery Attempt Failed":
    case "Return Initiated":
      variant = "warning";
      break;
    case "Returned to Warehouse":
      variant = "danger";
      break;
    case "Pending Verification":
      variant = "purple";
      break;
    default:
      variant = "default";
  }

  return (
    <Badge variant={variant} size={size} className={className}>
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          variant === "success"
            ? "bg-emerald-500"
            : variant === "warning"
            ? "bg-amber-500"
            : variant === "danger"
            ? "bg-rose-500"
            : variant === "info"
            ? "bg-blue-500"
            : variant === "purple"
            ? "bg-purple-500"
            : "bg-slate-400"
        }`}
      />
      {status}
    </Badge>
  );
}

export default ParcelStatusBadge;
