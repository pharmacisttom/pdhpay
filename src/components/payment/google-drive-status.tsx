"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Loader2,
  ShieldCheck,
  Eye,
} from "lucide-react";

export function GoogleDriveStatus({
  configured,
  clientEmail = "",
  folderId = "",
  sharedDriveId = "",
  visionEnabled = false,
}: {
  configured: boolean;
  clientEmail?: string;
  folderId?: string;
  sharedDriveId?: string;
  visionEnabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(!configured);

  const [inputEmail, setInputEmail] = useState(clientEmail);
  const [inputPrivateKey, setInputPrivateKey] = useState("");
  const [inputFolderId, setInputFolderId] = useState(folderId);
  const [inputSharedDriveId, setInputSharedDriveId] = useState(sharedDriveId);
  const [inputVisionEnabled, setInputVisionEnabled] = useState(visionEnabled);

  async function testConnection() {
    setBusy(true);
    try {
      const response = await fetch("/api/v1/payment/drive/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json();
      if (result.success) {
        await Swal.fire({
          title: "เชื่อมต่อสำเร็จ!",
          text: `เชื่อมต่อกับโฟลเดอร์ "${result.data.folderName}" เรียบร้อยแล้ว (การตั้งค่าสิทธิ์โฟลเดอร์เป็น Private)`,
          icon: "success",
        });
      } else {
        await Swal.fire({
          title: "การเชื่อมต่อล้มเหลว",
          text: result.error?.message || "ไม่สามารถเชื่อมต่อ Google Drive ได้",
          icon: "error",
        });
      }
    } catch {
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถส่งคำขอตรวจสอบไปยังเซิร์ฟเวอร์ได้",
        icon: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (saveBusy) return;

    if (!inputEmail || !inputFolderId) {
      await Swal.fire({
        title: "กรอกข้อมูลไม่ครบถ้วน",
        text: "กรุณาระบุ Service Account Email และ Folder ID",
        icon: "warning",
      });
      return;
    }

    setSaveBusy(true);

    try {
      const response = await fetch("/api/v1/payment/drive/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: inputEmail,
          privateKey: inputPrivateKey || undefined,
          folderId: inputFolderId,
          sharedDriveId: inputSharedDriveId || undefined,
          visionEnabled: inputVisionEnabled,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "ไม่สามารถบันทึกการตั้งค่าได้");
      }

      await Swal.fire({
        title: "บันทึกการตั้งค่าสำเร็จ",
        text: "ระบบอัปเดตการตั้งค่า Google Drive เรียบร้อยแล้ว",
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
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
              <HardDrive className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">พื้นที่จัดเก็บสลิป (Google Drive)</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                จัดเก็บไฟล์สลิปโอนเงินแยกโฟลเดอร์ตามปี / เดือน / วัน / จุดรับชำระ อย่างปลอดภัย
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
              onClick={() => void testConnection()}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              ทดสอบการเชื่อมต่อ
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
                พบข้อมูล Credentials และ Folder ID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                ยังตั้งค่าไม่ครบถ้วน
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Service Account Email</span>
            <span className="font-mono text-slate-800 font-medium truncate block">
              {clientEmail || "ยังไม่ตั้งค่า"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Google Vision OCR (สแกนสลิป)</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              {visionEnabled ? "เปิดใช้งาน OCR ดึงยอดเงินอัตโนมัติ" : "ปิดใช้งาน"}
            </span>
          </div>
        </div>
      </div>

      {/* EDIT CONFIGURATION FORM CARD */}
      {showEdit && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Edit3 className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              ตั้งค่า / แก้ไขการเชื่อมต่อ Google Drive & Vision OCR
            </h2>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Service Account Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="เช่น pdh-service-account@pdhpay.iam.gserviceaccount.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Drive Folder ID (สำหรับจัดเก็บสลิป) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 1A2B3C4D5E6F7G8H9I0J"
                  value={inputFolderId}
                  onChange={(e) => setInputFolderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shared Drive ID (ระบุหากใช้ Google Shared Drive)
                </label>
                <input
                  type="text"
                  placeholder="ระบุ Shared Drive ID (ถ้ามี)"
                  value={inputSharedDriveId}
                  onChange={(e) => setInputSharedDriveId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Cloud Vision API (อ่านข้อมูลสลิปอัตโนมัติ)
                </label>
                <label className="flex items-center gap-2 p-2.5 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={inputVisionEnabled}
                    onChange={(e) => setInputVisionEnabled(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>เปิดใช้ OCR ดึงยอดเงินจากสลิปอัตโนมัติ</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Service Account Private Key (PEM Format)
                </label>
                <textarea
                  rows={4}
                  placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY----- (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)"
                  value={inputPrivateKey}
                  onChange={(e) => setInputPrivateKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  วาง Private Key ฉบับเต็มที่คัดลอกจากไฟล์ JSON ของ Google Cloud Console
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
                className="px-5 py-2 bg-teal-700 text-white rounded-lg text-xs font-semibold hover:bg-teal-800 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {saveBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                บันทึกการตั้งค่า Google Drive
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
