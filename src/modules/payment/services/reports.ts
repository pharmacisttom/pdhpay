import { z } from "zod";
import { db } from "@/core/database/client";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { audit } from "@/modules/audit/service";
import { filters, paymentWhere } from "../queries/transactions";

const reportDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
  );
export const reportFilters = z
  .object({
    from: reportDate,
    to: reportDate,
    limit: z.coerce.number().int().min(1).max(5000).default(1000),
  })
  .strict()
  .refine(
    (value) =>
      value.from <= value.to &&
      (Date.parse(value.to) - Date.parse(value.from)) / 86400000 <= 366,
    "ช่วงวันที่ต้องไม่เกิน 366 วัน",
  );
export async function reportRows(
  ctx: Context,
  input: z.infer<typeof reportFilters>,
) {
  requirePermission(ctx, "payment.report.read");
  const full = filters.parse({
    from: input.from,
    to: input.to,
    page: 1,
    limit: 100,
  });
  return db().paymentTransaction.findMany({
    where: paymentWhere(ctx, full, true),
    select: {
      paymentNo: true,
      submittedAt: true,
      hn: true,
      patientName: true,
      declaredAmount: true,
      verifiedAmount: true,
      status: true,
      receiptNo: true,
      sourceBank: true,
      point: { select: { name: true } },
    },
    orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
    take: input.limit,
  });
}
const csvCell = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;
export async function exportReport(
  ctx: Context,
  input: z.infer<typeof reportFilters>,
  requestId?: string,
) {
  requirePermission(ctx, "payment.report.export");
  const rows = await reportRows(ctx, input);
  const header = [
    "เลขอ้างอิง",
    "วันที่รับ",
    "HN",
    "ชื่อผู้ป่วย",
    "จุดรับชำระ",
    "ยอดแจ้ง",
    "ยอดยืนยัน",
    "ธนาคาร",
    "สถานะ",
    "เลขใบเสร็จ",
  ];
  const csv = [
    header,
    ...rows.map((row) => [
      row.paymentNo,
      row.submittedAt.toISOString(),
      row.hn,
      row.patientName,
      row.point.name,
      row.declaredAmount.toFixed(2),
      row.verifiedAmount?.toFixed(2) ?? "",
      row.sourceBank,
      row.status,
      row.receiptNo ?? "",
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  await audit(
    db(),
    ctx,
    "PAYMENT_REPORT_EXPORTED",
    "payment-report",
    undefined,
    "SUCCESS",
    { requestId },
  );
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pdh-payment-${input.from}-${input.to}.csv"`,
    },
  });
}
