import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/core/errors";

const pageContext = vi.hoisted(() => vi.fn());
vi.mock("@/core/auth/page", () => ({ pageContext }));
import FinancePage from "@/app/(dashboard)/finance/page";

describe("finance page server boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("propagates the Core unauthenticated decision before rendering", async () => {
    pageContext.mockRejectedValue(
      new AppError("UNAUTHENTICATED", 401, "Please sign in."),
    );
    await expect(FinancePage()).rejects.toMatchObject({ status: 401 });
  });

  it("denies direct navigation without the finance permission", async () => {
    pageContext.mockResolvedValue({
      userId: "u",
      sessionId: "s",
      organizationId: "a",
      permissions: ["users.view"],
    });
    await expect(FinancePage()).rejects.toMatchObject({ status: 403 });
  });
});
