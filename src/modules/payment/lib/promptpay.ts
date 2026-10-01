import QRCode from "qrcode";

/**
 * Formats EMVCo Tag-Length-Value
 */
function f(tag: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * CRC16 Calculation (CCITT-FALSE) for EMVCo QR Code
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Generates PromptPay Payload string for EMVCo QR
 * target: Tax ID (13 digits), National ID (13 digits), or Mobile Phone (10 digits starting 0)
 */
export function generatePromptPayPayload(target: string, amount?: number | string): string {
  let formattedTarget = target.replace(/[^0-9]/g, "");

  let targetType = "02"; // 01 = Mobile, 02 = Tax ID / National ID, 03 = E-Wallet
  if (formattedTarget.length === 10 && formattedTarget.startsWith("0")) {
    targetType = "01";
    formattedTarget = "66" + formattedTarget.substring(1);
    formattedTarget = formattedTarget.padStart(13, "0");
  } else {
    formattedTarget = formattedTarget.padStart(13, "0");
  }

  const aid = "A000000677010111"; // PromptPay AID
  const merchantSub = f("00", aid) + f(targetType, formattedTarget);
  const merchantInfo = f("29", merchantSub);

  const currency = f("53", "764"); // 764 = THB
  const country = f("58", "TH"); // TH = Thailand

  let amountStr = "";
  if (amount !== undefined && amount !== null) {
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    if (!isNaN(num) && num > 0) {
      amountStr = f("54", num.toFixed(2));
    }
  }

  const poiMethod = amountStr ? f("01", "12") : f("01", "11"); // 12 = Dynamic, 11 = Static
  const pfi = f("00", "01");

  const rawData = pfi + poiMethod + merchantInfo + currency + (amountStr ? amountStr : "") + country + "6304";
  const checksum = crc16(rawData);

  return rawData + checksum;
}

/**
 * Generates Data URL for QR Code
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 2,
      width: 320,
      color: {
        dark: "#005d59",
        light: "#FFFFFF",
      },
    });
  } catch {
    return "";
  }
}
