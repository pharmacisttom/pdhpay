import { JWT } from "google-auth-library";
import { z } from "zod";
import { db } from "@/core/database/client";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { AppError, missing } from "@/core/errors";
import { audit } from "@/modules/audit/service";
import { GoogleDriveStorageService } from "../infrastructure/google-drive";
import { pointScope } from "./points";

const visionConfig = z.object({
  GOOGLE_VISION_ENABLED: z.literal("true"),
  GOOGLE_CLIENT_EMAIL: z.email(),
  GOOGLE_PRIVATE_KEY: z.string().min(64),
});
const visionResponse = z.object({
  responses: z.array(
    z.object({
      fullTextAnnotation: z.object({ text: z.string() }).optional(),
      error: z.object({ code: z.number(), message: z.string() }).optional(),
    }),
  ),
});

export function extractAmountFromSlip(ocrText: string): number | null {
  if (!ocrText) return null;
  const cleanText = ocrText.replace(/\s+/g, " ");
  const amountRegex =
    /(?:จำนวนเงิน|ยอดเงิน|ยอดเงินโอน|Amount|โอนเงินสำเร็จ)\s*[:=]?\s*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i;
  const match = cleanText.match(amountRegex);
  if (match && match[1]) {
    const numericString = match[1].replace(/,/g, "");
    const parsed = parseFloat(numericString);
    if (!isNaN(parsed)) return parsed;
  }

  const fallbackRegex = /([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/g;
  const allNumbers = [...cleanText.matchAll(fallbackRegex)]
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((num) => !isNaN(num) && num > 0);

  if (allNumbers.length > 0) {
    return allNumbers[allNumbers.length - 1];
  }

  return null;
}

export function extractSlipFields(text: string) {
  const normalized = text.replace(/,/g, "").replace(/\s+/g, " ");
  const amountMatches = [
    ...normalized.matchAll(
      /(?:THB|บาท|จำนวนเงิน|amount)\s*[:=]?\s*(\d{1,10}(?:\.\d{2})?)/gi,
    ),
  ];
  const amount = amountMatches.at(-1)?.[1];
  const reference = normalized.match(
    /(?:เลขที่รายการ|รหัสรายการ|reference|transaction id)\s*[:=]?\s*([A-Z0-9-]{6,120})/i,
  )?.[1];
  const bank = normalized.match(
    /(กรุงไทย|กสิกรไทย|ไทยพาณิชย์|กรุงเทพ|กรุงศรี|ออมสิน|ttb|ธนชาต)/i,
  )?.[1];
  const date = normalized.match(
    /(20\d{2})[-/]([01]\d)[-/]([0-3]\d)[ T]([0-2]\d):([0-5]\d)/,
  );
  const transferAt = date
    ? new Date(
        `${date[1]}-${date[2]}-${date[3]}T${date[4]}:${date[5]}:00+07:00`,
      )
    : null;
  const found = [amount, reference, bank, transferAt].filter(Boolean).length;
  return {
    amount,
    reference,
    bankName: bank,
    transferAt,
    confidence: found / 4,
  };
}

async function syncVisionEnvFromDb(organizationId?: string) {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) return;
  const where = organizationId
    ? { organizationId, key: { in: ["GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_VISION_ENABLED"] } }
    : { key: { in: ["GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_VISION_ENABLED"] } };
  try {
    const settings = await db().systemSetting.findMany({ where });
    for (const s of settings) {
      if (s.value !== null && s.value !== undefined) {
        process.env[s.key] = String(s.value);
      }
    }
  } catch {
    // Ignore DB errors if called before DB is ready
  }
}

export async function processSlipOcrBuffer(buffer: Buffer, organizationId?: string) {
  await syncVisionEnvFromDb(organizationId);
  const config = visionConfig.extend({ GOOGLE_VISION_ENABLED: z.string().optional() }).safeParse(process.env);
  if (!config.success || !config.data.GOOGLE_CLIENT_EMAIL || !config.data.GOOGLE_PRIVATE_KEY) {
    throw new AppError(
      "OCR_UNAVAILABLE",
      503,
      "ยังไม่ได้ตั้งค่า Google Cloud Vision OCR (GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY)",
    );
  }

  try {
    const client = new JWT({
      email: config.data.GOOGLE_CLIENT_EMAIL,
      key: config.data.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const access = await client.getAccessToken();
    const response = await fetch(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access.token}`,
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: buffer.toString("base64") },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
        signal: AbortSignal.timeout(30000),
        cache: "no-store",
      },
    );

    if (!response.ok) throw new Error("VISION_HTTP_ERROR");
    const parsed = visionResponse.parse(await response.json());
    if (parsed.responses[0]?.error) throw new Error("VISION_RESPONSE_ERROR");

    const ocrText = parsed.responses[0]?.fullTextAnnotation?.text ?? "";
    const extractedAmount = extractAmountFromSlip(ocrText);
    const rawFields = extractSlipFields(ocrText);

    return { ocrText, extractedAmount, rawFields };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "OCR_UNAVAILABLE",
      503,
      "ไม่สามารถอ่านข้อมูลจากภาพสลิปได้ กรุณาตรวจสอบรูปภาพและลองใหม่อีกครั้ง",
    );
  }
}

export async function processSlipOcr(
  ctx: Context,
  slipId: string,
  requestId?: string,
) {
  requirePermission(ctx, "payment.transaction.verify");
  const slip = await db().paymentSlip.findFirst({
    where: {
      id: slipId,
      organizationId: ctx.organizationId,
      transaction: { point: pointScope(ctx) },
    },
    include: { extraction: true },
  });
  if (!slip) missing();
  if (!slip.mimeType.startsWith("image/"))
    throw new AppError(
      "OCR_UNSUPPORTED",
      400,
      "OCR รองรับไฟล์รูปภาพเท่านั้น กรุณาตรวจ PDF ด้วยตนเอง",
    );
  await syncVisionEnvFromDb(ctx.organizationId);
  const config = visionConfig.safeParse(process.env);
  if (!config.success)
    throw new AppError(
      "OCR_UNAVAILABLE",
      503,
      "ยังไม่ได้ตั้งค่า Google Cloud Vision OCR",
    );
  const claimed = await db().paymentSlipExtraction.upsert({
    where: { paymentSlipId: slip.id },
    create: {
      organizationId: ctx.organizationId,
      paymentSlipId: slip.id,
      status: "PROCESSING",
      attempts: 1,
      provider: "GOOGLE_VISION",
    },
    update: {
      status: "PROCESSING",
      attempts: { increment: 1 },
      errorCode: null,
      provider: "GOOGLE_VISION",
    },
  });
  try {
    const bytes = await new GoogleDriveStorageService().download(
      slip.driveFileId,
    );
    const client = new JWT({
      email: config.data.GOOGLE_CLIENT_EMAIL,
      key: config.data.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const access = await client.getAccessToken();
    const response = await fetch(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access.token}`,
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: bytes.toString("base64") },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
        signal: AbortSignal.timeout(30000),
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error("VISION_HTTP_ERROR");
    const parsed = visionResponse.parse(await response.json());
    if (parsed.responses[0]?.error) throw new Error("VISION_RESPONSE_ERROR");
    const text = parsed.responses[0]?.fullTextAnnotation?.text ?? "";
    const result = extractSlipFields(text);
    const amountVal = extractAmountFromSlip(text) ?? (result.amount ? parseFloat(result.amount) : null);
    const updated = await db().paymentSlipExtraction.update({
      where: { id: claimed.id },
      data: {
        status: "COMPLETED",
        amount: amountVal,
        transferAt: result.transferAt,
        bankName: result.bankName,
        reference: result.reference,
        confidence: result.confidence,
        processedAt: new Date(),
        errorCode: null,
      },
    });
    await audit(
      db(),
      ctx,
      "PAYMENT_SLIP_OCR_COMPLETED",
      "payment",
      slip.paymentTransactionId,
      "SUCCESS",
      { requestId },
    );
    return updated;
  } catch {
    await db().paymentSlipExtraction.update({
      where: { id: claimed.id },
      data: {
        status: "FAILED",
        errorCode: "PROVIDER_ERROR",
        processedAt: new Date(),
      },
    });
    await audit(
      db(),
      ctx,
      "PAYMENT_SLIP_OCR_FAILED",
      "payment",
      slip.paymentTransactionId,
      "FAILURE",
      { requestId },
    );
    throw new AppError(
      "OCR_UNAVAILABLE",
      503,
      "ระบบอ่านสลิปไม่พร้อม กรุณาตรวจด้วยตนเองหรือลองใหม่",
    );
  }
}
