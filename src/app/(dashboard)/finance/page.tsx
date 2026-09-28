import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, ExternalLink, MapPin } from "lucide-react";
import { pageContext } from "@/core/auth/page";
import { db } from "@/core/database/client";
import { paymentScope } from "@/modules/payment/application/access";
import { pointScope } from "@/modules/payment/services/points";

export const metadata: Metadata = { title: "การเงิน" };

export default async function FinancePage() {
  const ctx = await pageContext();
  paymentScope(ctx, "payment.dashboard.read");
  const canReadPoints = ctx.permissions.includes("payment.point.read");
  const points = canReadPoints
    ? await db().paymentPoint.findMany({
        where: pointScope(ctx),
        select: {
          id: true,
          code: true,
          name: true,
          location: true,
          status: true,
          bankAccount: { select: { active: true } },
        },
        orderBy: [{ status: "asc" }, { code: "asc" }],
        take: 200,
      })
    : [];

  return (
    <section lang="th">
      <div className="finance-hero">
        <div>
          <p className="eyebrow">ฝ่ายการเงิน โรงพยาบาลปลวกแดง</p>
          <h1>QR แนบหลักฐานการโอนเงิน</h1>
          <p>
            เลือกจุดรับชำระเพื่อเปิดโปสเตอร์ QR
            สำหรับพิมพ์และให้ผู้ป่วยสแกนแนบสลิป
          </p>
        </div>
        <QrCode size={56} aria-hidden="true" />
      </div>
      <div className="actions finance-actions">
        <Link className="button button-primary" href="/finance/review">คิวรอตรวจสลิป</Link>
        <Link className="button button-outline" href="/finance/exceptions">รายการผิดปกติ</Link>
        <Link className="button button-outline" href="/finance/reports/daily">รายงานรายวัน</Link>
        <Link className="button button-outline" href="/finance/reports/monthly">รายงานรายเดือน</Link>
        <Link className="button button-outline" href="/finance/shifts">จัดการกะ</Link>
      </div>

      {!canReadPoints ? (
        <section className="panel">
          <h2>ไม่มีสิทธิ์ดูจุดรับชำระ</h2>
          <p>กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดสิทธิ์ payment.point.read</p>
        </section>
      ) : (
        <div className="point-grid">
          {points.map((point) => {
            const ready = point.status === "ACTIVE" && point.bankAccount.active;
            return (
              <article className="panel point-card" key={point.id}>
                <div className="point-card-head">
                  <span className="point-code">{point.code}</span>
                  <span
                    className={`status-pill ${ready ? "ready" : "not-ready"}`}
                  >
                    {ready ? "พร้อมรับสลิป" : "ยังไม่พร้อม"}
                  </span>
                </div>
                <h2>{point.name}</h2>
                {point.location && (
                  <p>
                    <MapPin size={16} aria-hidden="true" /> {point.location}
                  </p>
                )}
                <div className="actions">
                  <Link
                    className="button button-primary"
                    href={`/admin/payment-points/${point.id}/qr`}
                  >
                    <QrCode size={18} />
                    เปิดและพิมพ์ QR
                  </Link>
                  <Link
                    className="button button-outline"
                    href={`/admin/payment-points/${point.id}`}
                  >
                    <ExternalLink size={18} />
                    จัดการจุด
                  </Link>
                </div>
              </article>
            );
          })}
          {!points.length && (
            <section className="panel">
              <h2>ยังไม่มีจุดรับชำระ</h2>
              <p>ผู้ดูแลต้องสร้างและมอบหมายจุดรับชำระก่อนจึงจะสร้าง QR ได้</p>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
