import Image from "next/image";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { pageContext } from "@/core/auth/page";
import { requirePermission } from "@/core/auth/authorization";
import { env } from "@/core/config/env";
import { PointManager } from "@/modules/payment/components/point-manager";
import { PrintButton } from "@/modules/payment/components/print";
import { getPoint } from "@/modules/payment/services/points";

export default async function PaymentPointPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const ctx = await pageContext();
  requirePermission(ctx, "payment.point.read");
  const path = (await params).path ?? [];
  if (path.length === 0) return <PointManager />;
  if (path[0] === "new") {
    requirePermission(ctx, "payment.point.create");
    return <PointManager mode="new" />;
  }
  if (!/^[0-9a-f-]{36}$/i.test(path[0]) || path.length > 2) notFound();
  if (path[1] === "qr") {
    const point = await getPoint(ctx, path[0]);
    const url = `${env().APP_URL}/pay/p/${point.qrToken}`;
    const qrImage = await QRCode.toDataURL(url, {
      width: 900,
      margin: 3,
      errorCorrectionLevel: "H",
      color: { dark: "#073b3b", light: "#ffffff" },
    });
    const localOnly = ["localhost", "127.0.0.1"].includes(
      new URL(url).hostname,
    );
    return (
      <section className="qr-page">
        <div className="qr-toolbar no-print">
          <PrintButton />
          <a
            className="button button-outline"
            href={qrImage}
            download={`${point.code}-payment-qr.png`}
          >
            ดาวน์โหลด QR PNG
          </a>
        </div>
        {localOnly && (
          <p className="local-warning no-print">
            <strong>โหมดทดสอบ:</strong> QR นี้ใช้ localhost
            และเปิดจากโทรศัพท์เครื่องอื่นไม่ได้ กรุณาตั้ง APP_URL เป็น IP
            หรือโดเมนที่ผู้ป่วยเข้าถึงได้ก่อนพิมพ์ใช้งานจริง
          </p>
        )}
        <article className="qr-poster">
          <Image
            className="qr-poster-logo"
            src="/brand/pdh-finance-logo.png"
            width={150}
            height={150}
            alt="ตราฝ่ายการเงิน โรงพยาบาลปลวกแดง"
            priority
          />
          <p className="qr-hospital">โรงพยาบาลปลวกแดง</p>
          <h1>สแกนเพื่อแนบสลิปโอนเงิน</h1>
          <h2>{point.name}</h2>
          <div className="qr-frame">
            <Image
              unoptimized
              src={qrImage}
              width={360}
              height={360}
              alt={`QR แนบสลิปสำหรับ ${point.name}`}
            />
          </div>
          <ol className="qr-steps">
            <li>สแกน QR Code</li>
            <li>กรอกข้อมูลการชำระเงิน</li>
            <li>แนบรูปสลิปแล้วกดส่ง</li>
            <li>เก็บเลขอ้างอิงไว้ตรวจสอบ</li>
          </ol>
          <p className="qr-point-code">
            รหัสจุดรับชำระ: <strong>{point.code}</strong>
          </p>
          <p className="qr-url">{url}</p>
          <p className="qr-contact">
            สอบถาม:{" "}
            {process.env.HOSPITAL_PHONE ?? "เจ้าหน้าที่ประจำจุดรับชำระเงิน"}
          </p>
        </article>
      </section>
    );
  }
  if (path[1] && path[1] !== "edit") notFound();
  if (path[1] === "edit") requirePermission(ctx, "payment.point.update");
  return (
    <PointManager
      pointId={path[0]}
      mode={path[1] === "edit" ? "edit" : "detail"}
    />
  );
}
