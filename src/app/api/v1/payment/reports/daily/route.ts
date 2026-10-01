import { handle } from "@/core/api/handler";
import { context } from "@/core/auth/session";
import { requirePermission } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { pointScope } from "@/modules/payment/services/points";
import { z } from "zod";

export const runtime = "nodejs";

const dateParam = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD")
    .optional(),
});

/**
 * GET /api/v1/payment/reports/daily?date=YYYY-MM-DD
 * Daily Summary Report grouped by PaymentPoint
 */
export async function GET(request: Request) {
  return handle(request, async () => {
    const ctx = await context();
    requirePermission(ctx, "payment.report.read");

    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const { date } = dateParam.parse(searchParams);

    const targetDate = date || new Date().toISOString().slice(0, 10);
    const startUtc = new Date(`${targetDate}T00:00:00.000+07:00`);
    const endUtc = new Date(`${targetDate}T23:59:59.999+07:00`);

    // Tenant isolated query for points
    const points = await db().paymentPoint.findMany({
      where: pointScope(ctx),
      select: {
        id: true,
        code: true,
        name: true,
        department: true,
        location: true,
        status: true,
      },
      orderBy: { code: "asc" },
    });

    // Aggregate transactions for the selected date
    const transactions = await db().paymentTransaction.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: { in: ["VERIFIED", "RECEIPTED"] },
        submittedAt: {
          gte: startUtc,
          lte: endUtc,
        },
      },
      select: {
        paymentPointId: true,
        verifiedAmount: true,
        declaredAmount: true,
      },
    });

    // Grouping calculations per payment point
    const pointStatsMap = new Map<
      string,
      { count: number; totalRevenue: number }
    >();

    let totalRevenue = 0;
    let totalTransactions = 0;

    for (const tx of transactions) {
      const amount = tx.verifiedAmount
        ? Number(tx.verifiedAmount)
        : Number(tx.declaredAmount);

      totalRevenue += amount;
      totalTransactions += 1;

      const current = pointStatsMap.get(tx.paymentPointId) || {
        count: 0,
        totalRevenue: 0,
      };
      pointStatsMap.set(tx.paymentPointId, {
        count: current.count + 1,
        totalRevenue: current.totalRevenue + amount,
      });
    }

    const pointReports = points.map((pt) => {
      const stats = pointStatsMap.get(pt.id) || { count: 0, totalRevenue: 0 };
      return {
        paymentPointId: pt.id,
        pointCode: pt.code,
        pointName: pt.name,
        department: pt.department || "-",
        location: pt.location || "-",
        status: pt.status,
        transactionCount: stats.count,
        totalRevenue: stats.totalRevenue,
      };
    });

    return {
      date: targetDate,
      totalRevenue,
      totalTransactions,
      points: pointReports,
    };
  });
}
