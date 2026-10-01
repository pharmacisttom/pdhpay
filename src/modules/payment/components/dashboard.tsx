"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./api";

type Row = {
  id: string;
  paymentNo: string;
  hn: string;
  patientName: string;
  submittedAt: string;
  declaredAmount: string;
  verifiedAmount: string | null;
  sourceBank: string;
  status: string;
  point: { name: string };
  verifier: { displayName: string } | null;
};

type PointBreakdown = {
  pointId: string;
  pointName: string;
  department: string;
  count: number;
  declared: string;
  verified: string;
};

type Summary = {
  count: number;
  declared: string;
  verified: string;
  groups: { status: string; count: number; declared: string; verified: string }[];
  pointBreakdown?: PointBreakdown[];
};

export function Dashboard({
  canReadTransactions = true,
}: {
  canReadTransactions?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    let active = true;
    let running = false;

    const refresh = async () => {
      if (running) return;
      running = true;
      try {
        const suffix = query + (query ? "&" : "") + "page=" + page;
        const [s, r] = await Promise.all([
          api<Summary>("summary?" + suffix),
          canReadTransactions
            ? api<{ items: Row[]; total: number }>("transactions?" + suffix)
            : Promise.resolve({ items: [], total: 0 }),
        ]);

        if (active) {
          setStats(s);
          setRows(r.items);
          setTotal(r.total);
          setError("");
          setUpdated(new Date().toLocaleTimeString("th-TH"));
        }
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        running = false;
      }
    };

    void refresh();

    // Auto refresh interval every 60 seconds
    const interval = setInterval(() => {
      void refresh();
    }, 60000);

    // Live EventSource Stream if available
    const events = new EventSource("/api/v1/payment/stream");
    events.addEventListener("update", () => void refresh());
    events.onerror = () => {
      // Ignore SSE fallback to interval
    };

    return () => {
      active = false;
      clearInterval(interval);
      events.close();
    };
  }, [query, page, canReadTransactions]);

  return (
    <section lang="th">
      <div className="page-head">
        <p className="eyebrow">ระบบบริหารการเงิน</p>
        <h1>PDH Smart Payment Dashboard</h1>
        <p className="actions" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
          <Link className="button button-outline button-small" href="/finance/shifts">
            จัดการกะงาน
          </Link>
          <Link className="button button-outline button-small" href="/finance/reports/daily">
            รายงานรายวัน
          </Link>
          <Link className="button button-outline button-small" href="/finance/reports/monthly">
            รายงานรายเดือน
          </Link>
          <Link className="button button-outline button-small" href="/finance/exceptions">
            รายการผิดปกติ
          </Link>
        </p>
      </div>

      <form
        className="payment-filters"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const params = new URLSearchParams();
          for (const [k, v] of data) if (String(v)) params.set(k, String(v));
          setPage(1);
          setQuery(params.toString());
        }}
      >
        <label>
          ตั้งแต่
          <input type="date" name="from" />
        </label>
        <label>
          ถึง
          <input type="date" name="to" />
        </label>
        <label>
          ค้นหา HN / เลขอ้างอิง
          <input name="q" placeholder="พิมพ์ HN หรือเลขอ้างอิง" />
        </label>
        <label>
          สถานะ
          <select name="status">
            <option value="">ทั้งหมด</option>
            {[
              "SUBMITTED",
              "PENDING_VERIFY",
              "VERIFIED",
              "RECEIPTED",
              "AMOUNT_MISMATCH",
              "POSSIBLE_DUPLICATE",
              "INVALID_SLIP",
              "REJECTED",
              "CANCELLED",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="button button-primary">
          ค้นหา
        </button>
      </form>

      {error && <p role="alert" className="alert alert-danger">{error}</p>}
      <p aria-live="polite" className="small-help" style={{ margin: "0.5rem 0 1.5rem" }}>
        อัปเดตล่าสุด: {updated || "กำลังโหลด..."} (รีเฟรชอัตโนมัติทุก 1 นาที)
      </p>

      {stats ? (
        <>
          <div className="metrics" style={{ marginBottom: "1.5rem" }}>
            <article className="panel metric">
              <span className="eyebrow">จำนวนรายการทั้งหมด</span>
              <strong>{stats.count}</strong>
              <p>รายการชำระเงิน</p>
            </article>
            <article className="panel metric">
              <span className="eyebrow">ยอดเงินแจ้งโอน</span>
              <strong style={{ color: "var(--brand-dark)" }}>{stats.declared} ฿</strong>
              <p>ตามสลิปผู้ชำระ</p>
            </article>
            <article className="panel metric">
              <span className="eyebrow">ยอดยืนยันแล้ว</span>
              <strong style={{ color: "#137333" }}>{stats.verified} ฿</strong>
              <p>ตรวจสอบโดยเจ้าหน้าที่</p>
            </article>
          </div>

          {stats.pointBreakdown && stats.pointBreakdown.length > 0 && (
            <section className="panel" style={{ marginBottom: "1.5rem" }}>
              <h2>สรุปยอดแยกตามจุดบริการ / แผนก</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>จุดบริการ</th>
                      <th>แผนก</th>
                      <th>จำนวนรายการ</th>
                      <th>ยอดแจ้งโอน (฿)</th>
                      <th>ยอดยืนยัน (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pointBreakdown.map((pt) => (
                      <tr key={pt.pointId}>
                        <td><strong>{pt.pointName}</strong></td>
                        <td>{pt.department}</td>
                        <td>{pt.count}</td>
                        <td>{pt.declared}</td>
                        <td style={{ color: "#137333", fontWeight: "bold" }}>{pt.verified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : (
        <p className="skeleton">กำลังโหลดสรุปสถิติ...</p>
      )}

      {canReadTransactions && (
        <section className="panel">
          <h2>รายการธุรกรรมล่าสุด</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    "เวลา",
                    "เลขอ้างอิง",
                    "HN",
                    "ผู้ป่วย",
                    "จุดบริการ",
                    "ยอดแจ้ง",
                    "ยอดยืนยัน",
                    "ธนาคาร",
                    "สถานะ",
                    "เจ้าหน้าที่",
                  ].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.submittedAt).toLocaleString("th-TH")}</td>
                    <td>
                      <Link href={"/finance/transactions/" + r.id}>
                        {r.paymentNo}
                      </Link>
                    </td>
                    <td>{r.hn}</td>
                    <td>{r.patientName}</td>
                    <td>{r.point.name}</td>
                    <td>{r.declaredAmount}</td>
                    <td>{r.verifiedAmount ?? "—"}</td>
                    <td>{r.sourceBank}</td>
                    <td>
                      <span className="badge">{r.status}</span>
                    </td>
                    <td>{r.verifier?.displayName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && <p className="text-muted">ไม่พบรายการตามตัวกรอง</p>}
          <div className="actions" style={{ marginTop: "1rem", justifyContent: "center" }}>
            <button
              type="button"
              className="button button-outline button-small"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ก่อนหน้า
            </button>
            <span>หน้า {page} · ทั้งหมด {total} รายการ</span>
            <button
              type="button"
              className="button button-outline button-small"
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
            >
              ถัดไป
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
