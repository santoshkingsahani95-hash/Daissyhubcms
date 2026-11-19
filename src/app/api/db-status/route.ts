import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let mongoStatus = "disconnected";
  let host = "";
  let dbName = "";
  let error = "";
  let collections: Array<{ name: string; count: number }> = [];

  try {
    const conn = await connectDB();
    if (conn && conn.connection && conn.connection.readyState === 1) {
      mongoStatus = "connected";
      host = conn.connection.host || "";
      dbName = conn.connection.name || "";

      // List collections and counts
      if (conn.connection.db) {
        const cols = await conn.connection.db.listCollections().toArray();
        for (const col of cols) {
          const count = await conn.connection.db.collection(col.name).countDocuments();
          collections.push({ name: col.name, count });
        }
      }
    } else {
      mongoStatus = `connecting (readyState: ${conn?.connection?.readyState})`;
    }
  } catch (err: any) {
    mongoStatus = "failed";
    error = err.message || String(err);
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    status: mongoStatus === "connected" ? "ok" : "error",
    mongoStatus,
    durationMs,
    host,
    dbName,
    collections,
    error: error || undefined,
    envCheck: {
      hasEnvUri: Boolean(process.env.MONGODB_URI),
      envUriPreview: process.env.MONGODB_URI
        ? process.env.MONGODB_URI.substring(0, 25) + "..."
        : "NOT_SET_IN_VERCEL_ENV (using DEFAULT_MONGODB_URI)",
    },
  });
}
