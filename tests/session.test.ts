import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mocks.get }) }));
vi.mock("@/core/database/client", () => ({
  db: () => ({
    session: { findUnique: mocks.findUnique, updateMany: mocks.updateMany },
  }),
}));
import { session, context } from "@/core/auth/session";
const row = () => ({
  id: "s",
  userId: "u",
  pendingTwoFactor: false,
  expiresAt: new Date(Date.now() + 100000),
  idleExpiresAt: new Date(Date.now() + 100000),
  user: {
    status: "ACTIVE",
    organizationId: "a",
    organization: { active: true },
    roles: [
      { role: { permissions: [{ permission: { name: "users.view" } }] } },
    ],
  },
});
describe("server session authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockReturnValue({ value: "opaque-token" });
    mocks.findUnique.mockResolvedValue(row());
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });
  it("does not accept a missing cookie", async () => {
    mocks.get.mockReturnValue(undefined);
    await expect(session()).rejects.toThrow("sign in");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("rejects pending 2FA sessions for protected routes", async () => {
    mocks.findUnique.mockResolvedValue({ ...row(), pendingTwoFactor: true });
    await expect(context()).rejects.toThrow("sign in");
  });
  it.each(["expiresAt", "idleExpiresAt"])(
    "rejects expired %s",
    async (field) => {
      mocks.findUnique.mockResolvedValue({ ...row(), [field]: new Date(0) });
      await expect(session()).rejects.toThrow("sign in");
    },
  );
  it("rejects disabled accounts and organizations", async () => {
    const disabled = row();
    disabled.user.status = "DISABLED";
    mocks.findUnique.mockResolvedValue(disabled);
    await expect(session()).rejects.toThrow("sign in");
    disabled.user.status = "ACTIVE";
    disabled.user.organization.active = false;
    await expect(session()).rejects.toThrow("sign in");
  });
  it("rejects a session revoked during refresh", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(session()).rejects.toThrow("sign in");
  });
  it("resolves tenant and permissions from persisted identity", async () => {
    expect(await context()).toEqual({
      sessionId: "s",
      userId: "u",
      organizationId: "a",
      permissions: ["users.view"],
    });
    expect(mocks.findUnique.mock.calls[0][0].where.tokenHash).not.toBe(
      "opaque-token",
    );
  });
});
