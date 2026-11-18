# DaisyHub Courier Management & COD Settlement System
**Enterprise Logistics & Cash-on-Delivery Reconciliation ERP for DaisyHub E-Commerce Pvt. Ltd.**

Designed and built for high-volume parcel dispatch, delivery reconciliation, physical warehouse returns inwarding, and double-entry courier ledger accounting.

---

## 🚀 Key Modules & Architecture

The application implements all 13 required modules with real database backing:

1. **Dashboard (`/`)**
   - 7 Key Performance Indicators (Parcels Dispatched Today, Delivered Today, Failed/Pending Returns, Returned to Warehouse, Gross COD Collected, Net Receivable from Couriers, Outstanding Balance).
   - Date range and courier filtering.
   - Courier performance comparison table with completion rates.
   - Real-time parcel and batch activity feeds.

2. **New Parcel Entry (`/parcels/new`, `/new-entry`)** — *Matches Screenshot 1*
   - Fast-paced spreadsheet interface supporting 100–300+ continuous entries.
   - Courier Service selection with live Inside Valley / Outside Valley rate badges.
   - Auto-generated Dispatch Date & Batch ID (e.g. `BAT-20261104-001`).
   - Quick row additions: **+1 Row**, **+10 Rows**, **+50 Rows**, **+100 Rows**.
   - Keyboard navigation using **Tab** and **Enter** for fast auto-advancement.
   - Excel clipboard paste modal with auto-column mapping.
   - Real-time duplicate phone number warnings without blocking input.
   - Sticky live calculation summary footer: Entries count, Total COD, Estimated Delivery Charge, Estimated Net COD.
   - **Crucial Rule**: Dispatched parcels receive initial status **`With Courier`** (never automatically marked as delivered). Preserves dispatch delivery charges.

3. **Parcel Batches (`/batches`)**
   - Central manifest management.
   - Detailed batch breakdown: Total Dispatched, Delivered, Failed, Returned, Awaiting Delivery Update.
   - Manifest view modal and printable dispatch manifest.

4. **Delivery Updates (`/delivery-updates`)**
   - Reconciliation interface when couriers report daily delivery logs.
   - Courier and batch filter with live batch progress bar.
   - Individual or bulk parcel status updates.
   - Failed delivery tagging with official reasons: *Customer did not answer*, *Wrong phone number*, *Customer rejected parcel*, *Customer unavailable*, *Address not found*, *Other*.

5. **Return Management (`/returns`)**
   - Dedicated physical warehouse return inwarding module.
   - Fast multi-criteria search by Parcel ID, Customer Name, Mobile Number, Batch ID, or Courier.
   - Displays all 10 original dispatch verification fields.
   - Pre-confirmation modal to prevent duplicate return processing.
   - **Crucial Rule**: Updates original parcel record in-place to **`Returned to Warehouse`**, logging return date, reason, and receiving staff while preserving the original batch linkage.

6. **Courier Management (`/couriers`, `/couriers/[id]`)**
   - Add/edit courier companies with representative contact person and phone.
   - Independent rate matrices for **Inside Valley** and **Outside Valley** delivery rates.
   - Configurable **Return Charges** for both Inside and Outside Valley.
   - Outstanding balances and active/inactive status toggle.
   - Direct shortcuts to Courier Ledger and Settlement generation.

7. **COD Settlements (`/settlements`, `/settlements/[id]`)** — *Matches Screenshot 3*
   - Settlement calculation wizard with period dates and multi-batch inclusion.
   - **Strict Accounting Formula**:
     $$\text{Gross COD Collection} - \text{Delivery Charges} - \text{Return Charges} = \text{Current Net Receivable}$$
     $$\text{Current Net Receivable} + \text{Previous Outstanding Due} = \text{Total Receivable from Courier}$$
     $$\text{Total Receivable from Courier} - \text{Payment Received} = \text{Remaining Due (Carried Forward)}$$
   - Parcel lock mechanism upon settlement finalization.
   - Automatically posts double-entry transaction to Courier Ledger.
   - A4 printable settlement statement with authorized signatures, NPR formatting, and print-friendly CSS hiding UI buttons and headers.

8. **Payments (`/payments`)**
   - Courier remittance recording (Cash, Bank Transfer, Cheque, Digital Wallet).
   - Deposit receipts, reference numbers, and real-time ledger updates.

9. **Courier Ledger (`/ledger`)**
   - Complete double-entry running balance ledger for each partner courier.
   - Tracks Opening Balance, Delivered COD, Delivery Fees, Return Charges, Payments Received, and Closing Balance.
   - Searchable, date-filterable, with CSV export.

10. **Reports (`/reports`)**
    - 9 comprehensive reports:
      - Daily Dispatch Summary
      - Delivery Performance Report
      - Return Rate Analysis
      - Courier Comparison Matrix
      - COD Collection Report
      - Outstanding Courier Balances
      - Failure Reasons Breakdown
      - Area-wise Delivery Report
      - Financial Reconciliation Summary
    - CSV and Excel export.

11. **Import / Export (`/import-export`)**
    - Downloadable Excel parcel dispatch template.
    - Chunked Excel import with error reporting.
    - Full system CSV backups for Parcels and Settlements.

12. **User Management (`/users`)**
    - Multi-user authentication with **Admin** and **Staff** roles.
    - Granular permission matrix across all 13 modules.

13. **Settings (`/settings`)** — *Matches Screenshot 2*
    - Enterprise billing identity: Company Name, PAN/VAT Number (`609876543`), Corporate Address, Phones, Statement Email, Signatory Name (`Santosh Mukhiya (Finance Manager)`), and Legal Bill Footer Notice.
    - Live bill preview matching the printed settlement invoice.

---

## 🔑 Default Credentials

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`admin123`** | Admin | Full Administrative Access |
| **`staff`** | **`staff123`** | Staff | Dispatch, Delivery Updates, Inward Returns, Tracking |

---

## 🛠 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React
- **Data Layer**: Dual-Mode Architecture:
  - Connects to MongoDB via Mongoose when reachable.
  - Automatically falls back to persistent local storage (`.data/db.json`) during offline or sandboxed operation with 100% data durability.
- **Reporting & Export**: ExcelJS, jsPDF, Recharts

---

## 💻 Running the Application

### 1. Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build & Start
```bash
npm run build
npm start
```

### 3. Verify System Test
```bash
node scripts/verify-full-system.mjs
```
Validates all 6 core workflows: Settings, Batch Dispatch, Delivery Updates, Inward Returns, COD Settlement Math, and Courier Ledger Running Balance.

