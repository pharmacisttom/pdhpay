"use client";

import { useState } from "react";

export function GoogleSheetsSync({
  configured,
  range,
}: {
  configured: boolean;
  range: string | null;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function sync() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/payment/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json();
      setMessage(
        result.success
          ? `ส่งออกสำเร็จ ${result.data.exported} รายการ`
          : result.error.message,
      );
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <p className="eyebrow">Google Sheets</p>
      <h1>เชื่อมต่อรายงานการเงิน</h1>
      <p>
        ส่งออกเฉพาะรายการที่ออกใบเสร็จแล้ว โดยไม่ส่งชื่อผู้ป่วย เบอร์โทรศัพท์
        หรือไฟล์สลิป
      </p>
      <dl className="info-grid">
        <dt>สถานะ</dt>
        <dd>{configured ? "พร้อมใช้งาน" : "ยังไม่ได้ตั้งค่า"}</dd>
        <dt>ช่วงข้อมูล</dt>
        <dd>{range ?? "—"}</dd>
      </dl>
      <button
        className="button button-primary"
        type="button"
        disabled={!configured || busy}
        onClick={sync}
      >
        {busy ? "กำลังส่งออก…" : "ซิงก์รายการล่าสุด"}
      </button>
      {message && (
        <p role="status" className="form-message">
          {message}
        </p>
      )}
    </section>
  );
}
