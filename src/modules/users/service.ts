import { z } from "zod";
import { db } from "@/core/database/client";
import {
  type Context,
  requirePermission,
  tenantWhere,
} from "@/core/auth/authorization";
import { missing, denied, AppError } from "@/core/errors";
import { hashPassword } from "@/core/security/crypto";
import { password } from "@/modules/auth/schemas";
import { audit } from "@/modules/audit/service";
import type { Prisma } from "@/generated/prisma/client";
export const userCreate = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    displayName: z.string().trim().min(1).max(160),
    firstName: z.string().max(80).default(""),
    lastName: z.string().max(80).default(""),
    password,
    roleIds: z.array(z.uuid()).max(20).default([]),
  })
  .strict();
export const userUpdate = userCreate
  .omit({ password: true, email: true })
  .partial()
  .extend({ status: z.enum(["PENDING", "ACTIVE", "DISABLED"]).optional() })
  .strict();
export const safeUser = {
  id: true,
  email: true,
  displayName: true,
  firstName: true,
  lastName: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
} as const;
export async function allowedRoles(
  tx: Prisma.TransactionClient,
  ctx: Context,
  ids: string[],
) {
  requirePermission(ctx, "roles.update");
  const roles = await tx.role.findMany({
    where: { ...tenantWhere(ctx), id: { in: ids } },
    include: { permissions: { include: { permission: true } } },
  });
  if (roles.length !== new Set(ids).size) missing();
  if (
    roles.some((r) =>
      r.permissions.some((p) => !ctx.permissions.includes(p.permission.name)),
    )
  )
    denied();
}
export async function createUser(
  ctx: Context,
  input: z.infer<typeof userCreate>,
) {
  requirePermission(ctx, "users.create");
  const passwordHash = await hashPassword(input.password);
  return db().$transaction(async (tx) => {
    if (input.roleIds.length) await allowedRoles(tx, ctx, input.roleIds);
    const user = await tx.user.create({
      data: {
        organizationId: ctx.organizationId,
        email: input.email,
        displayName: input.displayName,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
      },
      select: safeUser,
    });
    await tx.userRole.createMany({
      data: [...new Set(input.roleIds)].map((roleId) => ({
        organizationId: ctx.organizationId,
        userId: user.id,
        roleId,
      })),
    });
    await audit(tx, ctx, "USER_CREATED", "user", user.id);
    return user;
  });
}
export async function updateUser(
  ctx: Context,
  id: string,
  input: z.infer<typeof userUpdate>,
  disable = false,
) {
  requirePermission(ctx, disable ? "users.delete" : "users.update");
  if (
    id === ctx.userId &&
    (disable || input.status === "DISABLED" || input.roleIds)
  )
    throw new AppError(
      "CONFLICT",
      409,
      "Use another administrator to change your access.",
    );
  return db().$transaction(async (tx) => {
    const existing = await tx.user.findFirst({ where: tenantWhere(ctx, id) });
    if (!existing) missing();
    // A delegated administrator may not alter an account with broader privileges.
    const assignments = await tx.userRole.findMany({
      where: { organizationId: ctx.organizationId, userId: id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
    if (
      assignments.some((r) =>
        r.role.permissions.some(
          (p) => !ctx.permissions.includes(p.permission.name),
        ),
      )
    )
      denied();
    const { roleIds, ...fields } = input;
    if (roleIds) {
      await allowedRoles(tx, ctx, roleIds);
      await tx.userRole.deleteMany({
        where: { organizationId: ctx.organizationId, userId: id },
      });
      await tx.userRole.createMany({
        data: [...new Set(roleIds)].map((roleId) => ({
          organizationId: ctx.organizationId,
          userId: id,
          roleId,
        })),
      });
    }
    await tx.user.updateMany({
      where: tenantWhere(ctx, id),
      data: { ...fields, ...(disable ? { status: "DISABLED" } : {}) },
    });
    if (disable || input.status !== undefined || roleIds)
      await tx.session.deleteMany({ where: { userId: id } });
    await audit(
      tx,
      ctx,
      disable || input.status === "DISABLED"
        ? "USER_DISABLED"
        : input.status === "ACTIVE" && existing.status === "PENDING"
          ? "REGISTRATION_APPROVED"
          : "USER_UPDATED",
      "user",
      id,
    );
    return tx.user.findFirst({ where: tenantWhere(ctx, id), select: safeUser });
  });
}
