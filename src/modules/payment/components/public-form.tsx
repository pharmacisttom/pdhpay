"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Languages,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { confirmAction, showError } from "./api";

const deviceKey = "pdh-payment-device-id";
const languageKey = "pdh-payment-language";
type Language = "th" | "en" | "my" | "km";

const copy = {
  th: {
    label: "ไทย",
    title: "แนบสลิปโอนเงิน",
    steps: ["1 กรอกข้อมูล", "2 แนบสลิป", "3 รับเลขอ้างอิง"],
    patientTitle: "ข้อมูลผู้ป่วย",
    patientHelp: "กรอกข้อมูลให้ตรงกับใบนัดหรือบัตรโรงพยาบาล",
    patientName: "ชื่อ–นามสกุลผู้ป่วย",
    optional: "ถ้ามี",
    example: "เช่น 1234567",
    transferTitle: "ข้อมูลการโอนเงิน",
    transferHelp: "ตรวจสอบยอดและเวลาให้ตรงกับสลิป",
    amount: "จำนวนเงิน (บาท)",
    bank: "ธนาคารต้นทาง",
    bankPlaceholder: "ธนาคารที่ใช้โอน",
    transferTime: "วันและเวลาโอน",
    payerName: "ชื่อผู้โอน",
    phone: "เบอร์โทรศัพท์",
    slipTitle: "ถ่ายรูปหรือแนบสลิป",
    slipHelp: "ภาพต้องเห็นยอด เวลา และเลขอ้างอิงชัดเจน",
    chooseFile: "แตะเพื่อถ่ายรูปหรือเลือกไฟล์",
    fileTypes: "JPG, PNG, WEBP หรือ PDF ไม่เกิน 5 MB",
    preview: "ตัวอย่างสลิปที่เลือก",
    note: "หมายเหตุ",
    notePlaceholder: "ข้อมูลเพิ่มเติม (ถ้ามี)",
    privacyTitle: "ความเป็นส่วนตัวและการป้องกันทุจริต",
    privacy:
      "ระบบไม่อ่านหรือเก็บ IMEI หรือ serial number ของโทรศัพท์ แต่เก็บรหัสอุปกรณ์แบบสุ่มในรูป HMAC hash พร้อมเวลาและข้อมูลเบราว์เซอร์ เพื่อช่วยตรวจรายการซ้ำ โดยไม่ใช้เป็นหลักฐานยืนยันตัวตนเพียงอย่างเดียว",
    submit: "ส่งหลักฐานการชำระเงิน",
    submitting: "กำลังส่ง กรุณาอย่าปิดหน้านี้…",
    confirm: "ยืนยันส่งหลักฐานการชำระเงิน?",
    success: "รับหลักฐานแล้ว",
    reference: "เลขอ้างอิง",
    track: "ติดตามสถานะรายการ",
    successHelp:
      "กรุณาเก็บเลขอ้างอิงไว้ การส่งหลักฐานยังไม่ถือเป็นการยืนยันยอดหรือออกใบเสร็จ",
  },
  en: {
    label: "English",
    title: "Upload transfer slip",
    steps: ["1 Enter details", "2 Upload slip", "3 Get reference"],
    patientTitle: "Patient details",
    patientHelp:
      "Enter the details shown on the appointment card or hospital card.",
    patientName: "Patient full name",
    optional: "optional",
    example: "e.g. 1234567",
    transferTitle: "Transfer details",
    transferHelp: "Make sure the amount and time match the transfer slip.",
    amount: "Amount (THB)",
    bank: "Sending bank",
    bankPlaceholder: "Bank used for the transfer",
    transferTime: "Transfer date and time",
    payerName: "Payer name",
    phone: "Phone number",
    slipTitle: "Take a photo or upload the slip",
    slipHelp: "The amount, time, and reference number must be clearly visible.",
    chooseFile: "Tap to take a photo or choose a file",
    fileTypes: "JPG, PNG, WEBP or PDF, up to 5 MB",
    preview: "Selected slip preview",
    note: "Note",
    notePlaceholder: "Additional information (optional)",
    privacyTitle: "Privacy and fraud prevention",
    privacy:
      "The system does not read or store your phone's IMEI or serial number. It stores a random device identifier as an HMAC hash with the time and browser information to help detect duplicate submissions. This is not used as sole proof of identity.",
    submit: "Submit payment evidence",
    submitting: "Submitting. Please keep this page open…",
    confirm: "Submit this payment evidence?",
    success: "Evidence received",
    reference: "Reference number",
    track: "Track submission status",
    successHelp:
      "Please keep this reference number. Submitting evidence does not confirm the payment or issue a receipt.",
  },
  my: {
    label: "မြန်မာ",
    title: "ငွေလွှဲပြေစာ တင်ရန်",
    steps: ["၁ အချက်အလက်ဖြည့်ရန်", "၂ ပြေစာတင်ရန်", "၃ ရည်ညွှန်းနံပါတ်ရယူရန်"],
    patientTitle: "လူနာအချက်အလက်",
    patientHelp: "ဆေးရုံကတ် သို့မဟုတ် ချိန်းဆိုကတ်ပါ အချက်အလက်အတိုင်း ဖြည့်ပါ။",
    patientName: "လူနာအမည်အပြည့်အစုံ",
    optional: "ရှိလျှင်",
    example: "ဥပမာ 1234567",
    transferTitle: "ငွေလွှဲအချက်အလက်",
    transferHelp: "ငွေပမာဏနှင့် အချိန်ကို ပြေစာနှင့် ကိုက်ညီကြောင်း စစ်ဆေးပါ။",
    amount: "ငွေပမာဏ (ဘတ်)",
    bank: "ငွေလွှဲသည့်ဘဏ်",
    bankPlaceholder: "အသုံးပြုသည့်ဘဏ်",
    transferTime: "ငွေလွှဲသည့်ရက်နှင့်အချိန်",
    payerName: "ငွေလွှဲသူအမည်",
    phone: "ဖုန်းနံပါတ်",
    slipTitle: "ဓာတ်ပုံရိုက်ရန် သို့မဟုတ် ပြေစာတင်ရန်",
    slipHelp: "ငွေပမာဏ၊ အချိန်နှင့် ရည်ညွှန်းနံပါတ် ရှင်းလင်းစွာ မြင်ရပါမည်။",
    chooseFile: "ဓာတ်ပုံရိုက်ရန် သို့မဟုတ် ဖိုင်ရွေးရန် နှိပ်ပါ",
    fileTypes: "JPG, PNG, WEBP သို့မဟုတ် PDF၊ 5 MB အထိ",
    preview: "ရွေးချယ်ထားသော ပြေစာ",
    note: "မှတ်ချက်",
    notePlaceholder: "ထပ်မံအချက်အလက် (ရှိလျှင်)",
    privacyTitle: "ကိုယ်ရေးအချက်အလက်နှင့် လိမ်လည်မှုကာကွယ်ရေး",
    privacy:
      "စနစ်သည် ဖုန်း၏ IMEI သို့မဟုတ် serial number ကို မဖတ်၊ မသိမ်းပါ။ ထပ်တူတင်မှုကို စစ်ဆေးရန် ကျပန်းစက်ပစ္စည်းကုဒ်ကို HMAC hash အဖြစ် အချိန်နှင့် browser အချက်အလက်တို့နှင့်အတူ သိမ်းဆည်းသည်။ ၎င်းကို အထောက်အထားတစ်ခုတည်းအဖြစ် မသုံးပါ။",
    submit: "ငွေပေးချေမှုအထောက်အထား ပို့ရန်",
    submitting: "ပို့နေပါသည်။ ဤစာမျက်နှာကို မပိတ်ပါနှင့်…",
    confirm: "ငွေပေးချေမှုအထောက်အထားကို ပို့မည်လား?",
    success: "အထောက်အထား လက်ခံရရှိပါပြီ",
    reference: "ရည်ညွှန်းနံပါတ်",
    track: "အခြေအနေစစ်ဆေးရန်",
    successHelp:
      "ရည်ညွှန်းနံပါတ်ကို သိမ်းထားပါ။ အထောက်အထားတင်ခြင်းသည် ငွေပေးချေမှုအတည်ပြုခြင်း သို့မဟုတ် ပြေစာထုတ်ပေးခြင်း မဟုတ်ပါ။",
  },
  km: {
    label: "ខ្មែរ",
    title: "បញ្ចូលបង្កាន់ដៃផ្ទេរប្រាក់",
    steps: ["១ បំពេញព័ត៌មាន", "២ បញ្ចូលបង្កាន់ដៃ", "៣ ទទួលលេខយោង"],
    patientTitle: "ព័ត៌មានអ្នកជំងឺ",
    patientHelp: "សូមបំពេញព័ត៌មានឱ្យត្រូវនឹងប័ណ្ណណាត់ជួប ឬប័ណ្ណមន្ទីរពេទ្យ។",
    patientName: "ឈ្មោះពេញអ្នកជំងឺ",
    optional: "បើមាន",
    example: "ឧ. 1234567",
    transferTitle: "ព័ត៌មានការផ្ទេរប្រាក់",
    transferHelp: "សូមពិនិត្យចំនួនប្រាក់ និងម៉ោងឱ្យត្រូវនឹងបង្កាន់ដៃ។",
    amount: "ចំនួនប្រាក់ (បាត)",
    bank: "ធនាគារផ្ញើប្រាក់",
    bankPlaceholder: "ធនាគារដែលបានប្រើ",
    transferTime: "កាលបរិច្ឆេទ និងម៉ោងផ្ទេរ",
    payerName: "ឈ្មោះអ្នកផ្ទេរ",
    phone: "លេខទូរស័ព្ទ",
    slipTitle: "ថតរូប ឬបញ្ចូលបង្កាន់ដៃ",
    slipHelp: "ត្រូវមើលឃើញចំនួនប្រាក់ ម៉ោង និងលេខយោងឱ្យច្បាស់។",
    chooseFile: "ចុចដើម្បីថតរូប ឬជ្រើសរើសឯកសារ",
    fileTypes: "JPG, PNG, WEBP ឬ PDF មិនលើស 5 MB",
    preview: "មើលបង្កាន់ដៃដែលបានជ្រើស",
    note: "កំណត់ចំណាំ",
    notePlaceholder: "ព័ត៌មានបន្ថែម (បើមាន)",
    privacyTitle: "ឯកជនភាព និងការការពារការក្លែងបន្លំ",
    privacy:
      "ប្រព័ន្ធមិនអាន ឬរក្សាទុក IMEI ឬ serial number របស់ទូរស័ព្ទទេ។ ប្រព័ន្ធរក្សាទុកលេខសម្គាល់ឧបករណ៍ចៃដន្យជា HMAC hash ជាមួយពេលវេលា និងព័ត៌មាន browser ដើម្បីជួយរកការផ្ញើស្ទួន។ វាមិនត្រូវបានប្រើជាភស្តុតាងអត្តសញ្ញាណតែមួយទេ។",
    submit: "ផ្ញើភស្តុតាងការទូទាត់",
    submitting: "កំពុងផ្ញើ សូមកុំបិទទំព័រនេះ…",
    confirm: "ផ្ញើភស្តុតាងការទូទាត់នេះឬ?",
    success: "បានទទួលភស្តុតាងហើយ",
    reference: "លេខយោង",
    track: "តាមដានស្ថានភាព",
    successHelp:
      "សូមរក្សាទុកលេខយោងនេះ។ ការផ្ញើភស្តុតាងមិនមែនជាការបញ្ជាក់ការទូទាត់ ឬការចេញបង្កាន់ដៃទេ។",
  },
} as const;

