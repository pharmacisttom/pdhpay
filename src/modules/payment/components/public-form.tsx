"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  Globe,
  ImageIcon,
  RefreshCw,
  ShieldCheck,
  Trash2,
  AlertCircle,
  QrCode,
  ExternalLink,
  FileCheck2,
} from "lucide-react";
import {
  getTranslation,
  type SupportedLocale,
} from "../i18n/translations";
import {
  generatePromptPayPayload,
  generateQrDataUrl,
} from "../lib/promptpay";

const languageKey = "pdh-payment-language";
const deviceKey = "pdh-payment-device-id";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "00000000-0000-4000-a000-000000000000";
  try {
    let id = localStorage.getItem(deviceKey);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(deviceKey, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

interface PointData {
  name: string;
  code: string;
  location?: string;
  bankAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    code: string;
  };
}

interface PublicFormProps {
  token: string;
  proof: string;
  pointData: PointData;
}

export function PublicForm({ token, proof, pointData }: PublicFormProps) {
  const [locale, setLocale] = useState<SupportedLocale>(() => {
    if (typeof window === "undefined") return "th";
    try {
      const saved = localStorage.getItem(languageKey) as SupportedLocale;
      if (saved && ["th", "zh-CN", "my", "km"].includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore
    }
    return "th";
  });

  const changeLanguage = (newLocale: SupportedLocale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem(languageKey, newLocale);
    } catch {
      // Ignore
    }
  };

  const t = getTranslation(locale);

  // Form State
  const [step, setStep] = useState<number>(1);
  const [payerPhone, setPayerPhone] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [certified, setCertified] = useState<boolean>(false);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>("");
  const [heicWarning, setHeicWarning] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>("");

  // Payment QR State
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Submission State
  const [submissionKey] = useState<string>(() => crypto.randomUUID());
  const [busy, setBusy] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [resultData, setResultData] = useState<{
    paymentNo: string;
    statusToken: string;
  } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Generate PromptPay QR code
  useEffect(() => {
    let active = true;
    const generateQr = async () => {
      const accountNo = pointData.bankAccount.accountNumber || pointData.bankAccount.code;
      const payload = generatePromptPayPayload(accountNo);
      const url = await generateQrDataUrl(payload);
      if (active) {
        setQrCodeUrl(url);
      }
    };
    void generateQr();
    return () => {
      active = false;
    };
  }, [pointData]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    setHeicWarning(false);
    const selected = e.target.files?.[0];
    if (!selected) return;

    // HEIC check
    const filename = selected.name.toLowerCase();
    if (filename.endsWith(".heic") || filename.endsWith(".heif")) {
      setHeicWarning(true);
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setFileError(t.validation.fileTooLarge);
      return;
    }

    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(selected.type) && !filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
      setFileError(t.slipUpload.unsupportedFileError);
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setFilePreviewUrl(url);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl("");
    }
    setHeicWarning(false);
    setFileError("");
  };

  const handleSubmit = async () => {
    if (busy) return;
    setFormError("");

    if (!file) {
      setFormError(t.validation.requiredSlip);
      return;
    }

    if (!certified) {
      setFormError(t.legalCertification.requiredError);
      return;
    }

    setBusy(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("challenge", proof);
      formData.append("submissionKey", submissionKey);
      formData.append("deviceId", getOrCreateDeviceId());
      formData.append("certified", "true");
      if (payerPhone.trim()) formData.append("payerPhone", payerPhone.trim());
      if (note.trim()) formData.append("note", note.trim());
      if (file) formData.append("file", file);

      const response = await fetch("/api/v1/payment/submit", {
        method: "POST",
        body: formData,
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error?.message || "Failed to submit payment");
      }

      setResultData(resJson.data);
      setStep(3);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error submitting slip");
    } finally {
      setBusy(false);
    }
  };

  // Render Language Selector Bar
  const renderLanguageBar = () => (
    <div className="language-selector-bar" role="region" aria-label="Language Selector">
      <div className="language-selector-title">
        <Globe size={18} aria-hidden="true" />
        <span>{t.headers.selectLanguage}</span>
      </div>
      <div className="language-buttons">
        {(
          [
            { code: "th", name: "ไทย" },
            { code: "zh-CN", name: "中文" },
            { code: "my", name: "မြန်မာ" },
            { code: "km", name: "ខ្មែរ" },
          ] as const
        ).map((item) => (
          <button
            key={item.code}
            type="button"
            className={`lang-btn ${locale === item.code ? "active" : ""}`}
            onClick={() => changeLanguage(item.code)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );

  // Render Step Progress
  const renderProgress = () => (
    <div className="form-steps-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
      <div className="step-pill-grid">
        <span className={`step-pill ${step >= 1 ? "active" : ""}`}>1. ภาษา</span>
        <span className={`step-pill ${step >= 2 ? "active" : ""}`}>2. แนบสลิป & รับรอง</span>
        <span className={`step-pill ${step >= 3 ? "active" : ""}`}>3. ผลการส่ง</span>
      </div>
    </div>
  );

  return (
    <main className="public-payment" lang={locale}>
      {/* Header */}
      <header className="payment-header">
        <div className="hospital-brand">
          <Image
            src="/brand/pdh-finance-logo.png"
            width={72}
            height={72}
            alt={t.hospitalName}
            priority
          />
          <div>
            <h1>{t.hospitalName}</h1>
            <p>{pointData.name} ({pointData.code})</p>
          </div>
        </div>
        {renderLanguageBar()}
      </header>

      {renderProgress()}

      {formError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: Select Language */}
      {step === 1 && (
        <section className="step-card fade-in">
          <h2>{t.headers.selectLanguage}</h2>
          <p className="step-desc">
            กรุณาเลือกภาษาที่ต้องการใช้งาน / Please select your preferred language
          </p>

          <div className="language-grid-large">
            <button
              type="button"
              className={`lang-card-large ${locale === "th" ? "selected" : ""}`}
              onClick={() => {
                changeLanguage("th");
                setStep(2);
              }}
            >
              <strong className="lang-title">ไทย (Thai)</strong>
              <span className="lang-subtitle">ระบบรับชำระเงิน โรงพยาบาลปลวกแดง</span>
            </button>

            <button
              type="button"
              className={`lang-card-large ${locale === "zh-CN" ? "selected" : ""}`}
              onClick={() => {
                changeLanguage("zh-CN");
                setStep(2);
              }}
            >
              <strong className="lang-title">中文 (Simplified Chinese)</strong>
              <span className="lang-subtitle">普罗登医院 提交付款凭证系统</span>
            </button>

            <button
              type="button"
              className={`lang-card-large ${locale === "my" ? "selected" : ""}`}
              onClick={() => {
                changeLanguage("my");
                setStep(2);
              }}
            >
              <strong className="lang-title">မြန်မာ (Burmese)</strong>
              <span className="lang-subtitle">ပလွက်ဒဲင် ဆေးရုံ ငွေလွှဲပြေစာ တင်ရန်</span>
            </button>

            <button
              type="button"
              className={`lang-card-large ${locale === "km" ? "selected" : ""}`}
              onClick={() => {
                changeLanguage("km");
                setStep(2);
              }}
            >
              <strong className="lang-title">ខ្មែរ (Khmer)</strong>
              <span className="lang-subtitle">មន្ទីរពេទ្យផ្លួកដែង ផ្ញើភស្តុតាងការទូទាត់</span>
            </button>
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="button button-primary button-large"
              onClick={() => setStep(2)}
            >
              {t.actions.next} <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: Payment QR & Attach Slip & Legal Certification */}
      {step === 2 && (
        <section className="step-card fade-in">
          <h2>{t.headers.attachSlip}</h2>
          <p className="step-desc">
            สแกนชำระเงิน และแนบหลักฐานสลิปการโอน พร้อมรับรองเอกสารเพื่อส่งให้เจ้าหน้าที่
          </p>

          <div className="qr-payment-container" style={{ marginBottom: "1.5rem" }}>
            <div className="bank-account-card">
              <h3>{t.bankDetails.receivingAccountTitle}</h3>
              <dl className="bank-details-list">
                <div>
                  <dt>{t.bankDetails.bankName}:</dt>
                  <dd><strong>{pointData.bankAccount.bankName}</strong></dd>
                </div>
                <div>
                  <dt>{t.bankDetails.accountName}:</dt>
                  <dd><strong>{pointData.bankAccount.accountName}</strong></dd>
                </div>
                <div>
                  <dt>{t.bankDetails.accountNumber}:</dt>
                  <dd><strong className="highlight-acc">{pointData.bankAccount.accountNumber}</strong></dd>
                </div>
              </dl>
            </div>

            <div className="qr-code-box">
              <h4>{t.bankDetails.promptPayQr}</h4>
              <p className="qr-help">{t.bankDetails.promptPayHelp}</p>

              {qrCodeUrl ? (
                <div className="qr-img-wrapper">
                  <Image
                    unoptimized
                    src={qrCodeUrl}
                    alt="PromptPay QR Code"
                    width={200}
                    height={200}
                    priority
                  />
                </div>
              ) : (
                <div className="qr-placeholder">
                  <QrCode size={48} />
                  <span>กำลังสร้าง QR...</span>
                </div>
              )}

              {qrCodeUrl && (
                <div className="qr-download-helper">
                  <a
                    href={qrCodeUrl}
                    download={`promptpay_${pointData.code}.png`}
                    className="button button-outline button-small"
                  >
                    <Download size={16} /> {t.bankDetails.saveQrButton}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="slip-upload-card" style={{ padding: "1.25rem", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", background: "var(--card-bg, #f8fafc)" }}>
            <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>{t.slipUpload.title}</h3>
            <p className="step-desc" style={{ marginBottom: "1rem" }}>{t.slipUpload.instructions}</p>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="sr-only"
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />

            {heicWarning && (
              <div className="alert alert-warning" role="alert">
                <AlertCircle size={20} />
                <span>{t.slipUpload.heicWarning}</span>
              </div>
            )}

            {fileError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={20} />
                <span>{fileError}</span>
              </div>
            )}

            {!file ? (
              <div className="upload-options-grid">
                <button
                  type="button"
                  className="upload-option-btn camera-btn"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={36} />
                  <strong>{t.slipUpload.takePhoto}</strong>
                </button>

                <button
                  type="button"
                  className="upload-option-btn gallery-btn"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImageIcon size={36} />
                  <strong>{t.slipUpload.chooseGallery}</strong>
                </button>
              </div>
            ) : (
              <div className="file-preview-card">
                <h3>{t.slipUpload.previewTitle}</h3>
                {filePreviewUrl && (
                  <div className="preview-img-container">
                    <Image
                      unoptimized
                      src={filePreviewUrl}
                      alt="Slip Preview"
                      width={320}
                      height={400}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                )}
                <p className="file-name-text">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>

                <div className="file-preview-actions">
                  <button
                    type="button"
                    className="button button-outline button-small"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <RefreshCw size={16} /> {t.slipUpload.changeImage}
                  </button>
                  <button
                    type="button"
                    className="button button-danger button-small"
                    onClick={handleRemoveFile}
                  >
                    <Trash2 size={16} /> {t.slipUpload.removeImage}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Optional contact info */}
          <div className="form-row" style={{ marginTop: "1.25rem" }}>
            <div className="form-group">
              <label htmlFor="phone-input">{t.patientInfo.phoneLabel}</label>
              <input
                id="phone-input"
                type="tel"
                className="form-control"
                placeholder={t.patientInfo.phonePlaceholder}
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="note-input">{t.patientInfo.noteLabel}</label>
              <input
                id="note-input"
                type="text"
                className="form-control"
                placeholder={t.patientInfo.notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Legal Certification Checkbox */}
          <div className="legal-certification-box" style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--cert-bg, #f0fdf4)", border: "1px solid var(--cert-border, #bbf7d0)", borderRadius: "8px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", fontWeight: 600, color: "var(--cert-text, #166534)" }}>
              <input
                type="checkbox"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
                style={{ width: "20px", height: "20px", marginTop: "2px", accentColor: "#16a34a" }}
              />
              <span>
                <FileCheck2 size={18} style={{ inlineSize: "18px", display: "inline-block", verticalAlign: "sub", marginRight: "6px" }} />
                {t.legalCertification.checkboxLabel}
              </span>
            </label>
            <p style={{ margin: "0.5rem 0 0 2rem", fontSize: "0.85rem", color: "#475569" }}>
              {t.legalCertification.statement}
            </p>
          </div>

          <div className="step-actions" style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="button button-primary button-large"
              disabled={busy || !file || !certified}
              onClick={handleSubmit}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {busy ? (
                <>
                  <RefreshCw className="spin" size={18} /> {t.actions.submitting}
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> {t.actions.confirmSubmit}
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: Submission Result */}
      {step === 3 && resultData && (
        <section className="step-card fade-in text-center">
          <div className="success-icon-wrap">
            <CheckCircle2 size={64} className="text-success" />
          </div>

          <h2>{t.headers.submissionSuccess}</h2>
          <p className="text-success-dark"><strong>{t.status.receivedMessage}</strong></p>

          <div className="tracking-code-card">
            <span className="tracking-label">{t.status.trackingCodeLabel}</span>
            <strong className="tracking-number">{resultData.paymentNo}</strong>
          </div>

          <div className="notice-box-disclaimer" role="alert">
            <p>{t.status.receiptDisclaimer}</p>
          </div>

          <div className="result-actions">
            <a
              href={`/pay/status/${resultData.statusToken}`}
              className="button button-primary button-large"
            >
              <ExternalLink size={18} /> {t.actions.checkStatus}
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
