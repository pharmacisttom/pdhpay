"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import {
  TableProperties,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export function GoogleSheetsSync({
  configured,
  sheetId = "",
  range = "Payments!A:K",
}: {
  configured: boolean;
  sheetId?: string;
  range?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(!configured);

  const [inputSheetId, setInputSheetId] = useState(sheetId);
  const [inputRange, setInputRange] = useState(range || "Payments!A:K");

  async function sync() {
    setBusy(true);
    try {
      const response = await fetch("/api/v1/payment/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          title: "ซิงก์ข้อมูลสำเร็จ!",
          text: `ส่งออกข้อมูลรายการชำระเงินที่ออกใบเสร็จเรียบร้อยแล้ว จำนวน ${result.data.exported} รายการ`,
          icon: "success",
        });
      } else {
        await Swal.fire({
          title: "การซิงก์ล้มเหลว",
          text: result.error?.message || "ไม่สามารถซิงก์ข้อมูลไปยัง Google Sheets ได้",
          icon: "error",
        });
      }
    } catch {
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถส่งคำขอซิงก์ข้อมูลไปยังเซิร์ฟเวอร์ได้",
        icon: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (saveBusy) return;

    if (!inputSheetId) {
      await Swal.fire({
        title: "กรอกข้อมูลไม่ครบถ้วน",
        text: "กรุณาระบุ Google Spreadsheet ID",
        icon: "warning",
      });
      return;
    }

    setSaveBusy(true);

    try {
      const response = await fetch("/api/v1/payment/sheets/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId: inputSheetId,
          range: inputRange || "Payments!A:K",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "ไม่สามารถบันทึกการตั้งค่าได้");
      }

      await Swal.fire({
        title: "บันทึกการตั้งค่าสำเร็จ",
        text: "ระบบอัปเดตการตั้งค่า Google Sheets เรียบร้อยแล้ว",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowEdit(false);
      window.location.reload();
    } catch (err) {
      await Swal.fire({
        title: "บันทึกล้มเหลว",
        text: err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
      });
    } finally {
      setSaveBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <TableProperties className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">การเชื่อมต่อรายงาน Google Sheets</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                ส่งออกข้อมูลรายการที่ออกใบเสร็จรับเงินแล้วไปยัง Google Sheets แบบ Real-time หรือเลือกซิงก์ด้วยตนเอง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEdit(!showEdit)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              {showEdit ? "ซ่อนแบบฟอร์ม" : "แก้ไขการตั้งค่า"}
            </button>
            <button
              type="button"
              disabled={!configured || busy}
              onClick={() => void sync()}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              ซิงก์รายการล่าสุด
            </button>
          </div>
        </div>

        {/* Status Info Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">สถานะการเชื่อมต่อ</span>
            {configured ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                พร้อมใช้งาน (ตั้งค่า Spreadsheet ID แล้ว)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                ยังไม่ได้ตั้งค่า Spreadsheet ID
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Google Spreadsheet ID</span>
            <span className="font-mono text-slate-800 font-medium truncate block">
              {sheetId || "ยังไม่ได้ตั้งค่า"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">ช่วงข้อมูล (Sheet Range)</span>
            <span className="font-mono font-semibold text-slate-800 block">
              {range || "Payments!A:K"}
            </span>
          </div>
        </div>
      </div>

      {/* EDIT CONFIGURATION FORM CARD */}
      {showEdit && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Edit3 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              ตั้งค่า / แก้ไขการเชื่อมต่อ Google Sheets
            </h2>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Spreadsheet ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 1X2Y3Z4A5B6C7D8E9F0G (คัดลอกจาก URL ของไฟล์ Google Sheets)"
                  value={inputSheetId}
                  onChange={(e) => setInputSheetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  คัดลอก ID จากลิงก์ Google Sheets: https://docs.google.com/spreadsheets/d/<strong>[ID_อยู่ตรงนี้]</strong>/edit
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ช่วงข้อมูล / ชื่อแท็บชีต (Sheet Range) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Payments!A:K หรือ Sheet1!A:K"
                  value={inputRange}
                  onChange={(e) => setInputRange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  กำหนดชื่อแผ่นงานและคอลัมน์ที่จะเขียนข้อมูล เช่น Payments!A:K
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saveBusy}
                className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {saveBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                บันทึกการตั้งค่า Google Sheets
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
