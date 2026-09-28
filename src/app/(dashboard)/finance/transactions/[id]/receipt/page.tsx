import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { pageContext } from "@/core/auth/page";
import { db } from "@/core/database/client";
import { requirePermission } from "@/core/auth/authorization";
import { pointScope } from "@/modules/payment/services/points";
import { PrintButton } from "@/modules/payment/components/print";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await pageContext(); requirePermission(ctx, "payment.transaction.read");
  const id = z.uuid().parse((await params).id);
  const row = await db().paymentTransaction.findFirst({ where: { id, organizationId: ctx.organizationId, status: "RECEIPTED", point: pointScope(ctx) }, include: { point: { select: { name: true, code: true } }, receipter: { select: { displayName: true } } } });
  if (!row) notFound();
  return <section className="receipt-page"><div className="no-print"><PrintButton /></div><article className="receipt-sheet"><Image src="/brand/pdh-finance-logo.png" width={100} height={100} alt="โรงพยาบาลปลวกแดง" /><h1>ใบรับหลักฐานการชำระเงิน</h1><p>โรงพยาบาลปลวกแดง</p><dl className="info-grid"><dt>เลขใบเสร็จ</dt><dd>{row.receiptNo}</dd><dt>เลขอ้างอิง</dt><dd>{row.paymentNo}</dd><dt>HN</dt><dd>{row.hn}</dd><dt>ผู้ป่วย</dt><dd>{row.patientName}</dd><dt>จุดรับชำระ</dt><dd>{row.point.name}</dd><dt>ยอดรับ</dt><dd>{row.verifiedAmount?.toFixed(2)} บาท</dd><dt>วันที่รับ</dt><dd>{row.receiptedAt?.toLocaleString("th-TH")}</dd><dt>เจ้าหน้าที่</dt><dd>{row.receipter?.displayName}</dd></dl><p className="receipt-note">เอกสารนี้เป็นหลักฐานจากระบบรับชำระเงิน กรุณาติดต่อฝ่ายการเงินหากข้อมูลไม่ถูกต้อง</p></article></section>;
}
