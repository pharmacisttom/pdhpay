import { db } from "@/core/database/client";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { Prisma } from "@/generated/prisma/client";

export type ReceiptMeterFilter = {
  year?: number;
  ratePerReceipt?: number;
};

export function calculateBillingFee(receiptCount: number, ratePerReceipt: number = 1.0) {
  // Tiered Pricing Algorithm
  // Tier 1: 0 - 500 = 0.00 THB (Free quota)
  // Tier 2: 501 - 2,000 = ratePerReceipt (default 1.00 THB)
  // Tier 3: > 2,000 = ratePerReceipt * 0.8 (20% volume discount)
  const freeQuota = 500;
  const standardRate = ratePerReceipt;
  const discountRate = ratePerReceipt * 0.8;

  if (receiptCount <= freeQuota) {
    return { fee: 0, tier: "TIER_FREE", freeQuotaUsed: receiptCount };
  }

  const billableCount = receiptCount - freeQuota;
  if (billableCount <= 1500) {
    const fee = billableCount * standardRate;
    return { fee, tier: "TIER_STANDARD", billableCount, rate: standardRate };
  }

  const standardTierFee = 1500 * standardRate;
  const remainingCount = billableCount - 1500;
  const discountTierFee = remainingCount * discountRate;
  const totalFee = standardTierFee + discountTierFee;

  return { fee: totalFee, tier: "TIER_VOLUME_DISCOUNT", billableCount, rate: discountRate };
}

export async function getReceiptMeterData(ctx: Context, input: ReceiptMeterFilter = {}) {
  requirePermission(ctx, "payment.report.read");

  const now = new Date();
  const currentYear = input.year || now.getFullYear();
  const startDate = new Date(`${currentYear}-01-01T00:00:00Z`);
  const endDate = new Date(`${currentYear}-12-31T23:59:59Z`);

  const where: Prisma.PaymentTransactionWhereInput = {
    organizationId: ctx.organizationId,
    status: { in: ["VERIFIED", "RECEIPTED"] },
    submittedAt: { gte: startDate, lte: endDate },
  };

  // 1. Overall stats
  const totals = await db().paymentTransaction.aggregate({
    where,
    _count: true,
    _sum: { verifiedAmount: true },
  });

  const receiptedTotals = await db().paymentTransaction.aggregate({
    where: { ...where, status: "RECEIPTED" },
    _count: true,
    _sum: { verifiedAmount: true },
  });

  // 2. Fetch points for mapping
  const points = await db().paymentPoint.findMany({
    where: { organizationId: ctx.organizationId },
    select: { id: true, name: true, code: true, department: true },
  });
  const pointMap = new Map(points.map((p) => [p.id, p]));

  // 3. Group by Point
  const pointGroups = await db().paymentTransaction.groupBy({
    by: ["paymentPointId"],
    where: { ...where, status: "RECEIPTED" },
    _count: true,
    _sum: { verifiedAmount: true },
  });

  const rate = input.ratePerReceipt || 1.0;
  const zero = new Prisma.Decimal(0);

  const pointBreakdown = pointGroups.map((pg) => {
    const pt = pointMap.get(pg.paymentPointId);
    const count = pg._count;
    const amount = pg._sum.verifiedAmount ?? zero;
    const feeCalculation = calculateBillingFee(count, rate);

    return {
      pointId: pg.paymentPointId,
      pointCode: pt?.code || "N/A",
      pointName: pt?.name || "ไม่ระบุจุดชำระ",
      department: pt?.department || "การเงิน",
      receiptCount: count,
      verifiedAmount: amount.toFixed(2),
      estimatedFee: feeCalculation.fee.toFixed(2),
    };
  });

  // 4. Group by Month
  const allTxInYear = await db().paymentTransaction.findMany({
    where: { ...where, status: "RECEIPTED" },
    select: { submittedAt: true, verifiedAmount: true },
  });

  const monthlyMap = new Map<string, { count: number; amount: Prisma.Decimal }>();
  for (let m = 1; m <= 12; m++) {
    const key = `${currentYear}-${String(m).padStart(2, "0")}`;
    monthlyMap.set(key, { count: 0, amount: new Prisma.Decimal(0) });
  }

  for (const tx of allTxInYear) {
    const monthKey = tx.submittedAt.toISOString().slice(0, 7);
    const existing = monthlyMap.get(monthKey);
    if (existing) {
      existing.count += 1;
      existing.amount = existing.amount.add(tx.verifiedAmount ?? zero);
    }
  }

  const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([yearMonth, val]) => {
    const feeCalc = calculateBillingFee(val.count, rate);
    return {
      yearMonth,
      receiptCount: val.count,
      totalAmount: val.amount.toFixed(2),
      estimatedFee: feeCalc.fee.toFixed(2),
    };
  });

  const overallFee = calculateBillingFee(receiptedTotals._count, rate);

  return {
    year: currentYear,
    ratePerReceipt: rate,
    totalVerifiedCount: totals._count,
    totalReceiptedCount: receiptedTotals._count,
    totalVerifiedAmount: (totals._sum.verifiedAmount ?? zero).toFixed(2),
    totalReceiptedAmount: (receiptedTotals._sum.verifiedAmount ?? zero).toFixed(2),
    totalEstimatedBillingFee: overallFee.fee.toFixed(2),
    freeQuota: 500,
    pointBreakdown,
    monthlyBreakdown,
  };
}
