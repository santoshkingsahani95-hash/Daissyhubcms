import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole, PermissionKey } from "@/types";

export interface IUserDocument extends Document {
  name: string;
  username: string;
  passwordHash: string;
  email?: string;
  phone?: string;
  role: UserRole;
  permissions: PermissionKey[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<any>(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["admin", "superadmin", "staff"],
      default: "admin",
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: { type: Boolean, default: true, index: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
