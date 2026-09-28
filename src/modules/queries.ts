import { db } from "@/core/database/client";
import {
  type Context,
  requirePermission,
  tenantWhere,
} from "@/core/auth/authorization";
import { pagination } from "@/core/api/handler";
import { safeUser } from "@/modules/users/service";
import { getSettings } from "@/modules/settings/service";
import { AppError } from "@/core/errors";
export async function query(
  ctx: Context,
  resource: string,
  params: Record<string, string> = {},
) {
  const p = pagination.parse(params);
  const skip = (p.page - 1) * p.pageSize;
  const take = p.pageSize;
  const meta = (total: number) => ({
    page: p.page,
    pageSize: p.pageSize,
    total,
  });
  if (resource === "users") {
    requirePermission(ctx, "users.view");
    const where = {
      ...tenantWhere(ctx),
      ...(p.q
        ? {
            OR: [
              { displayName: { contains: p.q } },
              { email: { contains: p.q } },
            ],
          }
        : {}),
    };
    const [items, total] = await db().$transaction([
      db().user.findMany({
        where,
        select: {
          ...safeUser,
          roles: { select: { roleId: true, role: { select: { name: true } } } },
        },
        skip,
        take,
        orderBy:
          p.sort === "name"
            ? [{ displayName: "asc" }, { id: "asc" }]
            : [{ createdAt: "desc" }, { id: "asc" }],
      }),
      db().user.count({ where }),
    ]);
    return { items, ...meta(total) };
  }
  if (resource === "roles") {
    requirePermission(ctx, "roles.view");
    const where = { ...tenantWhere(ctx), name: { contains: p.q } };
    const [items, total] = await db().$transaction([
      db().role.findMany({
        where,
        include: {
          permissions: { select: { permission: { select: { name: true } } } },
          _count: { select: { users: true } },
        },
        skip,
        take,
        orderBy:
          p.sort === "name"
            ? [{ name: "asc" }, { id: "asc" }]
            : [{ createdAt: "desc" }, { id: "asc" }],
      }),
      db().role.count({ where }),
    ]);
    return { items, ...meta(total) };
  }
  if (resource === "audit") {
    requirePermission(ctx, "audit.view");
    const where = {
      ...tenantWhere(ctx),
      ...(p.action ? { action: p.action } : {}),
    };
    const [items, total] = await db().$transaction([
      db().auditLog.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),
      db().auditLog.count({ where }),
    ]);
    return { items, ...meta(total) };
  }
  if (resource === "organizations") {
    requirePermission(ctx, "organizations.view");
    return db().organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        createdAt: true,
      },
    });
  }
  if (resource === "permissions") {
    requirePermission(ctx, "roles.view");
    return db().permission.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
  }
  if (resource === "settings") return getSettings(ctx);
  if (resource === "dashboard") {
    return {
      users: ctx.permissions.includes("users.view")
        ? await db().user.count({ where: tenantWhere(ctx) })
        : null,
      roles: ctx.permissions.includes("roles.view")
        ? await db().role.count({ where: tenantWhere(ctx) })
        : null,
      events: ctx.permissions.includes("audit.view")
        ? await db().auditLog.count({ where: tenantWhere(ctx) })
        : null,
      product: "TOMVIS Core",
      version: "0.1.0",
      build: process.env.BUILD_ID ?? "local",
      environment: process.env.NODE_ENV,
    };
  }
  throw new AppError("NOT_FOUND", 404, "Endpoint not found.");
}
