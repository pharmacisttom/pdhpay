"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Landmark,
  Plus,
  Edit3,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Building2,
  Search,
  CreditCard,
  X,
  Loader2,
} from "lucide-react";
import { api, confirmAction, showError } from "./api";

type Bank = {
  id: string;
  code: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  active: boolean;
};

// Thai Bank Brand Palette & Logos/Badges
const bankStyles: Record<string, { bg: string; text: string; badgeBg: string; border: string }> = {
  กรุงไทย: { bg: "bg-sky-500", text: "text-white", badgeBg: "bg-sky-50 text-sky-700", border: "border-sky-200" },
  กสิกรไทย: { bg: "bg-emerald-600", text: "text-white", badgeBg: "bg-emerald-50 text-emerald-700", border: "border-emerald-200" },
  ไทยพาณิชย์: { bg: "bg-purple-600", text: "text-white", badgeBg: "bg-purple-50 text-purple-700", border: "border-purple-200" },
  กรุงเทพ: { bg: "bg-blue-800", text: "text-white", badgeBg: "bg-blue-50 text-blue-800", border: "border-blue-200" },
  ออมสิน: { bg: "bg-pink-600", text: "text-white", badgeBg: "bg-pink-50 text-pink-700", border: "border-pink-200" },
  กรุงศรี: { bg: "bg-amber-500", text: "text-white", badgeBg: "bg-amber-50 text-amber-800", border: "border-amber-200" },
  ttb: { bg: "bg-orange-500", text: "text-white", badgeBg: "bg-orange-50 text-orange-700", border: "border-orange-200" },
  ธนชาต: { bg: "bg-orange-600", text: "text-white", badgeBg: "bg-orange-50 text-orange-700", border: "border-orange-200" },
};

