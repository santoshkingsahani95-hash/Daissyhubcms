import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourierCompanyDocument extends Document {
  name: string;
  code?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  email?: string;
  isActive: boolean;
  serviceArea: string;
  defaultDeliveryCharge: number;
  defaultChargeInsideValley: number;
  defaultChargeOutsideValley: number;
  returnChargeInsideValley: number;
  returnChargeOutsideValley: number;
  openingBalance: number;
  currentBalance: number;
  totalParcelsDispatched: number;
  totalDelivered: number;
  totalReturned: number;
  totalCodCollected: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourierCompanySchema = new Schema<any>(
  {
    _id: { type: String },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    code: { type: String, trim: true, uppercase: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true, index: true },
    serviceArea: {
      type: String,
      default: "Inside Valley",
    },
    defaultDeliveryCharge: { type: Number, default: 70, min: 0 },
    defaultChargeInsideValley: { type: Number, default: 70, min: 0 },
    defaultChargeOutsideValley: { type: Number, default: 150, min: 0 },
    returnChargeInsideValley: { type: Number, default: 0, min: 0 },
    returnChargeOutsideValley: { type: Number, default: 0, min: 0 },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    totalParcelsDispatched: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalReturned: { type: Number, default: 0 },
    totalCodCollected: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const CourierCompany: Model<ICourierCompanyDocument> =
  mongoose.models.CourierCompany ||
  mongoose.model<ICourierCompanyDocument>("CourierCompany", CourierCompanySchema);

export default CourierCompany;
