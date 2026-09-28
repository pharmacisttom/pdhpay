import Link from "next/link";
import { ApiForm } from "@/components/shared/api-form";

export default function RegisterPage() {
  return (
    <>
      <p className="eyebrow">ลงทะเบียนบุคลากร</p>
      <h1>ขอสิทธิ์เข้าใช้งาน</h1>
      <p>
        บัญชีใหม่จะยังเข้าใช้งานไม่ได้จนกว่าผู้ดูแลระบบจะตรวจสอบและกำหนดบทบาท
      </p>
      <ApiForm
        endpoint="auth/register"
        label="ส่งคำขอสมัครสมาชิก"
        fields={[
          {
            name: "organization",
            label: "รหัสหน่วยงาน",
            value: "pdh-dev",
            autoComplete: "organization",
          },
          { name: "firstName", label: "ชื่อ", autoComplete: "given-name" },
          { name: "lastName", label: "นามสกุล", autoComplete: "family-name" },
          {
            name: "email",
            label: "อีเมล",
            type: "email",
            autoComplete: "email",
          },
          {
            name: "password",
            label: "รหัสผ่าน (อย่างน้อย 12 ตัวอักษร)",
            type: "password",
            autoComplete: "new-password",
          },
        ]}
      />
      <p className="auth-links">
        <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
      </p>
    </>
  );
}
