import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReturnDocument extends Document {
  returnId: string;
  parcelId: string;
  batchId: string;
  courierId: string;
  courierName: string;
  customerName: string;
  customerPhone: string;
  codAmount: number;
  itemSku: string;
  customerAddress: string;
  deliveryCharge: number;
  returnCharge: number;
  returnReason: string;
  returnDate: string;
  processedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnSchema = new Schema<any>(
  {
    _id: { type: String },
    returnId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    parcelId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    batchId: { type: String, required: true, index: true },
    courierId: { type: String, required: true, index: true },
    courierName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    codAmount: { type: Number, default: 0 },
    itemSku: { type: String, default: "" },
    customerAddress: { type: String, default: "" },
    deliveryCharge: { type: Number, default: 0 },
    returnCharge: { type: Number, default: 0 },
    returnReason: { type: String, required: true },
    returnDate: { type: String, required: true, index: true },
    processedBy: { type: String, required: true },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const Return: Model<IReturnDocument> =
  mongoose.models.Return || mongoose.model<IReturnDocument>("Return", ReturnSchema);

export default Return;

