import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageContext } from "@/core/auth/page";
import { requirePermission } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { pointScope } from "@/modules/payment/services/points";
import { formatDate } from "@/modules/payment/i18n/translations";
import { PrintReceiptUI } from "./PrintReceiptUI";

export const metadata: Metadata = { title: "พิมพ์ใบเสร็จรับเงิน" };

export default async function ReceiptPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await pageContext();
  requirePermission(ctx, "payment.point.read");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const transaction = await db().paymentTransaction.findFirst({
    where: {
      id,
      organizationId: ctx.organizationId,
      status: "RECEIPTED",
      point: pointScope(ctx),
    },
    include: {
      point: { select: { name: true, code: true } },
      receipter: { select: { displayName: true } },
    },
  });

  if (!transaction) notFound();

  const amountVal = transaction.verifiedAmount
    ? Number(transaction.verifiedAmount)
    : Number(transaction.declaredAmount);

  const amountFormatted = amountVal.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const dateFormatted = transaction.receiptedAt
    ? formatDate(transaction.receiptedAt, "th")
    : formatDate(transaction.submittedAt, "th");

  const receiptData = {
    receiptNo: transaction.receiptNo,
    paymentNo: transaction.paymentNo,
    hn: transaction.hn,
    patientName: transaction.patientName,
    payerName: transaction.payerName,
    pointName: transaction.point.name,
    amountFormatted,
    dateFormatted,
    cashierName: transaction.receipter?.displayName || "เจ้าหน้าที่การเงิน",
  };

  return <PrintReceiptUI receipt={receiptData} />;
}
