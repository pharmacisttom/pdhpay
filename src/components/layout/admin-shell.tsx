import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  ScrollText,
  Settings,
  TableProperties,
  HardDrive,
} from "lucide-react";
import type { Context } from "@/core/auth/authorization";
import { ApiForm } from "@/components/shared/api-form";
const links = [
  {
    path: "finance",
    label: "การเงิน PDH",
    icon: LayoutDashboard,
    permission: "payment.dashboard.read",
  },
  {
    path: "dashboard",
    label: "ภาพรวม",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    path: "users",
    label: "บุคลากรและคำขอสมัคร",
    icon: Users,
    permission: "users.view",
  },
  {
    path: "roles",
    label: "บทบาทและสิทธิ์",
    icon: Shield,
    permission: "roles.view",
  },
  {
    path: "organizations",
    label: "ข้อมูลองค์กร",
    icon: Building2,
    permission: "organizations.view",
  },
  {
    path: "audit",
    label: "บันทึกการใช้งาน",
    icon: ScrollText,
    permission: "audit.view",
  },
  { path: "settings", label: "ตั้งค่า", icon: Settings, permission: null },
  {
    path: "admin/departments",
    label: "จัดการแผนก",
    icon: Building2,
    permission: "payment.admin.manage",
  },
  {
    path: "admin/users",
    label: "จัดการสิทธิ์ผู้ใช้",
    icon: Users,
    permission: "admin.users.manage",
  },
  {
    path: "admin/google-sheets",
    label: "Google Sheets",
    icon: TableProperties,
    permission: "payment.report.export",
  },
  {
    path: "admin/google-drive",
    label: "Google Drive",
    icon: HardDrive,
    permission: "payment.admin.manage",
  },
];
export function AdminShell({
  ctx,
  name,
  organization,
  children,
}: {
  ctx: Context;
  name: string;
  organization: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <Image
            className="sidebar-logo"
            src="/brand/pdh-finance-logo.png"
            alt="ฝ่ายการเงิน โรงพยาบาลปลวกแดง"
            width={84}
            height={84}
          />
          <span>
            PDH<small>SMART PAYMENT</small>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {links
            .filter(
              (l) => !l.permission || ctx.permissions.includes(l.permission),
            )
            .map((l) => (
              <Link href={`/${l.path}`} key={l.path}>
                <l.icon size={18} />
                {l.label}
              </Link>
            ))}
        </nav>
        <div className="sidebar-footer">ฝ่ายการเงิน โรงพยาบาลปลวกแดง</div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>{organization}</span>
          <div className="actions">
            <span>{name}</span>
            <ApiForm
              endpoint="auth/logout"
              fields={[]}
              label="ออกจากระบบ"
              redirect="/login"
            />
          </div>
        </header>
        <main id="content" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
