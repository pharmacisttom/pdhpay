import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/database/client";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { AppError, missing } from "@/core/errors";
import { audit } from "@/modules/audit/service";

/**
 * Generates a sequential Receipt Number per organization (Format: RE-YYYYMMDD-XXXX)
 */
export async function generateReceiptNumber(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<string> {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/-/g, "");

  const prefix = `RE-${dateStr}-`;

  const countToday = await tx.paymentTransaction.count({
    where: {
      organizationId,
      receiptNo: { startsWith: prefix },
    },
  });

  const nextSeq = String(countToday + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}

/**
 * Issues a receipt for an approved/verified payment transaction inside a transaction block
 */
export async function issueReceipt(
  ctx: Context,
  paymentTransactionId: string,
  requestId?: string,
) {
  requirePermission(ctx, "payment.receipt.create");

  return db().$transaction(async (tx) => {
    const transaction = await tx.paymentTransaction.findFirst({
      where: {
        id: paymentTransactionId,
        organizationId: ctx.organizationId,
      },
    });

    if (!transaction) missing();

    if (transaction.status !== "VERIFIED") {
      throw new AppError(
        "CONFLICT",
        409,
        "รายการนี้ต้องผ่านการตรวจสอบยืนยันยอดเงิน (VERIFIED) ก่อนจึงจะออกใบเสร็จได้",
      );
    }

    // Generate unique sequential receipt number
    const receiptNo = await generateReceiptNumber(tx, ctx.organizationId);
    const now = new Date();

    const updated = await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        receiptNo,
        receiptedBy: ctx.userId,
        receiptedAt: now,
        status: "RECEIPTED",
      },
    });

    await tx.paymentStatusHistory.create({
      data: {
        organizationId: ctx.organizationId,
        paymentTransactionId: transaction.id,
        fromStatus: transaction.status,
        toStatus: "RECEIPTED",
        version: transaction.version + 1,
        changedBy: ctx.userId,
        reason: `Receipt issued: ${receiptNo}`,
      },
    });

    await audit(
      tx,
      ctx,
      "PAYMENT_RECEIPTED",
      "payment",
      transaction.id,
      "SUCCESS",
      {
        requestId,
        newStatus: "RECEIPTED",
      },
    );

    return updated;
  });
}
