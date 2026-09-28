import "dotenv/config";
import { z } from "zod";
import { db } from "../src/core/database/client";
import { hashPassword } from "../src/core/security/crypto";
import { permissions } from "../src/modules/permissions/catalog";
import { assertDevelopmentSeed, seedPayment } from "./seeds/payment";
async function main() {
  assertDevelopmentSeed(process.env.NODE_ENV);
  const input = z
    .object({
      SEED_ORGANIZATION: z
        .string()
        .regex(/^[a-z0-9-]{1,80}$/)
        .default("pdh-dev"),
      SEED_ADMIN_EMAIL: z.email().transform((v) => v.toLowerCase()),
      SEED_ADMIN_PASSWORD: z.string().min(12).max(128),
    })
    .parse(process.env);
  const passwordHash = await hashPassword(input.SEED_ADMIN_PASSWORD);
  await db().$transaction(
    async (tx) => {
      const organization = await tx.organization.upsert({
        where: { slug: input.SEED_ORGANIZATION },
        create: {
          slug: input.SEED_ORGANIZATION,
          name: "PDH Smart Payment Development",
        },
        update: {},
      });
      for (const name of permissions)
        await tx.permission.upsert({
          where: { name },
          create: { name },
          update: {},
        });
      const catalog = await tx.permission.findMany();
      for (const name of ["SUPER_ADMIN", "ORG_ADMIN", "MANAGER", "USER"]) {
        const role = await tx.role.upsert({
          where: {
            organizationId_name: { organizationId: organization.id, name },
          },
          create: { organizationId: organization.id, name },
          update: {},
        });
        const allowed =
          name === "USER"
            ? []
            : name === "MANAGER"
              ? ["users.view", "organizations.view"]
              : permissions;
        for (const permission of catalog.filter((p) =>
          allowed.includes(p.name as (typeof permissions)[number]),
        ))
          await tx.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            create: { roleId: role.id, permissionId: permission.id },
            update: {},
          });
        if (name === "ORG_ADMIN") {
          const user = await tx.user.upsert({
            where: {
              organizationId_email: {
                organizationId: organization.id,
                email: input.SEED_ADMIN_EMAIL,
              },
            },
            create: {
              organizationId: organization.id,
              email: input.SEED_ADMIN_EMAIL,
              passwordHash,
              displayName: "Development administrator",
            },
            update: {},
          });
          await tx.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: role.id } },
            create: {
              organizationId: organization.id,
              userId: user.id,
              roleId: role.id,
            },
            update: {},
          });
          await seedPayment(tx, organization.id, user.id);
        }
      }
    },
    { timeout: 30000 },
  );
  console.log(
    "Development organization and permission catalog initialized. Existing passwords were preserved.",
  );
}
main()
  .catch(() => {
    console.error(
      "Seed failed. Check configuration and database availability.",
    );
    process.exitCode = 1;
  })
  .finally(() => db().$disconnect());
