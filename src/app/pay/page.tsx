import Image from "next/image";

export default function PublicPaymentLanding() {
  return (
    <main className="public-payment public-landing">
      <Image
        src="/brand/pdh-finance-logo.png"
        width={180}
        height={180}
        alt="ฝ่ายการเงิน โรงพยาบาลปลวกแดง"
        priority
      />
      <h1>PDH Smart Payment</h1>
      <p>
        กรุณาสแกน QR Code ที่จุดรับชำระเงินของโรงพยาบาลปลวกแดง
        เพื่อส่งหลักฐานการโอนเงิน
      </p>
      <p>
        หากไม่พบ QR Code หรือพบปัญหา
        กรุณาติดต่อเจ้าหน้าที่การเงินประจำจุดรับชำระ
      </p>
    </main>
  );
}
