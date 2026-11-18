import bcrypt from "bcryptjs";
import {
  findUserByUsername,
  getCouriers,
  createCourier,
  getCompanySettings,
  crawlAndPreWarmCache,
} from "./db-service";
import { dbCache } from "./cache-service";

export async function ensureInitialSeed() {
  const admin = await findUserByUsername("admin");
  const couriers = await getCouriers();
  const settings = await getCompanySettings();

  // Pre-warm database object cache if not yet warmed
  if (!dbCache.getMetrics().isWarmed) {
    await crawlAndPreWarmCache();
  }

  return { admin: !!admin, couriersCount: couriers.length, settings };
}
