"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  // Global print listener: Suppress page title from printed invoices and bills
  useEffect(() => {
    let originalTitle = "";
    const handleBeforePrint = () => {
      originalTitle = document.title;
      document.title = "";
    };
    const handleAfterPrint = () => {
      if (originalTitle) {
        document.title = originalTitle;
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0F172A",
          color: "#F8FAFC",
          fontSize: "14px",
          fontWeight: 500,
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: "#FFFFFF",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#FFFFFF",
          },
        },
      }}
    />
  );
}

