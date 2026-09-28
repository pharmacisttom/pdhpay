import Link from "next/link";
import type { reportRows } from "../services/reports";

type Rows = Awaited<ReturnType<typeof reportRows>>;
export function ReportView({
  title,
  from,
  to,
  rows,
}: {
  title: string;
  from: string;
  to: string;
  rows: Rows;
}) {
  const declared = rows.reduce(
    (sum, row) => sum + Number(row.declaredAmount),
    0,
  );
  const verified = rows.reduce(
    (sum, row) => sum + Number(row.verifiedAmount ?? 0),
    0,
  );
  const query = new URLSearchParams({ from, to }).toString();
  return (
    <section>
      <div className="page-head">
        <p className="eyebrow">รายงานการเงิน</p>
        <h1>{title}</h1>
        <p>
          {from} ถึง {to}
        </p>
        <div className="actions">
          <Link
            className="button button-outline"
            href={`/api/v1/payment/reports/export?${query}`}
          >
            ดาวน์โหลด CSV
          </Link>
        </div>
      </div>
      <div className="metrics">
        <article className="panel metric">
          <p>จำนวนรายการ</p>
          <strong>{rows.length}</strong>
        </article>
        <article className="panel metric">
          <p>ยอดแจ้งชำระ</p>
          <strong>
            {declared.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </strong>
        </article>
        <article className="panel metric">
          <p>ยอดยืนยัน</p>
          <strong>
            {verified.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </strong>
        </article>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>เวลา</th>
              <th>เลขอ้างอิง</th>
              <th>HN</th>
              <th>จุด</th>
              <th>ยอดแจ้ง</th>
              <th>ยอดยืนยัน</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.paymentNo}>
                <td>{row.submittedAt.toLocaleString("th-TH")}</td>
                <td>{row.paymentNo}</td>
                <td>{row.hn}</td>
                <td>{row.point.name}</td>
                <td>{row.declaredAmount.toFixed(2)}</td>
                <td>{row.verifiedAmount?.toFixed(2) ?? "—"}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
