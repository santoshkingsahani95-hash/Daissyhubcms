import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImportBatchDocument extends Document {
  batchId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedCount: number;
  courierBreakdown: {
    courierName: string;
    count: number;
    totalCod: number;
  }[];
  createdBy: {
    _id: mongoose.Types.ObjectId | string;
    name: string;
    username: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ImportBatchSchema = new Schema<any>(
  {
    _id: { type: String },
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fileName: { type: String, required: true },
    totalRows: { type: Number, required: true, default: 0 },
    validRows: { type: Number, required: true, default: 0 },
    invalidRows: { type: Number, required: true, default: 0 },
    importedCount: { type: Number, required: true, default: 0 },
    courierBreakdown: [
      {
        courierName: { type: String, required: true },
        count: { type: Number, required: true, default: 0 },
        totalCod: { type: Number, required: true, default: 0 },
      },
    ],
    createdBy: {
      _id: { type: Schema.Types.Mixed, ref: "User", required: true },
      name: { type: String, required: true },
      username: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export const ImportBatch: Model<IImportBatchDocument> =
  mongoose.models.ImportBatch ||
  mongoose.model<IImportBatchDocument>("ImportBatch", ImportBatchSchema);

export default ImportBatch;

