import Image from "next/image";

const landingInfo = [
  {
    lang: "th",
    label: "ไทย",
    text: "กรุณาสแกน QR Code ที่จุดรับชำระเงินของโรงพยาบาลปลวกแดง เพื่อส่งหลักฐานการโอนเงิน",
    help: "หากไม่พบ QR Code หรือพบปัญหา กรุณาติดต่อเจ้าหน้าที่การเงินประจำจุดรับชำระ",
  },
  {
    lang: "zh",
    label: "中文",
    text: "请扫描普罗登医院付款处的 QR Code 以提交转账凭证。",
    help: "如未找到 QR Code 或遇到问题，请联系现场财务工作人员。",
  },
  {
    lang: "my",
    label: "မြန်မာ",
    text: "ငွေလွှဲပြေစာ တင်ရန် ပလွက်ဒဲင် ဆေးရုံ ငွေလက်ခံသည့်နေရာရှိ QR Code ကို စကန်ဖတ်ပါ။",
    help: "QR Code ရှာမတွေ့ပါက သို့မဟုတ် အခက်အခဲရှိပါက ဘဏ္ဍာရေးဝန်ထမ်းကို ဆက်သွယ်ပါ။",
  },
  {
    lang: "km",
    label: "ខ្មែរ",
    text: "សូមស្កែន QR Code នៅកន្លែងទទួលប្រាក់នៃមន្ទីរពេទ្យផ្លួកដែង ដើម្បីផ្ញើភស្តុតាងការផ្ទេរប្រាក់។",
    help: "ប្រសិនបើរកមិនឃើញ QR Code ឬជួបបញ្ហា សូមទាក់ទងបុគ្គលិកហិរញ្ញវត្ថុ។",
  },
  {
    lang: "en",
    label: "English",
    text: "Please scan the QR Code at the Pluak Daeng Hospital payment counter to submit your transfer slip.",
    help: "If you cannot find the QR Code or encounter issues, please contact counter staff.",
  },
];

export default function PublicPaymentLanding() {
  return (
    <main className="public-payment public-landing">
      <Image
        src="/brand/pdh-finance-logo.png"
        width={180}
        height={180}
        alt="ฝ่ายการเงิน โรงพยาบาลปลวกแดง"
        priority
      />
      <h1>PDH Smart Payment</h1>
      <div className="landing-multilingual-list" style={{ marginTop: "1rem", textAlign: "left" }}>
        {landingInfo.map((info) => (
          <div key={info.lang} style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)" }}>
            <strong style={{ display: "inline-block", marginBottom: "0.25rem", fontSize: "0.9rem", color: "var(--color-brand-accent, #2563eb)" }}>
              {info.label}
            </strong>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>{info.text}</p>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.8 }}>{info.help}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

