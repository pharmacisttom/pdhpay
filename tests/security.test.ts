import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  totp,
  totpStep,
  digest,
  token,
} from "@/core/security/crypto";
import {
  requireContext,
  requirePermission,
  tenantWhere,
  type Context,
} from "@/core/auth/authorization";
import { mutationGuard, body, handle, pagination } from "@/core/api/handler";
import { loginSchema } from "@/modules/auth/schemas";
const ctx: Context = {
  userId: "a",
  organizationId: "tenant-a",
  sessionId: "s",
  permissions: ["users.view"],
};
describe("security boundaries", () => {
  it("rejects an unauthenticated context and denies USER admin actions", () => {
    expect(() => requireContext(null)).toThrow("Please sign in");
    expect(() => requirePermission(ctx, "users.create")).toThrow("permission");
  });
  it("derives tenant constraints from authenticated context", () => {
    expect(tenantWhere(ctx, "resource-b")).toEqual({
      organizationId: "tenant-a",
      id: "resource-b",
    });
  });
  it("requires matching Origin and JSON for mutations", () => {
    expect(() =>
      mutationGuard(
        new Request("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            origin: "https://evil.example",
            "content-type": "application/json",
          },
        }),
      ),
    ).toThrow("origin");
    expect(() =>
      mutationGuard(
        new Request("http://localhost:3000/api/v1/users", {
          method: "POST",
          headers: {
            origin: "http://localhost:3000",
            "content-type": "text/plain",
          },
        }),
      ),
    ).toThrow("application/json");
  });
  it("rejects tenant injection, malformed inputs and excessive pagination", () => {
    expect(
      loginSchema.safeParse({
        organization: "a",
        email: "a@example.com",
        password: "p",
        organizationId: "b",
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        organization: "a",
        email: "invalid",
        password: "p",
      }).success,
    ).toBe(false);
    expect(() => pagination.parse({ pageSize: 1000 })).toThrow();
  });
  it("rejects malformed and oversized JSON", async () => {
    await expect(
      body(
        new Request("http://localhost", { method: "POST", body: "{" }),
        loginSchema,
      ),
    ).rejects.toThrow("Invalid JSON");
    await expect(
      body(
        new Request("http://localhost", {
          method: "POST",
          body: "a".repeat(17000),
        }),
        loginSchema,
      ),
    ).rejects.toThrow("too large");
  });
  it("does not expose internal error details", async () => {
    const response = await handle(new Request("http://localhost"), async () => {
      throw new Error("mysql://secret-password");
    });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain(
      "secret-password",
    );
  });
});
describe("cryptographic primitives", () => {
  it("uses salted Argon2id and rejects the wrong password", async () => {
    const value = "a-long-test-password";
    const hash = await hashPassword(value);
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, value)).toBe(true);
    expect(await verifyPassword(hash, "incorrect")).toBe(false);
  });
  it("encrypts with unique nonces and authenticates ciphertext", () => {
    const value = "test-secret";
    const encrypted = encrypt(value);
    expect(encrypted).not.toContain(value);
    expect(decrypt(encrypted)).toBe(value);
    expect(encrypt(value)).not.toBe(encrypted);
    const bytes = Buffer.from(encrypted, "base64");
    bytes[15] ^= 1;
    expect(() => decrypt(bytes.toString("base64"))).toThrow();
  });
  it("rejects a wrong encryption key", () => {
    const encrypted = encrypt("secret");
    const key = process.env.TOTP_ENCRYPTION_KEY;
    process.env.TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => decrypt(encrypted)).toThrow();
    process.env.TOTP_ENCRYPTION_KEY = key;
  });
  it("matches RFC 6238 SHA1 six-digit vector at 59 seconds", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(totp(secret).generate({ timestamp: 59000 })).toBe("287082");
    expect(totpStep(secret, "287082", 59000)).toBe(1);
    expect(totpStep(secret, "invalid", 59000)).toBeNull();
  });
  it("generates high-entropy tokens and stable non-plaintext digests", () => {
    const raw = token();
    expect(raw.length).toBeGreaterThanOrEqual(43);
    expect(token()).not.toBe(raw);
    expect(digest(raw)).toHaveLength(64);
    expect(digest(raw)).toBe(digest(raw));
  });
});
