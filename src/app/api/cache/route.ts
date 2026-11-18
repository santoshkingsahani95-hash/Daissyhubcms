import { NextRequest, NextResponse } from "next/server";
import { dbCache } from "@/lib/cache-service";
import { crawlAndPreWarmCache } from "@/lib/db-service";

export async function GET(req: NextRequest) {
  try {
    const metrics = dbCache.getMetrics();
    return NextResponse.json({
      success: true,
      cacheEngine: "DaisyHub High-Speed In-Memory Object Cache & Crawler",
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error reading cache metrics";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "crawl";

    // 1. Clear All Cache
    if (action === "clear") {
      dbCache.clear();
      return NextResponse.json({
        success: true,
        message: "Database object cache cleared completely.",
        metrics: dbCache.getMetrics(),
      });
    }

    // 2. Invalidate specific namespace
    if (action === "flush_namespace") {
      const namespace = body.namespace;
      if (!namespace) {
        return NextResponse.json({ success: false, message: "Namespace parameter is required" }, { status: 400 });
      }
      dbCache.invalidateNamespace(namespace);
      return NextResponse.json({
        success: true,
        message: `Successfully flushed namespace: '${namespace}'`,
        metrics: dbCache.getMetrics(),
      });
    }

    // 3. Run Microsecond Latency Benchmark
    if (action === "benchmark") {
      const iterations = Number(body.iterations) || 1000;
      const benchmark = dbCache.runMicroBenchmark(iterations);
      return NextResponse.json({
        success: true,
        message: `Completed ${benchmark.iterations} memory lookups in ${benchmark.totalTimeMs}ms (${benchmark.avgLatencyUs} µs/op)`,
        benchmark,
        metrics: dbCache.getMetrics(),
      });
    }

    // 4. Default: Crawl & Pre-Warm Cache
    const trigger = body?.trigger || "MANUAL";
    const result = await crawlAndPreWarmCache(trigger);
    const metrics = dbCache.getMetrics();

    return NextResponse.json({
      success: result.status === "SUCCESS",
      message: `Database cache pre-warmed! Crawled ${result.count} DB objects across ${Object.keys(metrics.namespaces).length} namespaces in ${result.durationMs}ms.`,
      crawlResult: result,
      metrics,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error during cache pre-warming";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
