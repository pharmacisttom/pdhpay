"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { api, confirmAction, showError } from "./api";

type Extraction = {
  status: string;
  amount: string | null;
  transferAt: string | null;
  bankName: string | null;
  reference: string | null;
  confidence: string | null;
  errorCode: string | null;
};
type Detail = {
  id: string;
  paymentNo: string;
  hn: string;
  vn: string | null;
  an: string | null;
  patientName: string;
  payerName: string | null;
  payerPhone: string | null;
  declaredAmount: string;
  verifiedAmount: string | null;
  sourceBank: string;
  transferDateTime: string;
  status: string;
  version: number;
  note: string | null;
  receiptNo: string | null;
  reconciliationStatus: string;
  deviceFingerprintHash: string | null;
  point: { name: string };
  shift: { status: string; shiftName: string } | null;
  slips: {
    id: string;
    mimeType: string;
    storedFilename: string;
    extraction: Extraction | null;
  }[];
  statusHistory: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
    actor: { displayName: string } | null;
  }[];
  audit: { action: string; createdAt: string }[];
};

export function TransactionDetail({
  id,
  permissions,
}: {
  id: string;
  permissions: string[];
}) {
  const [row, setRow] = useState<Detail | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(
    () =>
      api<Detail>(`transactions/${id}`)
        .then(setRow)
        .catch((e) => setError(e.message)),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function action(name: string, extra: Record<string, unknown> = {}) {
    if (!row || busy || !(await confirmAction("ยืนยันการดำเนินการรายการนี้?")))
      return;
    setBusy(true);
    try {
      await api(`transactions/${id}/${name}`, "POST", {
        version: row.version,
        ...extra,
      });
      await load();
      await Swal.fire("บันทึกสำเร็จ", "", "success");
    } catch (e) {
      await showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function runOcr(slipId: string) {
    setBusy(true);
    try {
      await api(`slips/${slipId}/ocr`, "POST", {});
      await load();
    } catch (e) {
      await showError(e);
    } finally {
      setBusy(false);
    }
  }
  if (!row) return <p role="status">{error || "กำลังโหลดรายการ…"}</p>;
  const allowed = (permission: string) => permissions.includes(permission);
  return (
    <section>
      <div className="page-head">
        <p className="eyebrow">ตรวจสอบการชำระเงิน</p>
        <h1>{row.paymentNo}</h1>
        <p>
          <span className="status-badge">{row.status}</span> ·{" "}
          {row.shift?.shiftName ?? "ไม่มีกะ"}
        </p>
        {row.status === "RECEIPTED" && (
          <Link
            className="button button-outline"
            href={`/finance/transactions/${row.id}/receipt`}
          >
            พิมพ์ใบรับหลักฐาน
          </Link>
        )}
      </div>
      <section className="panel">
        <h2>ข้อมูลรายการ</h2>
        <dl className="info-grid">
          {[
            ["HN", row.hn],
            ["VN / AN", [row.vn, row.an].filter(Boolean).join(" / ")],
            ["ผู้ป่วย", row.patientName],
            ["ผู้ชำระ", row.payerName],
            ["โทรศัพท์", row.payerPhone],
            ["จุดรับชำระ", row.point.name],
            ["ยอดแจ้ง", row.declaredAmount],
            ["ยอดตรวจสอบ", row.verifiedAmount],
            ["ธนาคาร", row.sourceBank],
            ["เวลาโอน", new Date(row.transferDateTime).toLocaleString("th-TH")],
            ["หมายเหตุ", row.note],
            ["เลขใบเสร็จ", row.receiptNo],
            ["ผลกระทบยอด", row.reconciliationStatus],
            ["รหัสอุปกรณ์ (ย่อ)", row.deviceFingerprintHash?.slice(0, 12)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "contents" }}>
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel">
        <h2>หลักฐานและผลอ่านสลิป</h2>
        {row.slips.map((slip) => (
          <article className="slip-review" key={slip.id}>
            {slip.mimeType.startsWith("image/") && (
              <Image
                unoptimized
                src={`/api/v1/payment/slips/${slip.id}`}
                alt="หลักฐานการชำระเงิน"
                width={600}
                height={800}
              />
            )}
            <div>
              <a
                target="_blank"
                rel="noreferrer"
                href={`/api/v1/payment/slips/${slip.id}`}
              >
                เปิดไฟล์ {slip.storedFilename}
              </a>
              <h3>OCR: {slip.extraction?.status ?? "PENDING"}</h3>
              {slip.extraction?.status === "COMPLETED" && (
                <dl className="info-grid">
                  <dt>ยอดที่อ่านได้</dt>
                  <dd>{slip.extraction.amount ?? "—"}</dd>
                  <dt>ธนาคาร</dt>
                  <dd>{slip.extraction.bankName ?? "—"}</dd>
                  <dt>เวลาโอน</dt>
                  <dd>
                    {slip.extraction.transferAt
                      ? new Date(slip.extraction.transferAt).toLocaleString(
                          "th-TH",
                        )
                      : "—"}
                  </dd>
                  <dt>เลขอ้างอิง</dt>
                  <dd>{slip.extraction.reference ?? "—"}</dd>
                  <dt>ความมั่นใจ</dt>
                  <dd>
                    {slip.extraction.confidence
                      ? `${Math.round(Number(slip.extraction.confidence) * 100)}%`
                      : "—"}
                  </dd>
                </dl>
              )}
              {allowed("payment.transaction.verify") &&
                slip.mimeType.startsWith("image/") && (
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => void runOcr(slip.id)}
                  >
                    อ่านข้อมูลจากสลิป
                  </button>
                )}
            </div>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>ตรวจสอบยอด</h2>
        <form
          className="payment-filters"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const button = (event.nativeEvent as SubmitEvent)
              .submitter as HTMLButtonElement;
            void action(button.value, {
              amount: form.get("amount"),
              ...(form.get("reason") ? { reason: form.get("reason") } : {}),
            });
          }}
        >
          <label>
            ยอดที่ตรวจสอบ
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={row.verifiedAmount ?? row.declaredAmount}
            />
          </label>
          <label>
            เหตุผล / ผลตรวจ
            <input name="reason" maxLength={1000} />
          </label>
          {allowed("payment.transaction.verify") && (
            <button value="verify" disabled={busy}>
              ยืนยันยอด
            </button>
          )}
          {allowed("payment.transaction.correct") && (
            <button value="correct" disabled={busy}>
              แก้ยอด
            </button>
          )}
        </form>
      </section>
      {allowed("payment.receipt.create") && (
        <section className="panel">
          <h2>ออกใบเสร็จ</h2>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              void action("receipt", {
                receiptNo: new FormData(event.currentTarget).get("receiptNo"),
              });
            }}
          >
            <label>
              เลขใบเสร็จ
              <input name="receiptNo" required maxLength={80} />
            </label>
            <button disabled={busy}>บันทึกใบเสร็จ</button>
          </form>
        </section>
      )}
      <section className="panel">
        <h2>ประวัติสถานะ</h2>
        <ol>
          {row.statusHistory.map((item) => (
            <li key={item.id}>
              {new Date(item.createdAt).toLocaleString("th-TH")} ·{" "}
              {item.toStatus} · {item.actor?.displayName ?? "ผู้ส่งหลักฐาน"} ·{" "}
              {item.reason}
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
