"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
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
} from "lucide-react";
import {
  getTranslation,
  formatDate,
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
  // Locale State initialized safely without calling setState in effect
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

  // Form State (Persisted across language changes)
  const [step, setStep] = useState<number>(1);
  const [hn, setHn] = useState<string>("");
  const [vnAn, setVnAn] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [payerName, setPayerName] = useState<string>("");
  const [payerPhone, setPayerPhone] = useState<string>("");
  const [declaredAmount, setDeclaredAmount] = useState<string>("");
  const [sourceBank, setSourceBank] = useState<string>("");
  const [transferDateTime, setTransferDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState<string>("");

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

  // Generate PromptPay QR code whenever amount or bank code changes
  useEffect(() => {
    let active = true;
    const generateQr = async () => {
      const accountNo = pointData.bankAccount.accountNumber || pointData.bankAccount.code;
      const payload = generatePromptPayPayload(accountNo, declaredAmount || undefined);
      const url = await generateQrDataUrl(payload);
      if (active) {
        setQrCodeUrl(url);
      }
    };
    void generateQr();
    return () => {
      active = false;
    };
  }, [pointData, declaredAmount]);

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

  // Step Validation
  const validateStep2 = (): boolean => {
    setFormError("");
    if (!hn.trim()) {
      setFormError(t.validation.requiredHN);
      return false;
    }
    if (!patientName.trim()) {
      setFormError(t.validation.requiredPatientName);
      return false;
    }
    if (!declaredAmount || parseFloat(declaredAmount) <= 0) {
      setFormError(t.validation.invalidAmount);
      return false;
    }
    if (!sourceBank.trim()) {
      setFormError(t.validation.requiredBank);
      return false;
    }
    if (!transferDateTime) {
      setFormError(t.validation.requiredTransferTime);
      return false;
    }
    return true;
  };

  const validateStep4 = (): boolean => {
    setFormError("");
    if (!file) {
      setFormError(t.validation.requiredSlip);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (busy) return;
    setFormError("");
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("challenge", proof);
      formData.append("submissionKey", submissionKey);
      formData.append("deviceId", getOrCreateDeviceId());
      formData.append("hn", hn.trim());
      if (vnAn.trim()) formData.append("vn", vnAn.trim());
      formData.append("patientName", patientName.trim());
      if (payerName.trim()) formData.append("payerName", payerName.trim());
      if (payerPhone.trim()) formData.append("payerPhone", payerPhone.trim());
      formData.append("declaredAmount", declaredAmount);
      formData.append("sourceBank", sourceBank.trim());
      formData.append("transferDateTime", new Date(transferDateTime).toISOString());
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
      setStep(6);
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
    <div className="form-steps-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={6}>
      <div className="step-pill-grid">
        <span className={`step-pill ${step >= 1 ? "active" : ""}`}>1</span>
        <span className={`step-pill ${step >= 2 ? "active" : ""}`}>2</span>
        <span className={`step-pill ${step >= 3 ? "active" : ""}`}>3</span>
        <span className={`step-pill ${step >= 4 ? "active" : ""}`}>4</span>
        <span className={`step-pill ${step >= 5 ? "active" : ""}`}>5</span>
        <span className={`step-pill ${step >= 6 ? "active" : ""}`}>6</span>
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

      {/* STEP 2: Review Billing / Fill Details */}
      {step === 2 && (
        <section className="step-card fade-in">
          <h2>{t.headers.billingDetails}</h2>

          <div className="info-box-brand">
            <strong>{pointData.name}</strong>
            {pointData.location && <p>{pointData.location}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validateStep2()) setStep(3);
            }}
          >
            <div className="form-group">
              <label htmlFor="hn-input">
                {t.patientInfo.hnLabel} <span className="required-star">*</span>
              </label>
              <input
                id="hn-input"
                type="text"
                className="form-control"
                placeholder={t.patientInfo.hnPlaceholder}
                value={hn}
                onChange={(e) => setHn(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="patientName-input">
                {t.patientInfo.patientNameLabel} <span className="required-star">*</span>
              </label>
              <input
                id="patientName-input"
                type="text"
                className="form-control"
                placeholder={t.patientInfo.patientNamePlaceholder}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vnan-input">{t.patientInfo.vnAnLabel}</label>
                <input
                  id="vnan-input"
                  type="text"
                  className="form-control"
                  placeholder="VN / AN"
                  value={vnAn}
                  onChange={(e) => setVnAn(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="payerName-input">{t.patientInfo.payerNameLabel}</label>
                <input
                  id="payerName-input"
                  type="text"
                  className="form-control"
                  placeholder={t.patientInfo.payerNamePlaceholder}
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount-input">
                  {t.patientInfo.declaredAmountLabel} <span className="required-star">*</span>
                </label>
                <input
                  id="amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control amount-input"
                  placeholder="0.00"
                  value={declaredAmount}
                  onChange={(e) => setDeclaredAmount(e.target.value)}
                  required
                />
                <small className="help-text">{t.patientInfo.declaredAmountHelp}</small>
              </div>

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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bank-input">
                  {t.patientInfo.sourceBankLabel} <span className="required-star">*</span>
                </label>
                <input
                  id="bank-input"
                  type="text"
                  className="form-control"
                  placeholder={t.patientInfo.sourceBankPlaceholder}
                  value={sourceBank}
                  onChange={(e) => setSourceBank(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time-input">
                  {t.patientInfo.transferDateTimeLabel} <span className="required-star">*</span>
                </label>
                <input
                  id="time-input"
                  type="datetime-local"
                  className="form-control"
                  value={transferDateTime}
                  onChange={(e) => setTransferDateTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="note-input">{t.patientInfo.noteLabel}</label>
              <textarea
                id="note-input"
                className="form-control"
                rows={2}
                placeholder={t.patientInfo.notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="step-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setStep(1)}
              >
                <ChevronLeft size={18} /> {t.actions.back}
              </button>
              <button type="submit" className="button button-primary">
                {t.actions.next} <ChevronRight size={18} />
              </button>
            </div>
          </form>
        </section>
      )}

      {/* STEP 3: Make Payment / QR View */}
      {step === 3 && (
        <section className="step-card fade-in">
          <h2>{t.headers.makePayment}</h2>

          <div className="notice-box-warning" role="alert">
            <p>{t.bankDetails.pointQrVsPaymentQrNotice}</p>
          </div>

          <div className="qr-payment-container">
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
                <div>
                  <dt>{t.patientInfo.declaredAmountLabel}:</dt>
                  <dd><strong className="highlight-amount">{parseFloat(declaredAmount || "0").toFixed(2)} {t.patientInfo.currency}</strong></dd>
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
                    width={240}
                    height={240}
                    priority
                  />
                </div>
              ) : (
                <div className="qr-placeholder">
                  <QrCode size={64} />
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
                  <p className="small-help">{t.bankDetails.saveQrInstructions}</p>
                </div>
              )}
            </div>
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="button button-outline"
              onClick={() => setStep(2)}
            >
              <ChevronLeft size={18} /> {t.actions.back}
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setStep(4)}
            >
              {t.actions.next} (แนบสลิป) <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: Attach Slip */}
      {step === 4 && (
        <section className="step-card fade-in">
          <h2>{t.headers.attachSlip}</h2>
          <p className="step-desc">{t.slipUpload.instructions}</p>

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

          <p className="small-help text-center" style={{ marginTop: "1rem" }}>
            {t.slipUpload.supportedFormats}
            <br />
            {t.slipUpload.refreshWarning}
          </p>

          <div className="step-actions">
            <button
              type="button"
              className="button button-outline"
              onClick={() => setStep(3)}
            >
              <ChevronLeft size={18} /> {t.actions.back}
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={!file}
              onClick={() => {
                if (validateStep4()) setStep(5);
              }}
            >
              {t.actions.next} <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {/* STEP 5: Confirm Before Submission */}
      {step === 5 && (
        <section className="step-card fade-in">
          <h2>{t.headers.confirmSubmission}</h2>

          <div className="summary-card">
            <dl className="summary-list">
              <div>
                <dt>{t.headers.paymentPoint}:</dt>
                <dd><strong>{pointData.name}</strong></dd>
              </div>
              <div>
                <dt>{t.patientInfo.hnLabel}:</dt>
                <dd><strong>{hn}</strong></dd>
              </div>
              <div>
                <dt>{t.patientInfo.patientNameLabel}:</dt>
                <dd><strong>{patientName}</strong></dd>
              </div>
              <div>
                <dt>{t.patientInfo.declaredAmountLabel}:</dt>
                <dd><strong className="highlight-amount">{parseFloat(declaredAmount).toFixed(2)} {t.patientInfo.currency}</strong></dd>
              </div>
              <div>
                <dt>{t.patientInfo.sourceBankLabel}:</dt>
                <dd>{sourceBank}</dd>
              </div>
              <div>
                <dt>{t.patientInfo.transferDateTimeLabel}:</dt>
                <dd>{formatDate(transferDateTime, locale)}</dd>
              </div>
              {payerName && (
                <div>
                  <dt>{t.patientInfo.payerNameLabel}:</dt>
                  <dd>{payerName}</dd>
                </div>
              )}
            </dl>

            {filePreviewUrl && (
              <div className="summary-thumbnail">
                <span>สลิปที่แนบ:</span>
                <Image
                  unoptimized
                  src={filePreviewUrl}
                  alt="Thumbnail"
                  width={120}
                  height={150}
                  style={{ objectFit: "cover", borderRadius: "8px" }}
                />
              </div>
            )}
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="button button-outline"
              disabled={busy}
              onClick={() => setStep(4)}
            >
              {t.actions.edit}
            </button>
            <button
              type="button"
              className="button button-primary button-large"
              disabled={busy}
              onClick={handleSubmit}
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

      {/* STEP 6: Submission Result */}
      {step === 6 && resultData && (
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
