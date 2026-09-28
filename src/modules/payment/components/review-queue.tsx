import Link from "next/link";
import { db } from "@/core/database/client";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { pointScope } from "../services/points";
import type { PaymentStatus } from "@/generated/prisma/enums";

export async function ReviewQueue({
  ctx,
  title,
  statuses,
}: {
  ctx: Context;
  title: string;
  statuses: PaymentStatus[];
}) {
  requirePermission(ctx, "payment.transaction.read");
  const rows = await db().paymentTransaction.findMany({
    where: {
      organizationId: ctx.organizationId,
      status: { in: statuses },
      point: pointScope(ctx),
    },
    select: {
      id: true,
      paymentNo: true,
      hn: true,
      patientName: true,
      declaredAmount: true,
      status: true,
      submittedAt: true,
      point: { select: { name: true } },
      slips: {
        select: {
          extraction: {
            select: { status: true, confidence: true, amount: true },
          },
        },
      },
    },
    orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    take: 200,
  });
  return (
    <section>
      <div className="page-head">
        <p className="eyebrow">งานตรวจสอบ</p>
        <h1>{title}</h1>
        <p>{rows.length} รายการที่ต้องดำเนินการ</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>รับเมื่อ</th>
              <th>เลขอ้างอิง</th>
              <th>HN / ผู้ป่วย</th>
              <th>จุด</th>
              <th>ยอด</th>
              <th>OCR</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const extraction = row.slips[0]?.extraction;
              return (
                <tr key={row.id}>
                  <td>{row.submittedAt.toLocaleString("th-TH")}</td>
                  <td>
                    <Link href={`/finance/transactions/${row.id}`}>
                      {row.paymentNo}
                    </Link>
                  </td>
                  <td>
                    {row.hn}
                    <br />
                    {row.patientName}
                  </td>
                  <td>{row.point.name}</td>
                  <td>{row.declaredAmount.toFixed(2)}</td>
                  <td>
                    {extraction?.status ?? "PENDING"}
                    {extraction?.amount
                      ? ` · ${extraction.amount.toFixed(2)}`
                      : ""}
                  </td>
                  <td>{row.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && <div className="panel empty">ไม่มีรายการในคิว</div>}
    </section>
  );
}
