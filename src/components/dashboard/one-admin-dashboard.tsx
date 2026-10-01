import Link from "next/link";
import {
  Users,
  Shield,
  ScrollText,
  Activity,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface OneAdminDashboardProps {
  data: Record<string, unknown>;
}

export function OneAdminDashboard({ data }: OneAdminDashboardProps) {
  const usersCount = data.users === null ? 0 : Number(data.users) || 0;
  const rolesCount = data.roles === null ? 0 : Number(data.roles) || 0;
  const eventsCount = data.events === null ? 0 : Number(data.events) || 0;

  return (
    <div className="space-y-6 animate-fade-in" lang="th">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-teal-800/40">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold tracking-wide uppercase border border-teal-400/30 mb-2">
            <Activity size={13} /> PDH SMART PAYMENT ADMIN CORE
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            ภาพรวมระบบและการบริหารจัดการ
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            แดชบอร์ดสรุปสถิติบัญชีผู้ใช้ สิทธิ์การใช้งาน และประวัติกิจกรรมในองค์กรโรงพยาบาลปลวกแดง
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/finance/review"
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>ตรวจคิวสลิป</span>
          </Link>
          <Link
            href="/audit"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/20 flex items-center gap-2"
          >
            <ScrollText size={16} />
            <span>Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Metric Cards (Ant Design One-Template Inspired) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Blue - Active Users */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
              <TrendingUp size={12} /> Active
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {usersCount}
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              บุคลากรและผู้ใช้งานในระบบ
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>บัญชีในองค์กร</span>
            <Link href="/users" className="text-blue-600 hover:underline flex items-center gap-0.5">
              จัดการ <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card 2: Dark Slate - Roles & Permissions */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 group text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield size={24} />
            </div>
            <span className="text-xs font-semibold text-slate-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
              Security Matrix
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {rolesCount}
            </span>
            <p className="text-sm font-medium text-slate-300">
              บทบาทและกำหนดสิทธิ์ผู้ใช้
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>กำหนดสิทธิ์การเข้าถึง</span>
            <Link href="/roles" className="text-teal-400 hover:underline flex items-center gap-0.5">
              แก้ไขสิทธิ์ <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card 3: Amber Gold - Pending Slips / Shift Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
              OPD / IPD Counter
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              พร้อมรับสลิป
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              จุดรับชำระเงินและกะการทำงาน
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>กะเปิดทำการ</span>
            <Link href="/finance/shifts" className="text-amber-600 hover:underline flex items-center gap-0.5">
              จัดการกะ <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card 4: Crimson Red - Audit Logs & Events */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScrollText size={24} />
            </div>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800/50">
              System Audit
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {eventsCount}
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              บันทึกประวัติกิจกรรมทั้งหมด
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>กิจกรรมในระบบ</span>
            <Link href="/audit" className="text-rose-600 hover:underline flex items-center gap-0.5">
              ดูประวัติ <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Content Layout: Main Feed & System Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Quick Operations & Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Access Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  ระบบงานการเงินและการตรวจสอบ
                </h2>
                <p className="text-xs text-slate-500">
                  ทางลัดการเข้าถึงงานการเงินและรายงานของโรงพยาบาล
                </p>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg font-medium">
                Quick Actions
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Link
                href="/finance/review"
                className="p-4 rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-100/60 dark:hover:bg-teal-900/40 transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-3 shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    ตรวจสอบสลิป
                  </span>
                  <span className="text-xs text-slate-500">อนุมัติคิวสลิปชำระ</span>
                </div>
              </Link>

              <Link
                href="/finance/shifts"
                className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    จัดการกะประจำวัน
                  </span>
                  <span className="text-xs text-slate-500">เปิด-ปิดกะเคาน์เตอร์</span>
                </div>
              </Link>

              <Link
                href="/admin/payment-points"
                className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-3 shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    จุดรับชำระเงิน
                  </span>
                  <span className="text-xs text-slate-500">จัดการ OPD/IPD</span>
                </div>
              </Link>

              <Link
                href="/admin/google-sheets"
                className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <ExternalLink size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    Google Sheets
                  </span>
                  <span className="text-xs text-slate-500">ซิงค์รายงานประจำวัน</span>
                </div>
              </Link>

              <Link
                href="/admin/google-drive"
                className="p-4 rounded-xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/60 dark:hover:bg-sky-900/40 transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center mb-3 shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
                  <Building2 size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    Google Drive
                  </span>
                  <span className="text-xs text-slate-500">จัดเก็บสลิปการเงิน</span>
                </div>
              </Link>

              <Link
                href="/audit"
                className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-all group flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center mb-3 shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
                  <ScrollText size={20} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    Audit Logs
                  </span>
                  <span className="text-xs text-slate-500">ตรวจสอบประวัติการใช้งาน</span>
                </div>
              </Link>
            </div>
          </div>

          {/* System Environment & Status Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              ข้อมูลสภาพแวดล้อมระบบ (System Architecture)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 flex justify-between items-center">
                <span className="text-slate-500 font-medium">ชื่อระบบ:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {String(data.product || "PDH Payment System")}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 flex justify-between items-center">
                <span className="text-slate-500 font-medium">เวอร์ชัน (Version):</span>
                <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-1 rounded">
                  v{String(data.version || "0.1.0")}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 flex justify-between items-center">
                <span className="text-slate-500 font-medium">สภาพแวดล้อม (Environment):</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {String(data.environment || "Production Ready")}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 flex justify-between items-center">
                <span className="text-slate-500 font-medium">การเชื่อมต่อ DB:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> MySQL Connected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Organization Profile & Security Card */}
        <div className="space-y-6">
          {/* Hospital Profile Card */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-md border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xl border border-teal-400/30">
                PDH
              </div>
              <div>
                <h3 className="font-bold text-base text-white">โรงพยาบาลปลวกแดง</h3>
                <p className="text-xs text-teal-300 font-medium">ระบบการเงินอัจฉริยะ (PDHPAY)</p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-teal-400" /> ที่ตั้ง:</span>
                <span>อ.ปลวกแดง จ.ระยอง</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-teal-400" /> วันเวลาทำรายการ:</span>
                <span>{new Date().toLocaleDateString("th-TH")}</span>
              </div>
            </div>

            <div className="mt-5">
              <Link
                href="/organizations"
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 border border-white/15"
              >
                <span>จัดการข้อมูลองค์กร</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Account Security Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">ความปลอดภัยบัญชี</h3>
                <p className="text-xs text-slate-500">2FA & Session Security</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              การยืนยันตัวตน 2 ปัจจัย (Two-Factor Authentication) และระบบเปลี่ยนรหัสผ่านเพื่อความปลอดภัยในการเข้าถึงข้อมูลการเงิน
            </p>

            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-all"
            >
              <span>เปิดการตั้งค่าความปลอดภัย</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
