import mongoose, { Schema, Document, Model } from "mongoose";
import { PaymentMethod } from "@/types";

export interface ISettlementDocument extends Document {
  settlementNumber: string;
  settlementDate: string;
  courierId: string;
  courierName: string;
  serviceArea: string;
  startDate: string;
  endDate: string;
  deliveredParcelsCount: number;
  returnedParcelsCount: number;
  totalProcessedCount: number;
  grossCodCollection: number;
  totalAdvancePaid?: number;
  totalOrderValue?: number;
  deliveryCharges: number;
  returnCharges: number;
  currentNetReceivable: number;
  previousOutstandingDue: number;
  totalReceivable: number;
  paymentReceived: number;
  remainingDue: number;
  paymentStatus?: "Unpaid" | "Partially Paid" | "Fully Paid";
  cashReceived?: number;
  onlineReceived?: number;
  paymentInstallments?: any[];
  paymentMethod: PaymentMethod;
  paymentReference: string;
  notes?: string;
  settledParcels: string[];
  status: "Draft" | "Finalized" | "Reversed";
  preparedBy: string;
  authorizedBy: string;
  courierRepName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlementDocument>(
  {
    settlementNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    settlementDate: { type: String, required: true, index: true },
    courierId: { type: String, required: true, index: true },
    courierName: { type: String, required: true, trim: true },
    serviceArea: { type: String, default: "Inside Valley" },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    deliveredParcelsCount: { type: Number, default: 0 },
    returnedParcelsCount: { type: Number, default: 0 },
    totalProcessedCount: { type: Number, default: 0 },
    grossCodCollection: { type: Number, default: 0 },
    totalAdvancePaid: { type: Number, default: 0 },
    totalOrderValue: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    returnCharges: { type: Number, default: 0 },
    currentNetReceivable: { type: Number, default: 0 },
    previousOutstandingDue: { type: Number, default: 0 },
    totalReceivable: { type: Number, default: 0 },
    paymentReceived: { type: Number, default: 0 },
    remainingDue: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Fully Paid"],
      default: "Unpaid",
      index: true,
    },
    cashReceived: { type: Number, default: 0 },
    onlineReceived: { type: Number, default: 0 },
    paymentInstallments: [{ type: Schema.Types.Mixed }],
    paymentMethod: {
      type: String,
      default: "Bank Transfer",
    },
    paymentReference: { type: String, default: "" },
    notes: { type: String, default: "" },
    settledParcels: [{ type: String }],
    status: {
      type: String,
      enum: ["Draft", "Finalized", "Reversed"],
      default: "Finalized",
      index: true,
    },
    preparedBy: { type: String, default: "Admin" },
    authorizedBy: { type: String, default: "Santosh Mukhiya (Finance Manager)" },
    courierRepName: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const Settlement: Model<ISettlementDocument> =
  mongoose.models.Settlement ||
  mongoose.model<ISettlementDocument>("Settlement", SettlementSchema);

export default Settlement;
