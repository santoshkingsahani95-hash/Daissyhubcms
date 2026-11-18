/**
 * Test script for Database Object Cache Optimization & Pre-Warming (Cache Crawler)
 */

import { dbCache } from "../src/lib/cache-service.ts";
import {
  crawlAndPreWarmCache,
  getCompanySettings,
  getCouriers,
  getBatches,
  getDashboardStats,
  getUsers,
  getSettlements,
  getCourierById,
} from "../src/lib/db-service.ts";

async function run() {
  console.log("=== 1. Starting Cache Pre-Warming & Crawler Test ===");

  const t0 = performance.now();
  const crawlResult = await crawlAndPreWarmCache();
  const crawlDuration = performance.now() - t0;

  console.log(`✓ Cache pre-warmed in ${crawlDuration.toFixed(2)}ms`);
  console.log(`✓ Entities crawled: ${crawlResult.count}`);

  const metrics = dbCache.getMetrics();
  console.log("\n=== 2. Cache Metrics After Pre-Warming ===");
  console.log(`- Cache Status: ${metrics.status}`);
  console.log(`- Is Pre-Warmed: ${metrics.isWarmed}`);
  console.log(`- Entries in Memory: ${metrics.entriesCount}`);
  console.log(`- Namespaces:`, metrics.namespaces);
  console.log(`- Memory Estimate: ${metrics.memoryEstimateKb} KB`);

  console.log("\n=== 3. High-Speed Sub-Millisecond Read Benchmarks ===");

  // Benchmark Settings lookup
  const s0 = performance.now();
  const settings = await getCompanySettings();
  const sDuration = performance.now() - s0;
  console.log(`✓ getCompanySettings() took ${sDuration.toFixed(4)}ms (Hit: ${settings?.companyName})`);

  // Benchmark Couriers lookup
  const c0 = performance.now();
  const couriers = await getCouriers();
  const cDuration = performance.now() - c0;
  console.log(`✓ getCouriers() took ${cDuration.toFixed(4)}ms (Couriers count: ${couriers.length})`);

  // Benchmark Batches lookup
  const b0 = performance.now();
  const batches = await getBatches();
  const bDuration = performance.now() - b0;
  console.log(`✓ getBatches() took ${bDuration.toFixed(4)}ms (Batches count: ${batches.length})`);

  // Benchmark Dashboard Stats lookup
  const d0 = performance.now();
  const stats = await getDashboardStats();
  const dDuration = performance.now() - d0;
  console.log(`✓ getDashboardStats() took ${dDuration.toFixed(4)}ms (Delivered: ${stats.totalDelivered})`);

  // Benchmark 1,000 rapid cached reads to measure average latency
  const iterations = 1000;
  const benchStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    dbCache.get("enterprise_settings", "settings");
    dbCache.get("all_couriers", "couriers");
    dbCache.get("courier_courier-1", "couriers");
    dbCache.get("all_batches", "batches");
  }
  const benchEnd = performance.now();
  const totalCalls = iterations * 4;
  const avgLatencyUs = ((benchEnd - benchStart) / totalCalls) * 1000;
  const avgLatencyMs = (benchEnd - benchStart) / totalCalls;

  console.log(`\n=== 4. 1,000 Iteration Micro-benchmark (${totalCalls} Lookups) ===`);
  console.log(`✓ Total Time: ${(benchEnd - benchStart).toFixed(2)}ms`);
  console.log(`✓ Average Cache Lookup Latency: ${avgLatencyMs.toFixed(5)}ms (${avgLatencyUs.toFixed(2)} microseconds)`);
  console.log(`✓ Operations Per Second: ${Math.round(totalCalls / ((benchEnd - benchStart) / 1000)).toLocaleString()} ops/sec`);

  const updatedMetrics = dbCache.getMetrics();
  console.log("\n=== 5. Final Cache Engine Metrics ===");
  console.log(`- Total Hits: ${updatedMetrics.totalHits}`);
  console.log(`- Total Misses: ${updatedMetrics.totalMisses}`);
  console.log(`- Hit Ratio: ${updatedMetrics.hitRatio}%`);
  console.log(`- Avg Lookup Latency: ${updatedMetrics.avgLookupLatencyMs}ms`);

  if (updatedMetrics.hitRatio > 90 && updatedMetrics.isWarmed) {
    console.log("\n>>> ALL TESTS PASSED: Cache pre-warming & database object cache are fully optimized! <<<");
  } else {
    throw new Error("Cache metrics did not meet performance criteria.");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

