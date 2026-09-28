import { z } from "zod";
import { db } from "@/core/database/client";
import {
  type Context,
  requirePermission,
  tenantWhere,
} from "@/core/auth/authorization";
import { permissions } from "@/modules/permissions/catalog";
import { audit } from "@/modules/audit/service";
import { denied, missing, AppError } from "@/core/errors";
export const roleSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    permissions: z.array(z.enum(permissions)).max(50),
  })
  .strict();
export async function saveRole(
  ctx: Context,
  input: z.infer<typeof roleSchema>,
  id?: string,
) {
  requirePermission(ctx, id ? "roles.update" : "roles.create");
  if (input.permissions.some((p) => !ctx.permissions.includes(p))) denied();
  return db().$transaction(async (tx) => {
    if (id) {
      const old = await tx.role.findFirst({
        where: tenantWhere(ctx, id),
        include: {
          users: true,
          permissions: { include: { permission: true } },
        },
      });
      if (!old) missing();
      if (old.users.some((u) => u.userId === ctx.userId))
        throw new AppError(
          "CONFLICT",
          409,
          "Use another administrator to change your role.",
        );
      if (
        old.permissions.some(
          (p) => !ctx.permissions.includes(p.permission.name),
        )
      )
        denied();
      await tx.role.updateMany({
        where: tenantWhere(ctx, id),
        data: { name: input.name },
      });
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
    }
    const role = id
      ? await tx.role.findFirstOrThrow({ where: tenantWhere(ctx, id) })
      : await tx.role.create({
          data: { organizationId: ctx.organizationId, name: input.name },
        });
    const catalog = await tx.permission.findMany({
      where: { name: { in: input.permissions } },
    });
    if (catalog.length !== new Set(input.permissions).size)
      throw new AppError(
        "CONFLICT",
        409,
        "Permission catalog is not initialized.",
      );
    await tx.rolePermission.createMany({
      data: catalog.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });
    await audit(tx, ctx, id ? "ROLE_UPDATED" : "ROLE_CREATED", "role", role.id);
    await audit(tx, ctx, "PERMISSION_CHANGED", "role", role.id);
    return role;
  });
}
export async function deleteRole(ctx: Context, id: string) {
  requirePermission(ctx, "roles.delete");
  return db().$transaction(async (tx) => {
    const role = await tx.role.findFirst({
      where: tenantWhere(ctx, id),
      include: { users: true, permissions: { include: { permission: true } } },
    });
    if (!role) missing();
    if (role.users.length)
      throw new AppError(
        "CONFLICT",
        409,
        "Remove user assignments before deleting this role.",
      );
    if (
      role.permissions.some((p) => !ctx.permissions.includes(p.permission.name))
    )
      denied();
    await tx.role.deleteMany({ where: tenantWhere(ctx, id) });
    await audit(tx, ctx, "ROLE_DELETED", "role", id);
    return { deleted: true };
  });
}
