import { describe, expect, it } from "vitest";
import { assertDevelopmentSeed, financeRoles } from "../prisma/seeds/payment";

describe("development seed policy", () => {
  it("refuses production and unspecified environments", () => {
    for (const mode of ["production", undefined, "staging"])
      expect(() => assertDevelopmentSeed(mode)).toThrow();
    expect(() => assertDevelopmentSeed("development")).not.toThrow();
    expect(() => assertDevelopmentSeed("test")).not.toThrow();
  });
  it("keeps executive and auditor roles read-only except report exports", () => {
    for (const role of ["EXECUTIVE_VIEWER", "FINANCE_AUDITOR"]) {
      expect(
        financeRoles[role].every(
          (p) => p.endsWith(".read") || p === "payment.report.export",
        ),
      ).toBe(true);
    }
  });
});
