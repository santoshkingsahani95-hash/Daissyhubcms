import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBatchDocument extends Document {
  batchId: string;
  courierId: string;
  courierName: string;
  dispatchDate: string;
  serviceArea?: string;
  notes?: string;
  totalParcels: number;
  totalCodAmount: number;
  totalAdvancePaid?: number;
  totalDeliveryCharges: number;
  deliveredCount: number;
  failedCount: number;
  returnedCount: number;
  pendingCount: number;
  status: "Active" | "Closed" | "Settled";
  createdBy?: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatchDocument>(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    courierId: { type: String, required: true, index: true },
    courierName: { type: String, required: true, trim: true },
    dispatchDate: { type: String, required: true, index: true },
    serviceArea: {
      type: String,
      default: "Inside Valley",
    },
    notes: { type: String, trim: true },
    totalParcels: { type: Number, default: 0 },
    totalCodAmount: { type: Number, default: 0 },
    totalAdvancePaid: { type: Number, default: 0 },
    totalDeliveryCharges: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    returnedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Closed", "Settled"],
      default: "Active",
      index: true,
    },
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

export const Batch: Model<IBatchDocument> =
  mongoose.models.Batch || mongoose.model<IBatchDocument>("Batch", BatchSchema);

export default Batch;

