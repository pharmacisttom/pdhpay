import { describe, expect, it } from "vitest";
import {
  getTranslation,
  formatDate,
  type SupportedLocale,
} from "@/modules/payment/i18n/translations";
import { generatePromptPayPayload } from "@/modules/payment/lib/promptpay";

describe("i18n multilingual translations & utilities", () => {
  const locales: SupportedLocale[] = ["th", "zh-CN", "my", "km"];

  it("has complete translation dictionaries for all 4 required locales", () => {
    locales.forEach((locale) => {
      const dict = getTranslation(locale);
      expect(dict).toBeDefined();
      expect(dict.hospitalName).toBeDefined();
      expect(dict.steps.language).toBeTruthy();
      expect(dict.steps.pay).toBeTruthy();
      expect(dict.bankDetails.pointQrVsPaymentQrNotice).toBeTruthy();
      expect(dict.status.submitted).toBeTruthy();
      expect(dict.reasons.AMOUNT_MISMATCH).toBeTruthy();
      expect(dict.reasons.UNREADABLE_IMAGE).toBeTruthy();
    });
  });

  it("formats dates in Buddhist Era for Thai and AD for zh-CN, my, km", () => {
    const testDate = new Date("2026-10-01T14:30:00Z");

    const thaiDate = formatDate(testDate, "th");
    expect(thaiDate).toContain("2569"); // 2026 + 543 = 2569

    const zhDate = formatDate(testDate, "zh-CN");
    expect(zhDate).toContain("2026年");

    const myDate = formatDate(testDate, "my");
    expect(myDate).toContain("2026");

    const kmDate = formatDate(testDate, "km");
    expect(kmDate).toContain("2026");
  });

  it("generates valid EMVCo PromptPay QR payloads", () => {
    const payloadTaxId = generatePromptPayPayload("0994000165432", 150.5);
    expect(payloadTaxId).toContain("000201"); // PFI
    expect(payloadTaxId).toContain("A000000677010111"); // PromptPay AID
    expect(payloadTaxId).toContain("5406150.50"); // Amount
    expect(payloadTaxId).toContain("5303764"); // THB
    expect(payloadTaxId).toContain("5802TH"); // Thailand

    const payloadMobile = generatePromptPayPayload("0812345678", 500);
    expect(payloadMobile).toContain("000201");
    expect(payloadMobile).toContain("66812345678"); // Formatted Thailand mobile
  });
});