export function Banks() {
  const [rows, setRows] = useState<Bank[]>([]);
  const [selected, setSelected] = useState<Bank | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBanks();
  }, []);

  async function loadBanks() {
    setLoading(true);
    try {
      const data = await api<Bank[]>("banks");
      setRows(data || []);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการโหลดข้อมูลบัญชีรับเงิน");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setSelected(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(bank: Bank) {
    setSelected(bank);
    setIsModalOpen(true);
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const code = (f.get("code") as string || "").trim().toUpperCase();
    const bankName = (f.get("bankName") as string || "").trim();
    const accountName = (f.get("accountName") as string || "").trim();
    const accountNumber = (f.get("accountNumber") as string || "").trim();
    const active = f.get("active") === "on";

    if (!code || !bankName || !accountName || !accountNumber) {
      await Swal.fire({
        title: "กรอกข้อมูลไม่ครบถ้วน",
        text: "กรุณากรอกรหัสบัญชี, ชื่อธนาคาร, ชื่อบัญชี และเลขที่บัญชีให้ครบถ้วน",
        icon: "warning",
      });
      return;
    }

    const actionText = selected ? `ยืนยันการแก้ไขบัญชี "${bankName}"?` : `ยืนยันการเพิ่มบัญชีรับเงิน "${bankName}"?`;
    if (!(await confirmAction(actionText))) return;

    setBusy(true);
    try {
      await api(
        "banks" + (selected ? "/" + selected.id : ""),
        selected ? "PATCH" : "POST",
        { code, bankName, accountName, accountNumber, active }
      );

      await loadBanks();
      setIsModalOpen(false);
      setSelected(null);

      await Swal.fire({
        title: "บันทึกบัญชีรับเงินเรียบร้อยแล้ว",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await showError(error);
    } finally {
      setBusy(false);
    }
  }

  const filteredRows = rows.filter(
    (b) =>
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accountNumber.includes(searchQuery)
  );

  const activeCount = rows.filter((r) => r.active).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Landmark className="w-6 h-6" />
            </div>
            บัญชีธนาคารรับเงิน (Bank Accounts)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการบัญชีธนาคารสำหรับสร้าง PromptPay QR Code และรับชำระเงินของโรงพยาบาล
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          เพิ่มบัญชีรับเงินใหม่
        </button>
      </div>

      {/* Stats & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">บัญชีทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{rows.length} บัญชี</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">เปิดใช้งานอยู่</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{activeCount} บัญชี</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ปิดใช้งาน</p>
            <p className="text-2xl font-bold text-slate-400 mt-0.5">{rows.length - activeCount} บัญชี</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหาชื่อธนาคาร, ชื่อบัญชี, เลขบัญชี..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          แสดง {filteredRows.length} จาก {rows.length} บัญชี
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-500">กำลังโหลดรายการบัญชีรับเงิน...</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">ไม่พบรายการบัญชีรับเงิน</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? "ไม่พบข้อมูลที่ตรงกับคำค้นหา" : "ยังไม่มีการเพิ่มบัญชีรับเงินในระบบ กดปุ่มด้านล่างเพื่อเริ่มเพิ่มบัญชี"}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-xl hover:bg-teal-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> เพิ่มบัญชีรับเงิน
            </button>
          )}
        </div>
      ) : (
        /* Bank Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRows.map((b) => {
            const style = bankStyles[b.bankName] || {
              bg: "bg-slate-700",
              text: "text-white",
              badgeBg: "bg-slate-100 text-slate-800",
              border: "border-slate-200",
            };

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl border ${style.border} shadow-sm hover:shadow-md transition-all p-5 space-y-4 relative overflow-hidden group`}
              >
                {/* Top Banner Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${style.bg} ${style.text} flex items-center justify-center font-bold text-sm shadow-sm shrink-0`}>
                      {b.code.slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{b.bankName}</h3>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${style.badgeBg}`}>
                          {b.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{b.accountName}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      b.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${b.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {b.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </div>

                {/* Account Number Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans block uppercase tracking-wider">เลขที่บัญชี</span>
                    <span className="text-base font-bold text-slate-800 tracking-wide">{b.accountNumber}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(b.accountNumber, b.id)}
                    className="p-2 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                    title="คัดลอกเลขบัญชี"
                  >
                    {copiedId === b.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    แก้ไขข้อมูลบัญชี
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Slide-Over / Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selected ? "แก้ไขบัญชีรับเงิน" : "เพิ่มบัญชีรับเงินใหม่"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selected ? `รหัสบัญชี: ${selected.code}` : "กรอกข้อมูลบัญชีธนาคารสำหรับสร้าง PromptPay QR"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสบัญชี (Bank Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  name="code"
                  required
                  maxLength={30}
                  placeholder="เช่น KTB01 หรือ KBANK_MAIN"
                  defaultValue={selected?.code ?? ""}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white uppercase"
                />
                <p className="text-[11px] text-slate-400 mt-1">ใช้เป็นรหัสอ้างอิงของบัญชีรับเงินในระบบ</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อธนาคาร <span className="text-rose-500">*</span>
                </label>
                <input
                  name="bankName"
                  required
                  maxLength={120}
                  placeholder="เช่น กรุงไทย, กสิกรไทย, ไทยพาณิชย์"
                  defaultValue={selected?.bankName ?? ""}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อบัญชีธนาคาร <span className="text-rose-500">*</span>
                </label>
                <input
                  name="accountName"
                  required
                  maxLength={160}
                  placeholder="เช่น เงินรายได้โรงพยาบาลปลวกแดง"
                  defaultValue={selected?.accountName ?? ""}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลขที่บัญชี / PromptPay ID <span className="text-rose-500">*</span>
                </label>
                <input
                  name="accountNumber"
                  required
                  maxLength={50}
                  placeholder="เช่น 980-6-89579-0 หรือ เลขประจำตัวผู้เสียภาษี 13 หลัก"
                  defaultValue={selected?.accountNumber ?? ""}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={selected ? selected.active : true}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">เปิดใช้งานบัญชีรับเงินนี้ (Active)</span>
                    <span className="text-[11px] text-slate-400">อนุญาตให้ผูกกับจุดรับชำระเงินเพื่อสร้าง QR สแกนจ่าย</span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 bg-teal-700 text-white rounded-xl text-sm font-semibold hover:bg-teal-800 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
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
    </div>
  );
}
