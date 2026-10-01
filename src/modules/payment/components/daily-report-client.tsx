"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  RefreshCw,
} from "lucide-react";

export interface PointReportItem {
  paymentPointId: string;
  pointCode: string;
  pointName: string;
  department: string;
  location: string;
  status: string;
  transactionCount: number;
  totalRevenue: number;
}

export interface DailyReportData {
  date: string;
  totalRevenue: number;
  totalTransactions: number;
  points: PointReportItem[];
}

export function DailyReportClient({ initialDate }: { initialDate: string }) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [data, setData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/v1/payment/reports/daily?date=${selectedDate}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((json) => {
        if (active) {
          if (json.success && json.data) {
            setData(json.data as DailyReportData);
            setError(null);
          } else {
            setError(json.error?.message || "ไม่สามารถโหลดข้อมูลรายงานได้");
          }
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ",
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDate]);

  const handleExportCsv = () => {
    if (!data || !data.points.length) return;

    const headers = [
      "รหัสจุดรับชำระ",
      "ชื่อจุดรับชำระ",
      "แผนก",
      "สถานที่",
      "จำนวนรายการชำระ",
      "ยอดรวมรายได้ (บาท)",
    ];

    const rows = data.points.map((pt) => [
      pt.pointCode,
      pt.pointName,
      pt.department,
      pt.location,
      pt.transactionCount,
      pt.totalRevenue.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\r\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `daily-report-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>รายงานสรุปการรับชำระเงินรายวัน</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            สรุปยอดรายได้และจำนวนรายการตามจุดรับชำระเงิน ประจำวันที่เลือก
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-slate-100 font-medium outline-none text-sm"
            />
          </div>

          <button
            onClick={handleExportCsv}
            disabled={!data || !data.points.length}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 text-sm transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออกไฟล์ CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              ยอดเงินรวมของวัน (Total Revenue)
            </span>
            <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
              ฿
              {data
                ? data.totalRevenue.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })
                : "0.00"}
            </div>
          </div>
        </div>

        <div className="p-6 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              จำนวนรายการชำระสำเร็จ
            </span>
            <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 mt-1">
              {data ? data.totalTransactions.toLocaleString("th-TH") : "0"} รายการ
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-slate-700 text-white rounded-xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              จุดรับชำระเงินที่ใช้งาน
            </span>
            <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {data ? data.points.length : 0} เคาน์เตอร์
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            จำแนกตามจุดรับชำระเงินประจำเคาน์เตอร์
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {selectedDate}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>กำลังโหลดรายงานสรุป...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        ) : data && data.points.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase">
                  <th className="px-6 py-3">รหัสจุด</th>
                  <th className="px-6 py-3">ชื่อจุดรับชำระเงิน</th>
                  <th className="px-6 py-3">แผนก / สถานที่</th>
                  <th className="px-6 py-3 text-center">จำนวนรายการ</th>
                  <th className="px-6 py-3 text-right">ยอดเงินรวม (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.points.map((pt) => (
                  <tr
                    key={pt.paymentPointId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {pt.pointCode}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {pt.pointName}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {pt.department} ({pt.location})
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700 dark:text-slate-300">
                      {pt.transactionCount.toLocaleString("th-TH")}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-emerald-700 dark:text-emerald-400 font-mono text-base">
                      ฿
                      {pt.totalRevenue.toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            ไม่มีรายการรับชำระเงินในวันที่เลือก
          </div>
        )}
      </div>
    </div>
  );
}
