import { db } from "@/core/database/client";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { missing, AppError } from "@/core/errors";
import { audit } from "@/modules/audit/service";
import { z } from "zod";

export const userRoleUpdateInput = z.object({
  roleIds: z.array(z.string().uuid()),
}).strict();

export async function listAdminUsers(ctx: Context) {
  requirePermission(ctx, "admin.users.manage");
  const users = await db().user.findMany({
    where: { organizationId: ctx.organizationId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      roles: {
        select: {
          role: {
            select: { id: true, name: true },
          },
        },
      },
      paymentAssignments: {
        select: {
          point: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const availableRoles = await db().role.findMany({
    where: { organizationId: ctx.organizationId },
    select: { id: true, name: true },
  });

  return { users, availableRoles };
}

export async function updateUserRoles(
  ctx: Context,
  userId: string,
  roleIds: string[],
  requestId?: string
) {
  requirePermission(ctx, "admin.users.manage");
  return db().$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: userId, organizationId: ctx.organizationId },
    });
    if (!user) missing();

    // Verify all roles belong to the organization
    const roles = await tx.role.findMany({
      where: {
        organizationId: ctx.organizationId,
        id: { in: roleIds },
      },
    });

    if (roles.length !== roleIds.length) {
      throw new AppError("INVALID_INPUT", 400, "พบสิทธิ์การใช้งานที่ไม่ถูกต้อง");
    }

    // Delete existing roles
    await tx.userRole.deleteMany({
      where: { organizationId: ctx.organizationId, userId },
    });

    // Insert new roles
    if (roleIds.length > 0) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          organizationId: ctx.organizationId,
          userId,
          roleId,
        })),
      });
    }

    await audit(tx, ctx, "USER_ROLES_UPDATED", "user", userId, "SUCCESS", {
      requestId,
    });

    return { userId, roleIds };
  });
}
