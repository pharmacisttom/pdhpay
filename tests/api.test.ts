import { beforeEach, describe, it, expect, vi } from "vitest";
import { AppError } from "@/core/errors";
const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/core/auth/session", () => ({
  context: mocks.context,
  session: vi.fn(),
  createSession: vi.fn(),
  setSessionCookie: vi.fn(),
}));
vi.mock("@/core/database/client", () => ({
  db: () => ({
    user: { findMany: mocks.findMany, count: mocks.count },
    $transaction: mocks.transaction,
  }),
}));
import { GET, POST } from "@/app/api/v1/[...path]/route";
describe("protected route integration", () => {
  beforeEach(() => vi.clearAllMocks());
  it("returns 401 before touching the database", async () => {
    mocks.context.mockRejectedValue(
      new AppError("UNAUTHENTICATED", 401, "Please sign in."),
    );
    const response = await GET(new Request("http://localhost/api/v1/users"), {
      params: Promise.resolve({ path: ["users"] }),
    });
    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
  it("returns 403 for a user lacking admin permission", async () => {
    mocks.context.mockResolvedValue({
      userId: "u",
      organizationId: "a",
      permissions: [],
    });
    const response = await POST(
      new Request("http://localhost/api/v1/users", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "a@example.com",
          displayName: "A",
          password: "long-test-password",
        }),
      }),
      { params: Promise.resolve({ path: ["users"] }) },
    );
    expect(response.status).toBe(403);
  });
  it("only queries Organization A when returning users", async () => {
    mocks.context.mockResolvedValue({
      userId: "u",
      organizationId: "a",
      permissions: ["users.view"],
    });
    mocks.findMany.mockResolvedValue([{ id: "user-a" }]);
    mocks.count.mockResolvedValue(1);
    mocks.transaction.mockImplementation((promises: Promise<unknown>[]) =>
      Promise.all(promises),
    );
    const response = await GET(new Request("http://localhost/api/v1/users"), {
      params: Promise.resolve({ path: ["users"] }),
    });
    expect(response.status).toBe(200);
    expect(mocks.findMany.mock.calls[0][0].where.organizationId).toBe("a");
    expect(mocks.count.mock.calls[0][0].where.organizationId).toBe("a");
    expect(mocks.findMany.mock.calls[0][0].select.passwordHash).toBeUndefined();
  });
  it("rejects browser-supplied organization overrides", async () => {
    mocks.context.mockResolvedValue({
      userId: "u",
      organizationId: "a",
      permissions: ["users.view"],
    });
    const response = await GET(
      new Request("http://localhost/api/v1/users?organizationId=b"),
      { params: Promise.resolve({ path: ["users"] }) },
    );
    expect(response.status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