function deviceId() {
  try {
    const current = localStorage.getItem(deviceKey);
    if (current) return current;
    const created = crypto.randomUUID();
    localStorage.setItem(deviceKey, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function initialLanguage(): Language {
  if (typeof window === "undefined") return "th";
  const saved = localStorage.getItem(languageKey) as Language | null;
  if (saved && saved in copy) return saved;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("en")) return "en";
  if (browser.startsWith("my")) return "my";
  if (browser.startsWith("km")) return "km";
  return "th";
}

function LanguageSelector({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (value: Language) => void;
}) {
  return (
    <label className="payment-language">
      <Languages size={18} aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        aria-label="Language"
      >
        {(Object.keys(copy) as Language[]).map((code) => (
          <option key={code} value={code}>
            {copy[code].label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PublicForm({
  token,
  proof,
  pointName,
}: {
  token: string;
  proof: string;
  pointName: string;
}) {
  const [key] = useState(() => crypto.randomUUID());
  const [language, setLanguageState] = useState<Language>("th");
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState("");
  const [trackingToken, setTrackingToken] = useState("");
  const [preview, setPreview] = useState("");
  const t = copy[language];
  useEffect(() => {
    const timer = window.setTimeout(
      () => setLanguageState(initialLanguage()),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function setLanguage(value: Language) {
    setLanguageState(value);
    try {
      localStorage.setItem(languageKey, value);
    } catch {
      /* Storage may be unavailable. */
    }
  }
  if (reference)
    return (
      <section className="public-payment public-success" lang={language}>
        <LanguageSelector language={language} setLanguage={setLanguage} />
        <CheckCircle2 size={64} aria-hidden="true" />
        <h1>{t.success}</h1>
        <p>{t.reference}</p>
        <strong className="payment-reference">{reference}</strong>
        {trackingToken && (
          <a
            className="button button-primary"
            href={`/pay/status/${trackingToken}`}
          >
            {t.track}
          </a>
        )}
        <p>{t.successHelp}</p>
      </section>
    );
  return (
    <main className="public-payment mobile-payment" lang={language}>
      <LanguageSelector language={language} setLanguage={setLanguage} />
      <header className="mobile-payment-head">
        <Image
          src="/brand/pdh-finance-logo.png"
          width={82}
          height={82}
          alt="Pluak Daeng Hospital"
          priority
        />
        <div>
          <p className="eyebrow">PDH SMART PAYMENT</p>
          <h1>{t.title}</h1>
          <p>{pointName}</p>
        </div>
      </header>
      <div className="mobile-progress">
        {t.steps.map((step, index) => (
          <span className={index === 0 ? "active" : undefined} key={step}>
            {step}
          </span>
        ))}
      </div>
      <form
        className="mobile-payment-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !(await confirmAction(t.confirm))) return;
          setBusy(true);
          const data = new FormData(event.currentTarget);
          data.set("submissionKey", key);
          data.set("deviceId", deviceId());
          data.set("token", token);
          data.set("challenge", proof);
          data.set(
            "transferDateTime",
            `${String(data.get("transferDateTime"))}:00+07:00`,
          );
          try {
            const response = await fetch("/api/v1/payments", {
              method: "POST",
              body: data,
            });
            const result = await response.json();
            if (!response.ok)
              throw new Error(
                `${result.error?.message} · ${result.meta?.requestId}`,
              );
            setReference(result.data.paymentNo);
            setTrackingToken(result.data.statusToken ?? "");
          } catch (error) {
            await showError(error);
          } finally {
            setBusy(false);
          }
        }}
      >
        <section className="mobile-form-section">
          <div className="section-number">1</div>
          <div>
            <h2>{t.patientTitle}</h2>
            <p>{t.patientHelp}</p>
          </div>
          <label>
            HN <span>*</span>
            <input
              name="hn"
              inputMode="text"
              autoComplete="off"
              required
              maxLength={40}
              placeholder={t.example}
            />
          </label>
          <label>
            {t.patientName} <span>*</span>
            <input
              name="patientName"
              autoComplete="name"
              required
              maxLength={160}
            />
          </label>
          <div className="mobile-two-columns">
            <label>
              VN ({t.optional})<input name="vn" maxLength={40} />
            </label>
            <label>
              AN ({t.optional})<input name="an" maxLength={40} />
            </label>
          </div>
        </section>
        <section className="mobile-form-section">
          <div className="section-number">2</div>
          <div>
            <h2>{t.transferTitle}</h2>
            <p>{t.transferHelp}</p>
          </div>
          <label>
            {t.amount} <span>*</span>
            <input
              name="declaredAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
            />
          </label>
          <label>
            {t.bank} <span>*</span>
            <input
              name="sourceBank"
              required
              maxLength={120}
              placeholder={t.bankPlaceholder}
            />
          </label>
          <label>
            {t.transferTime} <span>*</span>
            <input name="transferDateTime" type="datetime-local" required />
          </label>
          <div className="mobile-two-columns">
            <label>
              {t.payerName}
              <input name="payerName" autoComplete="name" maxLength={160} />
            </label>
            <label>
              {t.phone}
              <input
                name="payerPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={30}
              />
            </label>
          </div>
        </section>
        <section className="mobile-form-section">
          <div className="section-number">3</div>
          <div>
            <h2>{t.slipTitle}</h2>
            <p>{t.slipHelp}</p>
          </div>
          <label className="slip-drop">
            <Camera size={32} aria-hidden="true" />
            <strong>{t.chooseFile}</strong>
            <span>{t.fileTypes}</span>
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              capture="environment"
              required
              onChange={(event) => {
                if (preview) URL.revokeObjectURL(preview);
                const file = event.target.files?.[0];
                setPreview(
                  file?.type.startsWith("image/")
                    ? URL.createObjectURL(file)
                    : "",
                );
              }}
            />
          </label>
          {preview && (
            <div className="slip-preview">
              <Image
                unoptimized
                src={preview}
                width={600}
                height={800}
                alt={t.preview}
              />
            </div>
          )}
          <label>
            {t.note}
            <input
              name="note"
              maxLength={2000}
              placeholder={t.notePlaceholder}
            />
          </label>
        </section>
        <div hidden>
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <aside className="privacy-note">
          <ShieldCheck size={24} />
          <p>
            <strong>{t.privacyTitle}</strong>
            <br />
            {t.privacy}
          </p>
        </aside>
        <button
          className="button button-primary mobile-submit"
          disabled={busy}
          type="submit"
        >
          <Upload size={20} />
          {busy ? t.submitting : t.submit}
        </button>
      </form>
    </main>
  );
}
