import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/core/database/client";
import { query } from "@/modules/queries";
import { updateUser } from "@/modules/users/service";
import { hashPassword } from "@/core/security/crypto";
const enabled = !!process.env.TEST_DATABASE_URL;
describe.skipIf(!enabled)("disposable MySQL tenant isolation", () => {
  const ids: string[] = [];
  afterAll(async () => {
    if (!enabled) return;
    for (const id of ids) {
      await db().user.deleteMany({ where: { organizationId: id } });
      await db().role.deleteMany({ where: { organizationId: id } });
      await db().organization.delete({ where: { id } });
    }
    await db().$disconnect();
  });
  it("prevents cross-tenant reads, writes and role assignment at the database boundary", async () => {
    const a = await db().organization.create({
      data: { slug: `test-${randomUUID()}`, name: "Test A" },
    });
    ids.push(a.id);
    const b = await db().organization.create({
      data: { slug: `test-${randomUUID()}`, name: "Test B" },
    });
    ids.push(b.id);
    const user = await db().user.create({
      data: {
        organizationId: b.id,
        email: "b@example.test",
        displayName: "B",
        passwordHash: await hashPassword("disposable-test-password"),
      },
    });
    const role = await db().role.create({
      data: { organizationId: a.id, name: "Test role" },
    });
    const ctx = {
      userId: randomUUID(),
      organizationId: a.id,
      sessionId: randomUUID(),
      permissions: ["users.view", "users.update"],
    };
    const result = (await query(ctx, "users")) as { items: { id: string }[] };
    expect(result.items).toEqual([]);
    await expect(
      updateUser(ctx, user.id, { displayName: "Attacked" }),
    ).rejects.toThrow("not found");
    expect(
      (await db().user.findUniqueOrThrow({ where: { id: user.id } }))
        .displayName,
    ).toBe("B");
    await expect(
      db().userRole.create({
        data: { organizationId: a.id, userId: user.id, roleId: role.id },
      }),
    ).rejects.toThrow();
  });
});
