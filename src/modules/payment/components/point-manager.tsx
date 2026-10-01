"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api, confirmAction, showError } from "./api";
import {
  Building2,
  Plus,
  CreditCard,
  AlertTriangle,
  Users,
  QrCode,
  ArrowLeft,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
  Edit3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

type Point = {
  id: string;
  code: string;
  name: string;
  status: string;
  description?: string | null;
  department?: string | null;
  location?: string | null;
  bankAccountId: string;
  openTime?: string | null;
  closeTime?: string | null;
  updatedAt: string;
  users: { userId: string }[];
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    active: boolean;
  };
};

type Lookups = {
  banks: { id: string; bankName: string; code: string; active: boolean; accountNumber?: string }[];
  users: { id: string; displayName: string }[];
};

const statusMap: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "เปิดใช้งาน", bg: "bg-emerald-100", text: "text-emerald-800" },
  INACTIVE: { label: "ปิดใช้งาน", bg: "bg-slate-100", text: "text-slate-700" },
  TEMPORARILY_CLOSED: { label: "ปิดชั่วคราว", bg: "bg-amber-100", text: "text-amber-800" },
  MAINTENANCE: { label: "ปิดปรับปรุงระบบ", bg: "bg-rose-100", text: "text-rose-800" },
};

export function PointManager({
  pointId,
  mode = "list",
}: {
  pointId?: string;
  mode?: "list" | "new" | "edit" | "detail";
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Point[]>([]);
  const [point, setPoint] = useState<Point | null>(null);
  const [lookups, setLookups] = useState<Lookups>({ banks: [], users: [] });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [staffBusy, setStaffBusy] = useState(false);

  useEffect(() => {
    let live = true;

    Promise.all([
      api<{ items: Point[]; total: number }>("points?page=" + page),
      api<Lookups>("lookups"),
      pointId ? api<Point>("points/" + pointId) : Promise.resolve(null),
    ])
      .then(([r, l, p]) => {
        if (live) {
          setRows(r.items || []);
          setTotal(r.total || 0);
          setLookups(l || { banks: [], users: [] });
          setPoint(p);
        }
      })
      .catch((e) => {
        if (live) setError(e.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [pointId, page]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);

    const rawCode = (f.get("code") as string || "").trim().toUpperCase();
    const name = (f.get("name") as string || "").trim();
    const bankAccountId = (f.get("bankAccountId") as string || "").trim();
    const status = (f.get("status") as string || "").trim();

    if (!rawCode) {
      await Swal.fire({ title: "กรอกรหัสจุดชำระเงิน", text: "กรุณาระบุรหัสจุดรับชำระ (เช่น P01)", icon: "warning" });
      return;
    }
    if (!name) {
      await Swal.fire({ title: "กรอกชื่อจุดชำระเงิน", text: "กรุณาระบุชื่อจุดรับชำระ (เช่น ห้องการเงิน ชั้น 1)", icon: "warning" });
      return;
    }
    if (!bankAccountId) {
      await Swal.fire({
        title: "ยังไม่ได้เลือกบัญชีรับเงิน",
        text: lookups.banks.length === 0
          ? "ระบบยังไม่มีบัญชีรับเงินในระบบ กรุณาเพิ่มบัญชีรับเงินก่อนสร้างจุดชำระเงิน"
          : "กรุณาเลือกบัญชีรับเงินที่เปิดใช้งาน",
        icon: "warning",
      });
      return;
    }

    const code = rawCode.replace(/[^A-Z0-9_-]/g, "_");

    const confirmTitle = pointId
      ? `ยืนยันการแก้ไขจุดชำระเงิน "${name}"?`
      : `ยืนยันการเพิ่มจุดชำระเงิน "${name}"?`;

    if (!(await confirmAction(confirmTitle))) return;

    setBusy(true);

    try {
      const data = {
        code,
        name,
        description: (f.get("description") as string || "").trim() || null,
        department: (f.get("department") as string || "").trim() || null,
        location: (f.get("location") as string || "").trim() || null,
        bankAccountId,
        status,
        openTime: (f.get("openTime") as string || "").trim() || null,
        closeTime: (f.get("closeTime") as string || "").trim() || null,
        ...(point ? { expectedUpdatedAt: point.updatedAt } : {}),
      };

      const result = await api<{ id: string }>(
        "points" + (pointId ? "/" + pointId : ""),
        pointId ? "PATCH" : "POST",
        data
      );

      await Swal.fire({
        title: "บันทึกข้อมูลเรียบร้อยแล้ว",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/admin/payment-points/" + result.id);
    } catch (e) {
      await showError(e);
    } finally {
      setBusy(false);
    }
  }

  async function staff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!point) return;
    if (!(await confirmAction("บันทึกการมอบหมายเจ้าหน้าที่ประจำจุดรับชำระ?"))) return;

    setStaffBusy(true);
    try {
      const userIds = new FormData(event.currentTarget).getAll("userIds");
      await api("points/" + point.id + "/staff", "POST", {
        userIds,
        expectedUpdatedAt: point.updatedAt,
      });

      const updated = await api<Point>("points/" + point.id);
      setPoint(updated);

      await Swal.fire({
        title: "บันทึกเจ้าหน้าที่เรียบร้อยแล้ว",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      await showError(e);
    } finally {
      setStaffBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-teal-600" />
            จัดการจุดรับชำระเงิน
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            สร้าง กำหนดเจ้าหน้าที่ และมอบหมายจุดชำระเงินสำหรับออก QR Code
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/payment-points"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              mode === "list"
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            รายการจุดรับชำระ
          </Link>
          <Link
            href="/admin/payment-points/new"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              mode === "new"
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            }`}
          >
            <Plus className="w-4 h-4" />
            เพิ่มจุดใหม่
          </Link>
          <Link
            href="/admin/payment-banks"
            className="px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-slate-500" />
            บัญชีรับเงิน
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลจุดรับชำระเงิน...</p>
        </div>
      ) : (
        <>
          {/* LIST MODE */}
          {mode === "list" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  จุดรับชำระเงินทั้งหมด ({total} รายการ)
                </span>
                <Link
                  href="/admin/payment-points/new"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มจุดชำระเงิน
                </Link>
              </div>

              {rows.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">ยังไม่มีจุดรับชำระเงิน</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                      ผู้ดูแลต้องสร้างและกำหนดจุดรับชำระเงินก่อน จึงจะสามารถสร้าง QR Code สแกนจ่ายและเปิดกะการรับชำระได้
                    </p>
                  </div>
                  <Link
                    href="/admin/payment-points/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    สร้างจุดรับชำระเงินแรก
                  </Link>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">รหัสจุด</th>
                          <th className="py-3 px-4">ชื่อจุดรับชำระเงิน</th>
                          <th className="py-3 px-4">สถานที่/แผนก</th>
                          <th className="py-3 px-4">สถานะ</th>
                          <th className="py-3 px-4 text-right">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((p) => {
                          const st = statusMap[p.status] || {
                            label: p.status,
                            bg: "bg-slate-100",
                            text: "text-slate-700",
                          };
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                                {p.code}
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-800">
                                {p.name}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-500">
                                {p.location || p.department || "-"}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}
                                >
                                  {st.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <Link
                                  href={`/admin/payment-points/${p.id}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 transition-colors"
                                >
                                  ดูรายละเอียด
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      หน้า {page} (รวม {total} รายการ)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1.5 rounded border border-slate-300 bg-white font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> ก่อนหน้า
                      </button>
                      <button
                        disabled={page * 20 >= total}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1.5 rounded border border-slate-300 bg-white font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        ถัดไป <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* DETAIL MODE */}
          {mode === "detail" && point && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/admin/payment-points" className="hover:text-slate-800 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> กลับหน้ารายการจุด
                </Link>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">{point.name}</h2>
                      <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-md">
                        {point.code}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusMap[point.status]?.bg || "bg-slate-100"
                        } ${statusMap[point.status]?.text || "text-slate-700"}`}
                      >
                        {statusMap[point.status]?.label || point.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      {point.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {point.location}
                        </span>
                      )}
                      {point.department && <span>• แผนก {point.department}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/payment-points/${point.id}/edit`}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> แก้ไขข้อมูล
                    </Link>
                    <Link
                      href={`/admin/payment-points/${point.id}/qr`}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" /> พิมพ์โปสเตอร์ QR
                    </Link>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">บัญชีธนาคารรับเงิน</span>
                    <span className="font-semibold text-slate-800">
                      {point.bankAccount?.bankName || "ยังไม่ระบุ"} ({point.bankAccount?.accountNumber || "-"})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">เวลาทำการเปิด-ปิด</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {point.openTime && point.closeTime
                        ? `${point.openTime} - ${point.closeTime} น.`
                        : "เปิดตลอด 24 ชั่วโมง"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">การเปลี่ยน Token QR</span>
                    <button
                      onClick={async () => {
                        if (
                          await confirmAction(
                            "รีเซ็ต QR Token ใหม่? (โปสเตอร์ QR เดิมที่พิมพ์ออกไปจะใช้งานไม่ได้ทันที)"
                          )
                        ) {
                          try {
                            await api("points/" + point.id + "/rotate", "POST", {});
                            await Swal.fire("เปลี่ยน QR Token เรียบร้อยแล้ว", "", "success");
                          } catch (e) {
                            await showError(e);
                          }
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium underline flex items-center gap-1 mt-0.5"
                    >
                      <RefreshCw className="w-3 h-3" /> ออกรหัส QR ใหม่ (Rotate)
                    </button>
                  </div>
                </div>

                {/* Staff Assignment Form */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-teal-700" />
                    <h3 className="text-base font-bold text-slate-800">เจ้าหน้าที่การเงินประจำจุด</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    เลือกเจ้าหน้าที่ที่จะมีสิทธิ์เปิดกะ ตรวจสอบสลิป และออกใบเสร็จสำหรับจุดรับชำระนี้
                  </p>

                  <form key={point.updatedAt} onSubmit={staff} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {lookups.users.map((u) => {
                        const assigned = point.users.some((a) => a.userId === u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                              assigned
                                ? "bg-teal-50 border-teal-300 font-semibold text-teal-900"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="userIds"
                              value={u.id}
                              defaultChecked={assigned}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                            />
                            <span>{u.displayName}</span>
                          </label>
                        );
                      })}
                    </div>
                    {lookups.users.length === 0 && (
                      <p className="text-xs text-slate-400 italic">ไม่มีข้อมูลเจ้าหน้าที่ในระบบ</p>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={staffBusy}
                        className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {staffBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        บันทึกการมอบหมายเจ้าหน้าที่
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* NEW / EDIT FORM MODE */}
          {(mode === "new" || (mode === "edit" && point)) && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/admin/payment-points" className="hover:text-slate-800 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> ยกเลิกและกลับหน้ารายการ
                </Link>
              </div>

              {/* Warning box if bank accounts are missing */}
              {lookups.banks.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>จำเป็นต้องมี &quot;บัญชีรับเงิน&quot; ก่อนสร้างจุดรับชำระ</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    ขณะนี้ยังไม่มีบัญชีธนาคารรับเงินที่เปิดใช้งานในระบบ จุดรับชำระเงินจำเป็นต้องผูกกับบัญชีธนาคารสำหรับสร้าง PromptPay QR
                  </p>
                  <Link
                    href="/admin/payment-banks"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> ไปที่หน้าเพิ่มบัญชีรับเงิน
                  </Link>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  {mode === "new" ? "เพิ่มจุดรับชำระเงินใหม่" : `แก้ไขจุดรับชำระเงิน: ${point?.name}`}
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  กรอกข้อมูลจุดชำระเงิน ผูกกับบัญชีรับเงิน และตั้งค่าสถานะเปิด-ปิด
                </p>

                <form
                  key={point?.updatedAt ?? "new"}
                  onSubmit={submit}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        รหัสจุดรับชำระ (A-Z, 0-9, _, -) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        name="code"
                        required
                        maxLength={40}
                        placeholder="เช่น P01 หรือ CASHIER_01"
                        defaultValue={point?.code ?? ""}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none uppercase"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        ใช้เป็นรหัสอ้างอิงภายในระบบ ตัวอักษรภาษาอังกฤษตัวใหญ่
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อจุดรับชำระเงิน <span className="text-rose-500">*</span>
                      </label>
                      <input
                        name="name"
                        required
                        maxLength={160}
                        placeholder="เช่น จุดรับชำระเงิน ผู้ป่วยนอก (OPD)"
                        defaultValue={point?.name ?? ""}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        แผนกที่รับผิดชอบ
                      </label>
                      <input
                        name="department"
                        maxLength={120}
                        placeholder="เช่น งานการเงินและบัญชี"
                        defaultValue={point?.department ?? ""}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        สถานที่ / อาคาร / ชั้น
                      </label>
                      <input
                        name="location"
                        maxLength={160}
                        placeholder="เช่น อาคารผู้ป่วยนอก ชั้น 1 หน้าห้องยา"
                        defaultValue={point?.location ?? ""}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        รายละเอียดเพิ่มเติม
                      </label>
                      <textarea
                        name="description"
                        maxLength={500}
                        rows={2}
                        placeholder="คำอธิบายเพิ่มเติมสำหรับจุดชำระเงินนี้"
                        defaultValue={point?.description ?? ""}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        บัญชีธนาคารรับเงิน <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="bankAccountId"
                        required
                        defaultValue={point?.bankAccountId ?? ""}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                      >
                        <option value="" disabled>
                          -- เลือกบัญชีธนาคารรับเงิน --
                        </option>
                        {lookups.banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code} · {b.bankName} {!b.active ? "(ปิดใช้งาน)" : ""}
                          </option>
                        ))}
                      </select>
                      {lookups.banks.length === 0 && (
                        <p className="text-xs text-rose-500 mt-1 font-medium">
                          ⚠️ ยังไม่มีบัญชีรับเงิน กรุณาสร้างบัญชีรับเงินก่อน
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        สถานะการใช้งาน
                      </label>
                      <select
                        name="status"
                        defaultValue={point?.status ?? "INACTIVE"}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                      >
                        <option value="ACTIVE">เปิดใช้งาน (ACTIVE)</option>
                        <option value="INACTIVE">ปิดใช้งาน (INACTIVE)</option>
                        <option value="TEMPORARILY_CLOSED">ปิดชั่วคราว (TEMPORARILY_CLOSED)</option>
                        <option value="MAINTENANCE">ปิดปรับปรุงระบบ (MAINTENANCE)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        เวลาเปิดทำการ (ถ้ามี)
                      </label>
                      <input
                        type="time"
                        name="openTime"
                        defaultValue={point?.openTime ?? ""}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        เวลาปิดทำการ (ถ้ามี)
                      </label>
                      <input
                        type="time"
                        name="closeTime"
                        defaultValue={point?.closeTime ?? ""}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Link
                      href="/admin/payment-points"
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      ยกเลิก
                    </Link>
                    <button
                      type="submit"
                      disabled={busy || lookups.banks.length === 0}
                      className="px-6 py-2 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        "บันทึกข้อมูล"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
