import { NextRequest } from "next/server";
import mongoose from "mongoose";
import ActivityLog from "@/models/ActivityLog";
import connectDB from "./mongodb";
import { SessionUser } from "./auth";

interface LogActivityParams {
  user: SessionUser | { userId: string; name: string; username: string; role: string };
  action: string;
  details: string;
  relatedRecordId?: string;
  req?: NextRequest;
}

export async function logActivity({
  user,
  action,
  details,
  relatedRecordId,
  req,
}: LogActivityParams): Promise<void> {
  try {
    await connectDB();

    let ipAddress = "unknown";
    if (req) {
      ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
    }

    const userId =
      "userId" in user
        ? new mongoose.Types.ObjectId(user.userId)
        : new mongoose.Types.ObjectId();

    await ActivityLog.create({
      user: {
        _id: userId,
        name: user.name,
        username: user.username,
        role: user.role,
      },
      action,
      details,
      relatedRecordId,
      ipAddress,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't crash main transaction on audit log failure
  }
}

