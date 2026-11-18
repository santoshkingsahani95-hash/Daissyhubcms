import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerDocument extends Document {
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  totalCodAmount: number;
  firstOrderDate: Date;
  lastOrderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    address: { type: String, required: true, trim: true },
    totalOrders: { type: Number, default: 0 },
    deliveredOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    returnedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    totalCodAmount: { type: Number, default: 0 },
    firstOrderDate: { type: Date, default: Date.now },
    lastOrderDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer ||
  mongoose.model<ICustomerDocument>("Customer", CustomerSchema);

export default Customer;

