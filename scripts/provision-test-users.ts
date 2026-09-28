import "dotenv/config";
import { z } from "zod";
import { db } from "../src/core/database/client";
import { hashPassword } from "../src/core/security/crypto";
import { audit } from "../src/modules/audit/service";

const userSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(160),
  role: z.enum(["SUPER_ADMIN", "FINANCE_OFFICER", "FINANCE_VERIFIER"]),
});

let stage = "startup";

async function main() {
  stage = "environment";
  if (!["development", "test"].includes(process.env.NODE_ENV ?? ""))
    throw new Error("Test-user provisioning is limited to development/test.");
  const organizationSlug = z
    .string()
    .regex(/^[a-z0-9-]{1,80}$/)
    .parse(process.env.SEED_ORGANIZATION ?? "pdh-dev");
  const users = z
    .array(userSchema)
    .length(3)
    .parse(JSON.parse(process.env.TEST_USERS_JSON ?? "[]"));
  stage = "password-hashing";
  const hashes = await Promise.all(
    users.map((user) => hashPassword(user.password)),
  );

  stage = "database-transaction";
  await db().$transaction(async (tx) => {
    stage = "organization-lookup";
    const organization = await tx.organization.findUnique({
      where: { slug: organizationSlug },
    });
    if (!organization || !organization.active)
      throw new Error("Development organization is unavailable.");
    stage = "role-lookup";
    const roles = await tx.role.findMany({
      where: {
        organizationId: organization.id,
        name: { in: users.map((user) => user.role) },
      },
    });
    if (roles.length !== new Set(users.map((user) => user.role)).size)
      throw new Error(
        "Required development roles are unavailable. Run the development seed first.",
      );

    for (const [index, input] of users.entries()) {
      stage = `user-${index + 1}-upsert`;
      const role = roles.find((candidate) => candidate.name === input.role)!;
      const user = await tx.user.upsert({
        where: {
          organizationId_email: {
            organizationId: organization.id,
            email: input.email,
          },
        },
        create: {
          organizationId: organization.id,
          email: input.email,
          passwordHash: hashes[index],
          displayName: input.displayName,
          status: "ACTIVE",
        },
        update: {
          passwordHash: hashes[index],
          displayName: input.displayName,
          status: "ACTIVE",
          passwordChangedAt: new Date(),
        },
      });
      stage = `user-${index + 1}-sessions`;
      await tx.session.deleteMany({ where: { userId: user.id } });
      stage = `user-${index + 1}-roles`;
      await tx.userRole.deleteMany({
        where: { organizationId: organization.id, userId: user.id },
      });
      await tx.userRole.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          roleId: role.id,
        },
      });
      stage = `user-${index + 1}-audit`;
      await audit(
        tx,
        { organizationId: organization.id, userId: null },
        "TEST_USER_PROVISIONED",
        "user",
        user.id,
      );
    }
  });
  stage = "complete";
  console.log("Three development test users were provisioned.");
}

main()
  .catch(() => {
    console.error(`Test-user provisioning failed during ${stage}.`);
    process.exitCode = 1;
  })
  .finally(() => db().$disconnect());
