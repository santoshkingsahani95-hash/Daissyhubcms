import mongoose, { Schema, Document, Model } from "mongoose";
import { PaymentMethod } from "@/types";

export interface IPaymentDocument extends Document {
  paymentNumber: string;
  courierId: string;
  courierName: string;
  settlementId?: string;
  settlementNumber?: string;
  amount: number;
  cashAmount?: number;
  onlineAmount?: number;
  onlineMethod?: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receiptUrl?: string;
  remarks?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    courierId: { type: String, required: true, index: true },
    courierName: { type: String, required: true, trim: true },
    settlementId: { type: String, index: true },
    settlementNumber: { type: String },
    amount: { type: Number, required: true, min: 0 },
    cashAmount: { type: Number, default: 0 },
    onlineAmount: { type: Number, default: 0 },
    onlineMethod: { type: String, default: "Bank Transfer" },
    paymentDate: { type: String, required: true, index: true },
    paymentMethod: {
      type: String,
      enum: [
        "Bank Transfer",
        "Cash",
        "Split (Cash + Online)",
        "Cheque",
        "Digital Wallet",
        "Esewa",
        "Khalti",
        "ConnectIPS",
        "Other",
      ],
      default: "Bank Transfer",
    },
    referenceNumber: { type: String, default: "", trim: true },
    receiptUrl: { type: String },
    remarks: { type: String, trim: true },
    recordedBy: { type: String, default: "Admin" },
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPaymentDocument> =
  mongoose.models.Payment || mongoose.model<IPaymentDocument>("Payment", PaymentSchema);

export default Payment;

