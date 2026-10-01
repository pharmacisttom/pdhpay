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
  CheckCircle2,
  Clock,
  MapPin,
  Landmark,
} from "lucide-react";
import type { Context } from "@/core/auth/authorization";
import { ApiForm } from "@/components/shared/api-form";

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission: string | null;
};

type NavGroup = {
  category: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    category: "ภาพรวมระบบ",
    items: [
      {
        path: "finance",
        label: "แดชบอร์ดการเงิน",
        icon: LayoutDashboard,
        permission: "payment.dashboard.read",
      },
      {
        path: "dashboard",
        label: "ภาพรวมระบบ",
        icon: LayoutDashboard,
        permission: null,
      },
    ],
  },
  {
    category: "ระบบการเงิน & จุดสแกน",
    items: [
      {
        path: "finance/review",
        label: "ตรวจสอบสลิปการเงิน",
        icon: CheckCircle2,
        permission: "payment.verify",
      },
      {
        path: "finance/shifts",
        label: "จัดการกะการทำงาน",
        icon: Clock,
        permission: "payment.verify",
      },
      {
        path: "admin/payment-points",
        label: "จุดรับชำระเงิน",
        icon: MapPin,
        permission: "payment.admin.manage",
      },
      {
        path: "admin/payment-banks",
        label: "บัญชีธนาคาร",
        icon: Landmark,
        permission: "payment.admin.manage",
      },
    ],
  },
  {
    category: "รายงาน & การเชื่อมต่อ",
    items: [
      {
        path: "admin/google-sheets",
        label: "Google Sheets Sync",
        icon: TableProperties,
        permission: "payment.report.export",
      },
      {
        path: "admin/google-drive",
        label: "Google Drive Sync",
        icon: HardDrive,
        permission: "payment.admin.manage",
      },
    ],
  },
  {
    category: "บริหารจัดการ & สิทธิ์",
    items: [
      {
        path: "admin/users",
        label: "จัดการสิทธิ์ผู้ใช้",
        icon: Users,
        permission: "admin.users.manage",
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
        path: "admin/departments",
        label: "จัดการแผนก",
        icon: Building2,
        permission: "payment.admin.manage",
      },
      {
        path: "organizations",
        label: "ข้อมูลองค์กร",
        icon: Building2,
        permission: "organizations.view",
      },
      {
        path: "audit",
        label: "บันทึกการใช้งาน (Logs)",
        icon: ScrollText,
        permission: "audit.view",
      },
      {
        path: "settings",
        label: "ตั้งค่าระบบ",
        icon: Settings,
        permission: null,
      },
    ],
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
        <nav aria-label="Main navigation" className="sidebar-nav">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) =>
                !item.permission || ctx.permissions.includes(item.permission),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.category} className="sidebar-group">
                <div className="sidebar-group-title">{group.category}</div>
                <div className="sidebar-group-items">
                  {visibleItems.map((l) => (
                    <Link href={`/${l.path}`} key={l.path}>
                      <l.icon size={18} />
                      <span>{l.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
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
