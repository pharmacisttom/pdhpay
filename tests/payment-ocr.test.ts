import { describe, expect, it } from "vitest";
import { extractSlipFields, extractAmountFromSlip } from "@/modules/payment/services/ocr";

describe("payment slip OCR field extraction", () => {
  it("extracts structured fields without retaining raw OCR text", () => {
    const result = extractSlipFields(
      "ธนาคารกรุงไทย จำนวนเงิน 1,250.50 บาท เลขที่รายการ ABCD-123456 2026-09-28 10:45",
    );
    expect(result.amount).toBe("1250.50");
    expect(result.bankName).toBe("กรุงไทย");
    expect(result.reference).toBe("ABCD-123456");
    expect(result.transferAt?.toISOString()).toBe("2026-09-28T03:45:00.000Z");
    expect(result.confidence).toBe(1);
  });

  it("returns low confidence instead of inventing missing fields", () => {
    expect(extractSlipFields("รูปภาพอ่านไม่ชัด")).toEqual({
      amount: undefined,
      reference: undefined,
      bankName: undefined,
      transferAt: null,
      confidence: 0,
    });
  });

  it("extracts exact numeric amount using extractAmountFromSlip", () => {
    expect(extractAmountFromSlip("ธนาคารกสิกรไทย จำนวนเงิน 1,500.00 บาท")).toBe(1500.00);
    expect(extractAmountFromSlip("ยอดเงินโอน 500.00 THB")).toBe(500.00);
    expect(extractAmountFromSlip("Amount: 12,345.67")).toBe(12345.67);
    expect(extractAmountFromSlip("โอนเงินสำเร็จ 2,000.00 บาท")).toBe(2000.00);
    expect(extractAmountFromSlip("ยอดเงิน 350.50 บาท")).toBe(350.50);
  });

  it("handles fallback numeric extraction when amount key phrase is omitted", () => {
    expect(extractAmountFromSlip("สลิปการโอน 123-4-56789-0 ยอดเงิน 1,250.00")).toBe(1250.00);
    expect(extractAmountFromSlip("รายการสำเร็จ 99.00")).toBe(99.00);
    expect(extractAmountFromSlip("ไม่พบตัวเลข")).toBe(null);
  });
});
