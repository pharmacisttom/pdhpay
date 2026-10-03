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
  Bell,
  SlidersHorizontal,
  Home,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import type { Context } from "@/core/auth/authorization";
import { ApiForm } from "@/components/shared/api-form";
import { TomvisFooter } from "@/components/layout/tomvis-footer";

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission: string | null;
  badge?: string;
  badgeColor?: string;
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
        icon: Home,
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
        badge: "รอตรวจ",
        badgeColor: "bg-amber-500 text-white",
      },
      {
        path: "finance/shifts",
        label: "จัดการกะการทำงาน",
        icon: Clock,
        permission: "payment.verify",
        badge: "กะเปิด",
        badgeColor: "bg-emerald-500 text-white",
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
        path: "admin/receipt-meter",
        label: "นับใบเสร็จ & คิดค่าบริการ",
        icon: Receipt,
        permission: "payment.report.read",
        badge: "NEW",
        badgeColor: "bg-teal-600 text-white",
      },
      {
        path: "admin/google-sheets",
        label: "Google Sheets Sync",
        icon: TableProperties,
        permission: "payment.report.export",
        badge: "LIVE",
        badgeColor: "bg-blue-600 text-white",
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
  const initial = name ? name.charAt(0).toUpperCase() : "U";

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
            width={76}
            height={76}
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
                    <Link href={`/${l.path}`} key={l.path} className="nav-item-link">
                      <div className="flex items-center gap-3">
                        <l.icon size={18} />
                        <span>{l.label}</span>
                      </div>
                      {l.badge && (
                        <span className={`nav-badge ${l.badgeColor || "bg-sky-500 text-white"}`}>
                          {l.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="font-semibold text-white/90">โรงพยาบาลปลวกแดง</p>
          <p className="text-xs text-white/60">PDH Payment Core v1.0</p>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <Link href="/dashboard" className="topbar-tab active">
              <Home size={15} />
              <span>หน้าแรก</span>
            </Link>
            <Link href="/finance" className="topbar-tab">
              <LayoutDashboard size={15} />
              <span>การเงิน</span>
            </Link>
            <Link href="/finance/review" className="topbar-tab">
              <Receipt size={15} />
              <span>คิวสลิป</span>
            </Link>
            <Link href="/admin/google-sheets" className="topbar-tab">
              <FileSpreadsheet size={15} />
              <span>รายงาน</span>
            </Link>
          </div>

          <div className="topbar-right">
            <div className="topbar-icon-btn relative" title="การแจ้งเตือน">
              <Bell size={18} />
              <span className="topbar-unread-badge">3</span>
            </div>

            <Link href="/settings" className="topbar-icon-btn" title="ตั้งค่า">
              <SlidersHorizontal size={18} />
            </Link>

            <div className="topbar-divider" />

            <div className="user-profile-badge">
              <div className="user-avatar-circle">{initial}</div>
              <div className="user-info-text">
                <span className="user-name">{name}</span>
                <span className="user-org">{organization}</span>
              </div>
            </div>

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
          <TomvisFooter />
        </main>
      </div>
    </div>
  );
}
