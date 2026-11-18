import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DaisyHub | Courier Management & COD Settlement System",
  description:
    "Comprehensive enterprise Multi-Courier Management, Bulk Parcel Entry, COD Remittance, and Financial Accounting ERP for DaisyHub E-Commerce Pvt. Ltd.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <AuthProvider>
          <ToastProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
