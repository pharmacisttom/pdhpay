import { describe, expect, it } from "vitest";
import type { Context } from "@/core/auth/authorization";
import { paymentScope } from "@/modules/payment/application/access";
import { paymentPermissions } from "@/modules/payment/domain/permissions";
import { permissions } from "@/modules/permissions/catalog";

const identity: Context = {
  userId: "officer",
  sessionId: "session",
  organizationId: "hospital-a",
  permissions: ["payment.dashboard.read"],
};

describe("payment Core integration", () => {
  it("rejects missing authentication", () => {
    expect(() => paymentScope(null, "payment.dashboard.read")).toThrow(
      "Please sign in",
    );
  });

  it("does not let a dashboard viewer verify or reopen a shift", () => {
    expect(() => paymentScope(identity, "payment.transaction.verify")).toThrow(
      "permission",
    );
    expect(() => paymentScope(identity, "payment.shift.reopen")).toThrow(
      "permission",
    );
  });

  it("uses the organization in the authenticated context", () => {
    expect(paymentScope(identity, "payment.dashboard.read")).toEqual({
      organizationId: "hospital-a",
    });
    expect(
      paymentScope(
        { ...identity, organizationId: "hospital-b" },
        "payment.dashboard.read",
      ),
    ).toEqual({ organizationId: "hospital-b" });
  });

  it("does not treat a role name as permission", () => {
    expect(() =>
      paymentScope(
        { ...identity, permissions: ["SUPER_ADMIN"] },
        "payment.dashboard.read",
      ),
    ).toThrow("permission");
  });

  it("registers payment permissions once alongside Core permissions", () => {
    expect(new Set(permissions).size).toBe(permissions.length);
    expect(permissions).toContain("users.view");
    for (const permission of paymentPermissions)
      expect(permissions).toContain(permission);
  });
});
