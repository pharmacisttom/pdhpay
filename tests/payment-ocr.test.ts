import { describe, expect, it } from "vitest";
import { extractSlipFields } from "@/modules/payment/services/ocr";

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
});
