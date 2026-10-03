"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Calculator,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Loader2,
  FileSpreadsheet,
  Coins,
} from "lucide-react";
import { api } from "./api";

type MeterData = {
  year: number;
  ratePerReceipt: number;
  totalVerifiedCount: number;
  totalReceiptedCount: number;
  totalVerifiedAmount: string;
  totalReceiptedAmount: string;
  totalEstimatedBillingFee: string;
  freeQuota: number;
  pointBreakdown: {
    pointId: string;
    pointCode: string;
    pointName: string;
    department: string;
    receiptCount: number;
    verifiedAmount: string;
    estimatedFee: string;
  }[];
  monthlyBreakdown: {
    yearMonth: string;
    receiptCount: number;
    totalAmount: string;
    estimatedFee: string;
  }[];
};

const monthNamesTH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export function ReceiptMeter() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [rate, setRate] = useState<number>(1.0);
  const [data, setData] = useState<MeterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api<MeterData>(`meter?year=${year}&rate=${rate}`)
      .then((res) => {
        if (active) {
          setData(res);
          setError("");
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการดึงข้อมูลตรวจนับใบเสร็จ");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [year, rate]);

  function handleExportCsv() {
    if (!data) return;

    const headers = ["เดือน/ปี", "จำนวนใบเสร็จ (ฉบับ)", "ยอดชำระรวม (บาท)", "ประมาณการค่าบริการ (บาท)"];
    const rows = data.monthlyBreakdown.map((m) => {
      const [y, mm] = m.yearMonth.split("-");
      const monthLabel = `${monthNamesTH[parseInt(mm, 10) - 1]} ${parseInt(y, 10) + 543}`;
      return [monthLabel, m.receiptCount, m.totalAmount, m.estimatedFee];
    });

    const csvContent =
      "\uFEFF" +
      [headers, ...rows].map((e) => e.map((val) => `"${val}"`).join(",")).join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pdhpay-receipt-billing-meter-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
              <Receipt className="w-6 h-6" />
            </div>
            ระบบตรวจนับใบเสร็จ & คิดค่าบริการ (Receipt Metering)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            สรุปปริมาณการออกใบเสร็จรับชำระเงิน คำนวณค่าธรรมเนียมประมวลผล และออกรายงานสรุปสำหรับคิดค่าบริการ
          </p>
        </div>

        {/* Year & Rate Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-700">ปี พ.ศ.</span>
            <select
              value={year}
              onChange={(e) => {
                setLoading(true);
                setYear(Number(e.target.value));
              }}
              className="font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              {[2026, 2025, 2024].map((y) => (
                <option key={y} value={y}>
                  {y + 543} ({y})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-700">อัตราค่าบริการ:</span>
            <select
              value={rate}
              onChange={(e) => {
                setLoading(true);
                setRate(Number(e.target.value));
              }}
              className="font-bold text-teal-800 bg-transparent outline-none cursor-pointer"
            >
              <option value={1.0}>1.00 บาท / ใบเสร็จ</option>
              <option value={0.8}>0.80 บาท / ใบเสร็จ</option>
              <option value={0.5}>0.50 บาท / ใบเสร็จ</option>
              <option value={1.5}>1.50 บาท / ใบเสร็จ</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={!data}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออกไฟล์ CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-500">กำลังประมวลผลการตรวจนับใบเสร็จประจำปี...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ใบเสร็จที่ออกสำเร็จ
                </span>
                <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 font-mono">
                {data.totalReceiptedCount.toLocaleString()}{" "}
                <span className="text-xs font-normal text-slate-500">ฉบับ</span>
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                สถานะ RECEIPTED สมบูรณ์
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ยอดยืนยันชำระเงินรวม
                </span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-700 font-mono">
                ฿{Number(data.totalReceiptedAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500">ผ่าน PromptPay QR และธนาคาร</p>
            </div>

            <div className="bg-gradient-to-br from-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-md space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider">
                  ประมาณการค่าบริการระบบ
                </span>
                <div className="p-2.5 bg-white/10 text-teal-300 rounded-xl backdrop-blur-sm">
                  <Calculator className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white font-mono">
                ฿{Number(data.totalEstimatedBillingFee).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-teal-200/80 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                คำนวณตาม Tier Rate (รวมโควต้าฟรี)
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  โควต้าฟรีประจำปี
                </span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-800 font-mono">
                {data.freeQuota}{" "}
                <span className="text-xs font-normal text-slate-500">ฉบับ/ปี</span>
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">
                ✓ ฟรี 500 ฉบับแรก ไม่คิดค่าธรรมเนียม
              </p>
            </div>
          </div>

          {/* Tier Billing Rule Informational Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-100 text-teal-800 rounded-xl shrink-0 mt-0.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">หลักเกณฑ์การคิดค่าบริการประมวลผลระบบ (Tiered Billing Rules)</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  คิดค่าบริการเฉพาะสลิปที่ยืนยันการรับชำระและออกใบเสร็จสมบูรณ์ โดยแบ่งขั้นอัตราค่าบริการดังนี้:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-semibold border border-emerald-200">
                0 - 500 ฉบับ: ฟรี
              </span>
              <span className="px-3 py-1.5 bg-white text-slate-700 rounded-xl font-semibold border border-slate-200 shadow-sm">
                501 - 2,000 ฉบับ: {rate.toFixed(2)} บาท
              </span>
              <span className="px-3 py-1.5 bg-teal-100 text-teal-800 rounded-xl font-semibold border border-teal-200">
                &gt; 2,000 ฉบับ: {(rate * 0.8).toFixed(2)} บาท (ส่วนลด 20%)
              </span>
            </div>
          </div>

          {/* Monthly Billing Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-800">
                  ตารางสรุปจำนวนใบเสร็จและค่าบริการรายเดือน (ประจำปี พ.ศ. {year + 543})
                </h3>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                รวม 12 เดือน
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">เดือน / ปี</th>
                    <th className="py-3 px-4 text-center">จำนวนใบเสร็จ (ฉบับ)</th>
                    <th className="py-3 px-4 text-right">ยอดรับชำระรวม (บาท)</th>
                    <th className="py-3 px-4 text-right">ประมาณการค่าบริการ (บาท)</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.monthlyBreakdown.map((m) => {
                    const [y, mm] = m.yearMonth.split("-");
                    const monthIndex = parseInt(mm, 10) - 1;
                    const monthName = monthNamesTH[monthIndex];
                    const count = m.receiptCount;
                    const fee = parseFloat(m.estimatedFee);

                    return (
                      <tr key={m.yearMonth} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {monthName} {parseInt(y, 10) + 543}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                          {count > 0 ? count.toLocaleString() : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                          {parseFloat(m.totalAmount) > 0
                            ? `฿${Number(m.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`
                            : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-800">
                          {fee > 0
                            ? `฿${fee.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`
                            : <span className="text-emerald-600 font-semibold">0.00 (ฟรี)</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              count > 0
                                ? "bg-teal-50 text-teal-800 border border-teal-200"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {count > 0 ? "มีรายการ" : "ไม่มีรายการ"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 text-sm border-t-2 border-slate-200">
                  <tr>
                    <td className="py-3.5 px-4">รวมทั้งปี ({year + 543})</td>
                    <td className="py-3.5 px-4 text-center font-mono text-base text-teal-800">
                      {data.totalReceiptedCount.toLocaleString()} ฉบับ
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      ฿{Number(data.totalReceiptedAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-base text-teal-800">
                      ฿{Number(data.totalEstimatedBillingFee).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-normal">
                      สรุปยอดปี {year + 543}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Point Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-teal-700" />
              <h3 className="text-base font-bold text-slate-800">
                จำแนกจำนวนใบเสร็จตามจุดรับชำระเงิน (Payment Point Allocation)
              </h3>
            </div>

            {data.pointBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">ไม่มีข้อมูลใบเสร็จจำแนกตามจุดชำระ</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.pointBreakdown.map((pt) => (
                  <div
                    key={pt.pointId}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 hover:border-teal-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{pt.pointName}</span>
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded">
                        {pt.pointCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">แผนก: {pt.department}</p>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500">จำนวนใบเสร็จ:</span>
                      <span className="font-mono font-bold text-slate-800">{pt.receiptCount.toLocaleString()} ฉบับ</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">ยอดชำระเงินรวม:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ฿{Number(pt.verifiedAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
