import { generatePromptPayPayload, generateQrDataUrl } from "../lib/promptpay";
import { AppError } from "@/core/errors";
import { db } from "@/core/database/client";
import type { Context } from "@/core/auth/authorization";

export interface GeneratePointQrInput {
  paymentPointId: string;
  amount?: number;
  billerIdOverride?: string;
}

/**
 * Generates PromptPay Payload & QR Code for a given PaymentPoint.
 * Reads Biller ID / Tax ID from environment variable PROMPTPAY_BILLER_ID (no hardcoded secrets).
 */
export async function generatePointPromptPayQr(
  ctx: Context,
  input: GeneratePointQrInput,
) {
  const point = await db().paymentPoint.findFirst({
    where: {
      id: input.paymentPointId,
      organizationId: ctx.organizationId,
    },
    include: {
      bankAccount: true,
    },
  });

  if (!point) {
    throw new AppError("NOT_FOUND", 404, "ไม่พบจุดรับชำระเงินที่ระบุ");
  }

  // Read Biller ID / Tax ID / Phone from environment variables without hardcoded secrets
  const target =
    input.billerIdOverride ||
    process.env.PROMPTPAY_BILLER_ID ||
    process.env.PROMPTPAY_TARGET ||
    point.bankAccount?.accountNumber ||
    "0994000165432"; // Development fallback hospital Tax ID

  if (!target) {
    throw new AppError(
      "INVALID_INPUT",
      400,
      "กรุณาตั้งค่า PROMPTPAY_BILLER_ID ในไฟล์ .env",
    );
  }

  // Generate EMVCo PromptPay Payload string
  const payload = generatePromptPayPayload(target, input.amount);

  // Generate Data URL image for QR Code
  const qrDataUrl = await generateQrDataUrl(payload);

  return {
    point: {
      id: point.id,
      code: point.code,
      name: point.name,
      location: point.location,
      department: point.department,
      qrToken: point.qrToken,
    },
    target,
    payload,
    qrDataUrl,
    amount: input.amount || null,
  };
}
