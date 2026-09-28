import Link from "next/link";
import { ApiForm } from "@/components/shared/api-form";

export default function Login() {
  return (
    <>
      <p className="eyebrow">ระบบการเงิน โรงพยาบาลปลวกแดง</p>
      <h1>เข้าสู่ระบบ</h1>
      <ApiForm
        endpoint="auth/login"
        label="เข้าสู่ระบบ"
        redirect="/dashboard"
        fields={[
          {
            name: "organization",
            label: "รหัสหน่วยงาน",
            value: "pdh-dev",
            autoComplete: "organization",
          },
          {
            name: "email",
            label: "อีเมล",
            type: "email",
            autoComplete: "username",
          },
          {
            name: "password",
            label: "รหัสผ่าน",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
      />
      <p className="auth-links">
        <Link href="/register">สมัครสมาชิก</Link>
        <span> · </span>
        <Link href="/forgot-password">ลืมรหัสผ่าน</Link>
      </p>
    </>
  );
}
