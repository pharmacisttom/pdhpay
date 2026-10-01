import { NextResponse } from "next/server";
import { db } from "@/core/database/client";

export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET() {
  try {
    // 1. Test MySQL Database Connectivity via SELECT 1
    await db().$queryRaw`SELECT 1`;

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: `${uptimeSeconds}s`,
        database: "connected",
        service: "pdhpay-core",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message || "Database connection failed",
      },
      { status: 503 }
    );
  }
}
