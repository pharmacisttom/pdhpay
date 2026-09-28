import { publicPaymentStatus } from "@/modules/payment/services/public";
import { AppError } from "@/core/errors";

const labels: Record<string, string> = {
  PENDING_VERIFY: "รอตรวจสอบ",
  VERIFIED: "ยืนยันยอดแล้ว",
  RECEIPTED: "ออกใบเสร็จแล้ว",
  AMOUNT_MISMATCH: "ยอดเงินไม่ตรง",
  POSSIBLE_DUPLICATE: "รอตรวจรายการซ้ำ",
  INVALID_SLIP: "สลิปไม่ถูกต้อง",
  REJECTED: "รายการถูกปฏิเสธ",
  CANCELLED: "ยกเลิกรายการ",
};
export const metadata = {
  title: "ติดตามสถานะการชำระเงิน",
  robots: { index: false, follow: false },
};
export default async function StatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const payment = await publicPaymentStatus((await params).token).catch(
    (error: unknown) =>
      error instanceof AppError ? null : Promise.reject(error),
  );
  if (!payment)
    return (
      <main className="public-payment">
        <h1>ไม่พบรายการ</h1>
        <p>กรุณาตรวจสอบลิงก์หรือติดต่อเจ้าหน้าที่การเงิน</p>
      </main>
    );
  return (
    <main className="public-payment status-card">
      <p className="eyebrow">โรงพยาบาลปลวกแดง</p>
      <h1>สถานะการชำระเงิน</h1>
      <p className="status-badge">{labels[payment.status] ?? payment.status}</p>
      <dl className="info-grid">
        <dt>เลขอ้างอิง</dt>
        <dd>{payment.paymentNo}</dd>
        <dt>จุดรับชำระ</dt>
        <dd>{payment.point.name}</dd>
        <dt>ส่งเมื่อ</dt>
        <dd>{payment.submittedAt.toLocaleString("th-TH")}</dd>
        {payment.receiptNo && (
          <>
            <dt>เลขใบเสร็จ</dt>
            <dd>{payment.receiptNo}</dd>
          </>
        )}
      </dl>
      <p>
        การส่งสลิปไม่ถือเป็นการยืนยันยอดจนกว่าสถานะจะแสดงว่า “ยืนยันยอดแล้ว”
        หรือ “ออกใบเสร็จแล้ว”
      </p>
    </main>
  );
}
