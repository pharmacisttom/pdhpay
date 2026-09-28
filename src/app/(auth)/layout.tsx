import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-shell">
      <aside className="auth-brand">
        <div className="auth-logo-wrap">
          <Image
            className="auth-logo"
            src="/brand/pdh-finance-logo.png"
            alt="ตราสัญลักษณ์ฝ่ายการเงิน โรงพยาบาลปลวกแดง"
            width={420}
            height={420}
            priority
          />
        </div>
        <div>
          <h2>
            การเงินโปร่งใส
            <br />
            ตรวจสอบได้ทุกขั้นตอน
          </h2>
          <p>ระบบบริหารจัดการรับชำระเงิน โรงพยาบาลปลวกแดง จังหวัดระยอง</p>
        </div>
      </aside>
      <div className="auth-content">
        <div className="auth-card">{children}</div>
      </div>
    </main>
  );
}
