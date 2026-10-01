"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Printer, Download, QrCode, Globe, RefreshCw, MapPin } from "lucide-react";
import {
  SupportedLocale,
  getTranslation,
} from "@/modules/payment/i18n/translations";

export interface PointItem {
  id: string;
  code: string;
  name: string;
  department?: string | null;
  location?: string | null;
  status: string;
  qrToken: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    active: boolean;
  };
}

interface QrPosterClientProps {
  initialPoints: PointItem[];
  appUrl: string;
}

export function QrPosterClient({ initialPoints, appUrl }: QrPosterClientProps) {
  const [points] = useState<PointItem[]>(initialPoints);
  const [selectedPointId, setSelectedPointId] = useState<string>(
    initialPoints[0]?.id || "",
  );
  const [locale, setLocale] = useState<SupportedLocale>("th");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(
    Boolean(initialPoints[0]?.id),
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const t = getTranslation(locale);
  const selectedPoint = points.find((p) => p.id === selectedPointId) || points[0];

  useEffect(() => {
    if (!selectedPointId) return;

    let active = true;
    const numAmount = parseFloat(customAmount);
    const amountVal = !isNaN(numAmount) && numAmount > 0 ? numAmount : undefined;

    fetch("/api/v1/payment/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPointId: selectedPointId,
        amount: amountVal,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (active) {
          if (json.success && json.data?.qrDataUrl) {
            setQrDataUrl(json.data.qrDataUrl);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPointId, customAmount]);

  const handlePrint = () => {
    window.print();
  };

  const directUrl = selectedPoint
    ? `${appUrl}/pay/p/${selectedPoint.qrToken}`
    : "";

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="no-print p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <QrCode className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <span>สร้างโปสเตอร์ QR Code ประจำจุดรับชำระ</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              เลือกจุดรับชำระ ภาษา และพิมพ์โปสเตอร์เพื่อตั้งที่เคาน์เตอร์การเงิน
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={!selectedPoint}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Printer className="w-5 h-5" />
              <span>พิมพ์โปสเตอร์ (Print)</span>
            </button>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${selectedPoint?.code || "point"}-promptpay-qr.png`}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด QR (PNG)</span>
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* Point Dropdown Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              เลือกจุดรับชำระเงิน <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPointId}
              onChange={(e) => setSelectedPointId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              {points.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  [{pt.code}] {pt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector (4 Supported Languages) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>ภาษาบนโปสเตอร์ (Poster Language)</span>
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as SupportedLocale)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="th">ไทย (Thai)</option>
              <option value="zh-CN">中文 (Chinese)</option>
              <option value="my">မြန်မာ (Burmese)</option>
              <option value="km">ខ្មែរ (Khmer)</option>
            </select>
          </div>

          {/* Custom Amount (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ระบุยอดเงินคงที่ (บาท - ตัวเลือกเสริม)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="เว้นว่างถ้าเป็น QR ยอดทั่วไป"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Printable Poster Container */}
      {selectedPoint ? (
        <div className="flex justify-center">
          <div className="qr-poster-container bg-white text-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-[540px] text-center space-y-6 mx-auto">
            {/* Header / Logo */}
            <div className="flex flex-col items-center space-y-2">
              <Image
                src="/brand/pdh-finance-logo.png"
                width={110}
                height={110}
                alt="ตราฝ่ายการเงิน โรงพยาบาลปลวกแดง"
                className="mx-auto"
                priority
              />
              <h2 className="text-xl font-extrabold text-teal-800 tracking-tight">
                {t.hospitalName}
              </h2>
              <p className="text-sm font-semibold text-slate-600">
                {t.departmentName}
              </p>
            </div>

            {/* Poster Main Title */}
            <div className="bg-teal-700 text-white py-2.5 px-4 rounded-xl shadow-inner">
              <h1 className="text-lg font-bold">
                {t.headers.makePayment}
              </h1>
            </div>

            {/* Point Info */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">
                {selectedPoint.name}
              </h3>
              {selectedPoint.location && (
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>{selectedPoint.location}</span>
                </p>
              )}
            </div>

            {/* QR Code Display Frame */}
            <div className="flex justify-center my-4">
              <div className="p-4 bg-white border-4 border-teal-700 rounded-2xl shadow-md inline-block">
                {loading ? (
                  <div className="w-[280px] h-[280px] flex items-center justify-center bg-slate-50 rounded-lg">
                    <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`PromptPay QR ${selectedPoint.name}`}
                    className="w-[280px] h-[280px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-[280px] h-[280px] flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-xs">
                    ไม่สามารถโหลด QR Code ได้
                  </div>
                )}
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <p className="font-bold text-teal-800 text-sm mb-1">
                ขั้นตอนการชำระเงิน (Payment Steps):
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>{t.steps.pay}: สแกน QR Code เพื่อโอนเงินผ่าน Mobile Banking</li>
                <li>{t.steps.upload}: ถ่ายภาพหรือแนบสลิปโอนเงินเข้าสู่ระบบ</li>
                <li>{t.steps.confirm}: ตรวจสอบข้อมูลผู้ป่วยและยืนยันการส่ง</li>
                <li>{t.steps.result}: รับรหัสติดตามและรอรับใบเสร็จรับเงิน</li>
              </ol>
            </div>

            {/* Footer & Meta Info */}
            <div className="pt-2 text-xs text-slate-500 border-t border-slate-200 space-y-1">
              <p className="font-mono text-slate-700">
                รหัสจุดรับชำระ: <strong>{selectedPoint.code}</strong>
              </p>
              {directUrl && (
                <p className="font-mono text-[10px] text-slate-400 truncate">
                  {directUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">
            ยังไม่มีข้อมูลจุดรับชำระเงินในระบบ
          </p>
        </div>
      )}

      {/* Embedded Print CSS Rules */}
      <style jsx global>{`
        @media print {
          /* Hide all non-printable layout items: navigation, sidebar, headers */
          body * {
            visibility: hidden;
          }
          .no-print,
          nav,
          header,
          aside {
            display: none !important;
          }
          .qr-poster-container,
          .qr-poster-container * {
            visibility: visible;
          }
          .qr-poster-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 2.5rem !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
