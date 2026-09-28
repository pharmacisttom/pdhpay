import type { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/core/errors";

/** Allocate inside the SAME transaction as payment creation. Never use MAX+1. */
export async function nextPaymentNumber(
  tx: Prisma.TransactionClient,
  now = new Date(),
) {
  const dateText = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const date = new Date(`${dateText}T00:00:00.000Z`);
  // MySQL INSERT ... ON DUPLICATE KEY serializes concurrent allocators on this row.
  await tx.$executeRaw`INSERT INTO PaymentNumberSequence (date, value) VALUES (${date}, 1)
    ON DUPLICATE KEY UPDATE value = value + 1`;
  const row = await tx.paymentNumberSequence.findUniqueOrThrow({
    where: { date },
  });
  if (row.value > 999999)
    throw new AppError(
      "CONFLICT",
      409,
      "Daily payment reference capacity reached.",
    );
  return `PAY-${dateText.replaceAll("-", "")}-${String(row.value).padStart(6, "0")}`;
}
