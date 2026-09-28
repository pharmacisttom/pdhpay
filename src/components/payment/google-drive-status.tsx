"use client";
import { useState } from "react";

export function GoogleDriveStatus({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function test() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/payment/drive/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json();
      setMessage(
        result.success
          ? `เชื่อมต่อสำเร็จ · ${result.data.folderName} · โฟลเดอร์ส่วนตัว`
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
      <p className="eyebrow">พื้นที่จัดเก็บสลิป</p>
      <h1>Google Drive</h1>
      <p>
        ไฟล์สลิปจะถูกจัดเก็บเป็นโฟลเดอร์ ปี / เดือน / วัน / จุดรับชำระ
        และเปิดดูผ่านระบบที่ตรวจสิทธิ์เท่านั้น
      </p>
      <dl className="info-grid">
        <dt>การตั้งค่า</dt>
        <dd>
          {configured ? "พบ credential และ Folder ID" : "ยังตั้งค่าไม่ครบ"}
        </dd>
        <dt>การแชร์</dt>
        <dd>ต้องเป็น Private เท่านั้น</dd>
        <dt>ไฟล์รองรับ</dt>
        <dd>JPG, PNG, WEBP, PDF ไม่เกิน 5 MB</dd>
      </dl>
      <button
        className="button button-primary"
        type="button"
        disabled={!configured || busy}
        onClick={() => void test()}
      >
        {busy ? "กำลังตรวจสอบ…" : "ทดสอบการเชื่อมต่อ"}
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
