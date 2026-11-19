import mongoose, { Schema, Document, Model } from "mongoose";
import { LedgerTransactionType } from "@/types";

export interface ICourierLedgerEntryDocument extends Document {
  ledgerId: string;
  courierId: string;
  courierName: string;
  transactionDate: string;
  transactionType: LedgerTransactionType;
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourierLedgerEntrySchema = new Schema<any>(
  {
    _id: { type: String },
    ledgerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    courierId: { type: String, required: true, index: true },
    courierName: { type: String, required: true, trim: true },
    transactionDate: { type: String, required: true, index: true },
    transactionType: {
      type: String,
      enum: [
        "Opening Balance",
        "Delivered COD",
        "Delivery Charge",
        "Return Charge",
        "Payment Received",
        "Settlement",
        "Adjustment",
      ],
      required: true,
      index: true,
    },
    referenceNumber: { type: String, default: "", trim: true },
    description: { type: String, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    runningBalance: { type: Number, default: 0 },
    createdBy: { type: String, default: "System" },
  },
  {
    timestamps: true,
  }
);

export const CourierLedgerEntry: Model<ICourierLedgerEntryDocument> =
  mongoose.models.CourierLedgerEntry ||
  mongoose.model<ICourierLedgerEntryDocument>("CourierLedgerEntry", CourierLedgerEntrySchema);

export default CourierLedgerEntry;

