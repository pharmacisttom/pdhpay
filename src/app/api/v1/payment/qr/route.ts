import { handle, body } from "@/core/api/handler";
import { context } from "@/core/auth/session";
import { requirePermission } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { generatePointPromptPayQr } from "@/modules/payment/services/promptpay";
import { pointScope } from "@/modules/payment/services/points";
import { z } from "zod";

export const runtime = "nodejs";

const qrGenerateInput = z.object({
  paymentPointId: z.string().uuid("รหัสจุดชำระไม่ถูกต้อง"),
  amount: z.coerce.number().positive().optional(),
});

/**
 * GET /api/v1/payment/qr
 * Fetch list of active payment points for current tenant
 */
export async function GET(request: Request) {
  return handle(request, async () => {
    const ctx = await context();
    requirePermission(ctx, "payment.point.read");

    const points = await db().paymentPoint.findMany({
      where: pointScope(ctx),
      select: {
        id: true,
        code: true,
        name: true,
        department: true,
        location: true,
        status: true,
        qrToken: true,
        bankAccount: { select: { bankName: true, accountNumber: true, active: true } },
      },
      orderBy: [{ status: "asc" }, { code: "asc" }],
      take: 200,
    });

    return { points };
  });
}

/**
 * POST /api/v1/payment/qr
 * Generate PromptPay QR Code payload for a specific PaymentPoint
 */
export async function POST(request: Request) {
  return handle(request, async () => {
    const ctx = await context();
    requirePermission(ctx, "payment.point.read");

    const input = await body(request, qrGenerateInput);
    return generatePointPromptPayQr(ctx, input);
  });
}
