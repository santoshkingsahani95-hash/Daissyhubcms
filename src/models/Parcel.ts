import mongoose, { Schema, Document, Model } from "mongoose";
import { DeliveryArea, ParcelStatus, FailureReason, IStatusHistoryItem } from "@/types";

export interface IParcelDocument extends Document {
  parcelId: string;
  batchId: string;
  courierId: string;
  courierName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryArea?: string;
  itemSku: string;
  codAmount: number;
  advancePayment?: number;
  deliveryCharge: number;
  remarks?: string;
  status: ParcelStatus;
  dispatchDate: string;
  deliveredDate?: string;
  returnDate?: string;
  returnReason?: string;
  returnedProcessedBy?: string;
  failureReason?: FailureReason | string;
  statusHistory: IStatusHistoryItem[];
  isSettled: boolean;
  settlementId?: string;
  settlementNumber?: string;
  settlementDate?: string;
  createdBy?: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ParcelSchema = new Schema<IParcelDocument>(
  {
    parcelId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    batchId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    courierId: {
      type: String,
      required: true,
      index: true,
    },
    courierName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true, index: true },
    customerAddress: { type: String, default: "", trim: true },
    deliveryArea: {
      type: String,
      default: "Inside Valley",
    },
    itemSku: { type: String, default: "", trim: true },
    codAmount: { type: Number, required: true, min: 0 },
    advancePayment: { type: Number, default: 0, min: 0 },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        "With Courier",
        "Delivered",
        "Delivery Attempt Failed",
        "Return Initiated",
        "Returned to Warehouse",
        "Pending Verification",
      ],
      default: "With Courier",
      index: true,
    },
    dispatchDate: { type: String, required: true, index: true },
    deliveredDate: { type: String },
    returnDate: { type: String },
    returnReason: { type: String },
    returnedProcessedBy: { type: String },
    failureReason: { type: String },
    statusHistory: [
      {
        previousStatus: { type: String },
        newStatus: { type: String, required: true },
        timestamp: { type: String, required: true },
        updatedBy: { type: String, required: true },
        reason: { type: String },
        remarks: { type: String },
      },
    ],
    isSettled: { type: Boolean, default: false, index: true },
    settlementId: { type: String, index: true },
    settlementNumber: { type: String },
    settlementDate: { type: String },
    createdBy: {
      _id: { type: String },
      name: { type: String },
      username: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const Parcel: Model<IParcelDocument> =
  mongoose.models.Parcel || mongoose.model<IParcelDocument>("Parcel", ParcelSchema);

export default Parcel;
