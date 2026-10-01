import { handle, body } from "@/core/api/handler";
import { context } from "@/core/auth/session";
import { requirePermission } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { pointInput } from "@/modules/payment/validators";
import { savePoint, pointScope } from "@/modules/payment/services/points";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * GET /api/v1/payment/points
 * List all tenant-isolated payment points
 */
export async function GET(request: Request) {
  return handle(request, async () => {
    const ctx = await context();
    requirePermission(ctx, "payment.point.read");

    const p = z
      .object({
        page: z.coerce.number().int().min(1).max(10000).default(1),
        q: z.string().max(100).default(""),
      })
      .strict()
      .parse(Object.fromEntries(new URL(request.url).searchParams));

    const where = {
      ...pointScope(ctx),
      name: { contains: p.q },
    };

    const items = await db().paymentPoint.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        department: true,
        location: true,
        status: true,
        bankAccountId: true,
        bankAccount: { select: { bankName: true, accountNumber: true, active: true } },
        updatedAt: true,
      },
      orderBy: { code: "asc" },
      skip: (p.page - 1) * 20,
      take: 20,
    });

    const total = await db().paymentPoint.count({ where });

    return {
      items,
      total,
      page: p.page,
    };
  });
}

/**
 * POST /api/v1/payment/points
 * Create a new payment point (RBAC: payment.point.create)
 */
export async function POST(request: Request) {
  return handle(request, async (requestId) => {
    const ctx = await context();
    requirePermission(ctx, "payment.point.create");
    const input = await body(request, pointInput);
    return savePoint(ctx, input, undefined, requestId);
  });
}
