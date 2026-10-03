import { createHash, randomUUID } from "node:crypto";
import { handle } from "@/core/api/handler";
import { db } from "@/core/database/client";
import { AppError } from "@/core/errors";
import { audit } from "@/modules/audit/service";
import { uploadSlipToDrive } from "@/modules/payment/services/drive";
import { processSlipOcrBuffer } from "@/modules/payment/services/ocr";
import { publicPoint } from "@/modules/payment/services/public";
import type { PaymentStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handle(
    request,
    async (requestId) => {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        throw new AppError("INVALID_INPUT", 400, "การส่งไฟล์ข้อมูลไม่ถูกต้อง");
      }

      const file = formData.get("file");
      const rawExpectedAmount = formData.get("expectedAmount");
      const transactionId = formData.get("transactionId") as string | null;

      if (!(file instanceof File)) {
        throw new AppError("INVALID_FILE", 400, "กรุณาแนบไฟล์สลิปการโอนเงิน");
      }

      // Validate file size (Max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new AppError("INVALID_FILE", 400, "ขนาดไฟล์ใหญ่เกินกำหนด (สูงสุด 10MB)");
      }

      // Validate file type (JPG/PNG)
      const mime = file.type;
      if (!["image/jpeg", "image/jpg", "image/png"].includes(mime)) {
        throw new AppError(
          "INVALID_FILE",
          400,
          "รองรับเฉพาะไฟล์รูปภาพ JPG หรือ PNG เท่านั้น",
        );
      }

      const expectedAmount = parseFloat(String(rawExpectedAmount ?? "0"));
      if (isNaN(expectedAmount) || expectedAmount <= 0) {
        throw new AppError("INVALID_INPUT", 400, "กรุณาระบุยอดเงินที่ถูกต้อง");
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const ext = mime === "image/png" ? "png" : "jpg";
      const filename = `slip_${Date.now()}_${randomUUID().slice(0, 8)}.${ext}`;

      const token = formData.get("token") as string | null;
      let targetOrgId: string | null = null;
      if (token) {
        const point = await publicPoint(token);
        targetOrgId = point.organizationId;
      }

      // 1. Upload file to Private Google Drive
      const driveResult = await uploadSlipToDrive({
        buffer: bytes,
        filename,
        mimeType: mime,
        date: new Date(),
      });

      // 2. Perform OCR and Extract Amount using Vision API
      let ocrAmount: number | null = null;
      let ocrText = "";
      try {
        const ocrResult = await processSlipOcrBuffer(bytes, targetOrgId ?? undefined);
        ocrAmount = ocrResult.extractedAmount;
        ocrText = ocrResult.ocrText;
      } catch {
        ocrAmount = null;
      }

      // 3. Compare OCR Amount with Expected Amount
      const isAmountMatch =
        ocrAmount !== null && Math.abs(ocrAmount - expectedAmount) < 0.01;

      // Determine Status: PENDING_VERIFY if matched, AMOUNT_MISMATCH if mismatch or OCR failed
      const newStatus: PaymentStatus = isAmountMatch
        ? "PENDING_VERIFY"
        : "AMOUNT_MISMATCH";

      // 4. Update database if transactionId provided
      if (transactionId) {
        const txRecord = await db().paymentTransaction.findFirst({
          where: {
            id: transactionId,
            ...(targetOrgId ? { organizationId: targetOrgId } : {}),
          },
        });

        if (txRecord) {
          await db().$transaction(async (tx) => {
            const slip = await tx.paymentSlip.create({
              data: {
                organizationId: txRecord.organizationId,
                paymentTransactionId: txRecord.id,
                driveFileId: driveResult.driveFileId,
                driveFolderId: driveResult.driveFolderId,
                storedFilename: filename,
                originalFilename: file.name,
                mimeType: mime,
                fileSize: bytes.length,
                sha256,
              },
            });

            await tx.paymentSlipExtraction.create({
              data: {
                organizationId: txRecord.organizationId,
                paymentSlipId: slip.id,
                status: ocrAmount !== null ? "COMPLETED" : "FAILED",
                amount: ocrAmount,
                provider: "GOOGLE_VISION",
                processedAt: new Date(),
              },
            });

            await tx.paymentTransaction.update({
              where: { id: txRecord.id },
              data: {
                status: newStatus,
                verifiedAmount: ocrAmount,
              },
            });

            await tx.paymentStatusHistory.create({
              data: {
                organizationId: txRecord.organizationId,
                paymentTransactionId: txRecord.id,
                fromStatus: txRecord.status,
                toStatus: newStatus,
                version: txRecord.version + 1,
                reason: isAmountMatch
                  ? "OCR amount matched expected bill amount"
                  : `OCR amount (${ocrAmount ?? "N/A"}) mismatch expected amount (${expectedAmount})`,
              },
            });

            await audit(
              tx,
              { organizationId: txRecord.organizationId, userId: null },
              "PAYMENT_SLIP_UPLOADED",
              "payment",
              txRecord.id,
              "SUCCESS",
              {
                requestId,
                newStatus,
                newAmount: String(expectedAmount),
              },
            );
          });
        }
      }

      return {
        transactionId: transactionId ?? null,
        driveFileId: driveResult.driveFileId,
        ocrAmount,
        expectedAmount,
        isAmountMatch,
        status: newStatus,
        snippet: ocrText.slice(0, 150),
      };
    },
    { multipart: true },
  );
}
