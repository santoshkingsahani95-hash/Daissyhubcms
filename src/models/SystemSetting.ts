import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemSettingDocument extends Document {
  companyName: string;
  panVatNumber: string;
  corporateAddress: string;
  phones: string;
  email: string;
  signatoryNameTitle: string;
  billFooterNotice: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  defaultChargeInsideValley: number;
  defaultChargeOutsideValley: number;
  defaultReturnChargeInsideValley: number;
  defaultReturnChargeOutsideValley: number;
  updatedBy?: {
    _id: string;
    name: string;
  };
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSettingDocument>(
  {
    companyName: {
      type: String,
      default: "DaisyHub E-Commerce Pvt. Ltd.",
      required: true,
    },
    panVatNumber: { type: String, default: "609876543" },
    corporateAddress: {
      type: String,
      default: "New Baneshwor, Kathmandu, Nepal",
      required: true,
    },
    phones: { type: String, default: "+977-1-4789012 / 9801122334" },
    email: { type: String, default: "accounts@garmentsnepal.com" },
    signatoryNameTitle: {
      type: String,
      default: "Santosh Mukhiya (Finance Manager)",
    },
    billFooterNotice: {
      type: String,
      default:
        "This is a computer-generated courier settlement statement. For any queries, contact accounts department within 7 business days.",
    },
    currency: { type: String, default: "NPR" },
    currencySymbol: { type: String, default: "Rs." },
    dateFormat: { type: String, default: "YYYY-MM-DD" },
    defaultChargeInsideValley: { type: Number, default: 70 },
    defaultChargeOutsideValley: { type: Number, default: 150 },
    defaultReturnChargeInsideValley: { type: Number, default: 35 },
    defaultReturnChargeOutsideValley: { type: Number, default: 75 },
    updatedBy: {
      _id: { type: String },
      name: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting: Model<ISystemSettingDocument> =
  mongoose.models.SystemSetting ||
  mongoose.model<ISystemSettingDocument>("SystemSetting", SystemSettingSchema);

export default SystemSetting;
