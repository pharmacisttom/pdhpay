"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  ImageIcon,
  X,
} from "lucide-react";

interface SlipUploadProps {
  transactionId?: string;
  defaultExpectedAmount?: number;
  onSuccess?: (result: UploadResult) => void;
}

export interface UploadResult {
  transactionId: string | null;
  driveFileId: string;
  ocrAmount: number | null;
  expectedAmount: number;
  isAmountMatch: boolean;
  status: "PENDING_VERIFY" | "AMOUNT_MISMATCH";
  snippet?: string;
}

export function SlipUpload({
  transactionId,
  defaultExpectedAmount,
  onSuccess,
}: SlipUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expectedAmount, setExpectedAmount] = useState<string>(
    defaultExpectedAmount ? String(defaultExpectedAmount) : "",
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError("ขนาดไฟล์เกิน 10MB กรุณาเลือกไฟล์ภาพสลิปที่มีขนาดเล็กกว่า 10MB");
      return;
    }

    // Check mime type
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setError("รองรับเฉพาะไฟล์รูปภาพ JPG หรือ PNG เท่านั้น");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("กรุณาเลือกไฟล์ภาพสลิปการโอนเงิน");
      return;
    }

    const numAmount = parseFloat(expectedAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("กรุณาระบุยอดเงินที่ต้องการชำระให้ถูกต้อง");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("expectedAmount", String(numAmount));
      if (transactionId) {
        formData.append("transactionId", transactionId);
      }

      const response = await fetch("/api/v1/payment/upload", {
        method: "POST",
        body: formData,
        cache: "no-store",
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.error?.message || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์",
        );
      }

      const resData = json.data as UploadResult;
      setResult(resData);
      if (onSuccess) {
        onSuccess(resData);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 transition-all">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            อัปโหลดสลิปและตรวจสอบยอดเงิน (OCR)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ระบบจะอ่านยอดเงินจากสลิปอัตโนมัติด้วย Google Cloud Vision API
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Expected Amount Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            ยอดเงินที่ระบุชำระ (บาท) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="เช่น 1500.00"
            value={expectedAmount}
            onChange={(e) => setExpectedAmount(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50"
          />
        </div>

        {/* File Selection Box */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            แนบไฟล์ภาพสลิปโอนเงิน (JPG, PNG ไม่เกิน 10MB){" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
            id="slip-file-input"
          />

          {!previewUrl ? (
            <label
              htmlFor="slip-file-input"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition bg-slate-50/50 dark:bg-slate-900/50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <p className="mb-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  คลิกหรือลากไฟล์ภาพสลิปมาวางที่นี่
                </p>
                <p className="text-xs text-slate-400">
                  รองรับรูปแบบ PNG, JPG (ขนาดไม่เกิน 10 MB)
                </p>
              </div>
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-4">
              <button
                type="button"
                onClick={handleClearFile}
                disabled={loading}
                className="absolute top-3 right-3 p-1.5 bg-slate-900/70 text-white rounded-full hover:bg-slate-900 transition z-10"
                title="ยกเลิกไฟล์นี้"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={previewUrl}
                alt="สลิปที่เลือก"
                className="max-h-64 object-contain rounded-lg shadow-sm"
              />
              <div className="mt-3 flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>{selectedFile?.name}</span>
                <span>
                  ({((selectedFile?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg flex items-start space-x-3 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังบันทึกภาพและอ่านยอดเงินด้วย OCR...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>ยืนยันการส่งสลิปและประมวลผล OCR</span>
            </>
          )}
        </button>
      </form>

      {/* Result Output Card */}
      {result && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <span>ผลการประมวลผล OCR</span>
          </h3>

          <div
            className={`p-4 rounded-xl border flex items-start space-x-4 ${
              result.isAmountMatch
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100"
            }`}
          >
            {result.isAmountMatch ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            )}

            <div className="space-y-2 flex-grow">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base">
                  {result.isAmountMatch
                    ? "ยอดเงินตรงกัน (รอเจ้าหน้าที่ตรวจสอบ)"
                    : "ยอดเงินไม่ตรงกัน / ไม่สามารถอ่านยอดเงินได้"}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    result.isAmountMatch
                      ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100"
                      : "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100"
                  }`}
                >
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">
                    ยอดเงินที่ระบุชำระ:
                  </span>
                  <span className="font-semibold text-base">
                    ฿{result.expectedAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">
                    ยอดเงินที่ OCR อ่านได้จากสลิป:
                  </span>
                  <span className="font-semibold text-base">
                    {result.ocrAmount !== null
                      ? `฿${result.ocrAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`
                      : "ไม่พบบรรทัดยอดเงิน"}
                  </span>
                </div>
              </div>

              {result.driveFileId && (
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                  Google Drive File ID:{" "}
                  <code className="bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    {result.driveFileId}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
