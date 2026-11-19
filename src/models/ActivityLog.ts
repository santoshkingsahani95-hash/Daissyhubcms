import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLogDocument extends Document {
  user: {
    _id: mongoose.Types.ObjectId | string;
    name: string;
    username: string;
    role: string;
  };
  action: string;
  details: string;
  relatedRecordId?: string;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<any>(
  {
    _id: { type: String },
    user: {
      _id: { type: Schema.Types.Mixed, ref: "User", required: true },
      name: { type: String, required: true },
      username: { type: String, required: true },
      role: { type: String, required: true },
    },
    action: { type: String, required: true, index: true },
    details: { type: String, required: true },
    relatedRecordId: { type: String, index: true },
    ipAddress: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivityLogSchema.index({ "user._id": 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog: Model<IActivityLogDocument> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLogDocument>("ActivityLog", ActivityLogSchema);

export default ActivityLog;

