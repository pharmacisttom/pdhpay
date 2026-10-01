"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  AlertTriangle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import {
  getTranslation,
  formatDate,
  type SupportedLocale,
} from "../i18n/translations";

const languageKey = "pdh-payment-language";

export interface FormattedPaymentStatus {
  paymentNo: string;
  status: string;
  submittedAt: string;
  receiptNo: string | null;
  declaredAmount?: string;
  verifiedAmount?: string | null;
  point: {
    name: string;
    qrToken: string;
  };
  statusHistory?: {
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }[];
}

interface PublicStatusViewProps {
  payment: FormattedPaymentStatus | null;
}

export function PublicStatusView({ payment }: PublicStatusViewProps) {
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

  const renderLanguageBar = () => (
    <div className="language-selector-bar">
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

  if (!payment) {
    return (
      <main className="public-payment" lang={locale}>
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
              <p>{t.headers.trackingTitle}</p>
            </div>
          </div>
          {renderLanguageBar()}
        </header>

        <section className="step-card text-center fade-in" style={{ padding: "3rem 1.5rem" }}>
          <XCircle size={64} className="text-danger" style={{ margin: "0 auto 1rem" }} />
          <h2>{t.status.notFound}</h2>
          <p>{t.status.notFoundHelp}</p>
        </section>
      </main>
    );
  }

  // Get localized status text
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return t.status.submitted;
      case "PENDING_VERIFY":
        return t.status.pendingVerify;
      case "VERIFIED":
        return t.status.verified;
      case "RECEIPTED":
        return t.status.receipted;
      case "AMOUNT_MISMATCH":
        return t.status.amountMismatch;
      case "POSSIBLE_DUPLICATE":
        return t.status.possibleDuplicate;
      case "INVALID_SLIP":
        return t.status.invalidSlip;
      case "REJECTED":
        return t.status.rejected;
      case "CANCELLED":
        return t.status.cancelled;
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "RECEIPTED":
        return "badge-success";
      case "PENDING_VERIFY":
      case "SUBMITTED":
      case "POSSIBLE_DUPLICATE":
        return "badge-warning";
      case "INVALID_SLIP":
      case "AMOUNT_MISMATCH":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };

  // Get reason text (check standard reason keys or display original)
  const getLocalizedReason = (reasonStr: string | null) => {
    if (!reasonStr) return null;
    const key = reasonStr as keyof typeof t.reasons;
    return t.reasons[key] || reasonStr;
  };

  const latestHistory = payment.statusHistory?.[0];
  const needsResubmit = ["INVALID_SLIP", "AMOUNT_MISMATCH", "REJECTED"].includes(payment.status);

  return (
    <main className="public-payment" lang={locale}>
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
            <p>{t.headers.trackingTitle}</p>
          </div>
        </div>
        {renderLanguageBar()}
      </header>

      <section className="step-card fade-in">
        <div className="status-header-box">
          <span className="eyebrow">{t.headers.paymentPoint}: {payment.point.name}</span>
          <h2 className="payment-no-title">{payment.paymentNo}</h2>
          <div className="status-pill-wrap">
            <span className={`status-pill-large ${getStatusBadgeClass(payment.status)}`}>
              {getStatusLabel(payment.status)}
            </span>
          </div>
        </div>

        <div className="status-details-card">
          <dl className="info-grid">
            <dt>เวลาส่งหลักฐาน:</dt>
            <dd>{formatDate(payment.submittedAt, locale)}</dd>

            {payment.declaredAmount && (
              <>
                <dt>{t.patientInfo.declaredAmountLabel}:</dt>
                <dd><strong>{parseFloat(payment.declaredAmount).toFixed(2)} {t.patientInfo.currency}</strong></dd>
              </>
            )}

            {payment.verifiedAmount && (
              <>
                <dt>ยอดเงินที่ตรวจสอบแล้ว:</dt>
                <dd><strong className="text-success">{parseFloat(payment.verifiedAmount).toFixed(2)} {t.patientInfo.currency}</strong></dd>
              </>
            )}

            {payment.receiptNo && (
              <>
                <dt>เลขที่ใบเสร็จ:</dt>
                <dd><strong>{payment.receiptNo}</strong></dd>
              </>
            )}
          </dl>
        </div>

        {needsResubmit && latestHistory?.reason && (
          <div className="resubmit-reason-box" role="alert">
            <AlertTriangle size={24} className="text-danger" />
            <div>
              <strong>{t.status.resubmitReasonHeader}</strong>
              <p>{getLocalizedReason(latestHistory.reason)}</p>
            </div>
          </div>
        )}

        <div className="notice-box-disclaimer" style={{ marginTop: "1.5rem" }}>
          <p>{t.status.receiptDisclaimer}</p>
        </div>

        <div className="step-actions" style={{ marginTop: "2rem" }}>
          {needsResubmit && payment.point.qrToken && (
            <Link
              href={`/pay/p/${payment.point.qrToken}`}
              className="button button-primary button-large"
            >
              <RotateCcw size={18} /> {t.actions.resubmit}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
