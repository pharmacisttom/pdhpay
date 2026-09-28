import { z } from "zod";
import { handle, body } from "@/core/api/handler";
import { context, session } from "@/core/auth/session";
import { AppError } from "@/core/errors";
import { query } from "@/modules/queries";
import * as auth from "@/modules/auth/service";
import {
  loginSchema,
  identity,
  password,
  codeSchema,
  currentPasswordSchema,
  secondFactorSchema,
  registerSchema,
} from "@/modules/auth/schemas";
import {
  createUser,
  updateUser,
  userCreate,
  userUpdate,
  safeUser,
} from "@/modules/users/service";
import { saveRole, deleteRole, roleSchema } from "@/modules/roles/service";
import {
  updateOrganization,
  organizationSchema,
} from "@/modules/organizations/service";
import { saveSettings, settingsSchema } from "@/modules/settings/service";
import { db } from "@/core/database/client";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Route = { params: Promise<{ path: string[] }> };
async function dispatch(request: Request, route: Route) {
  return handle(request, async () => {
    const { path } = await route.params;
    const name = path.join("/");
    const method = request.method;
    if (method === "GET" && name === "health") return { status: "ok" };
    if (method === "POST") {
      if (name === "auth/register")
        return auth.register(await body(request, registerSchema));
      if (name === "auth/login")
        return auth.login(await body(request, loginSchema));
      if (name === "auth/logout") return auth.logout();
      if (name === "auth/forgot-password")
        return auth.forgot(await body(request, identity));
      if (name === "auth/reset-password") {
        const input = await body(
          request,
          z.object({ token: z.string().min(32).max(128), password }).strict(),
        );
        return auth.reset(input.token, input.password);
      }
      if (name === "auth/2fa")
        return auth.challenge((await body(request, codeSchema)).code);
    }
    const ctx = await context();
    if (method === "GET" && name === "auth/me") {
      const user = await db().user.findFirst({
        where: { id: ctx.userId, organizationId: ctx.organizationId },
        select: safeUser,
      });
      const row = await session();
      return {
        user,
        permissions: ctx.permissions,
        organization: {
          id: row.user.organizationId,
          name: row.user.organization.name,
        },
        twoFactorEnabled: !!(
          await db().twoFactorCredential.findUnique({
            where: { userId: ctx.userId },
          })
        )?.enabled,
      };
    }
    if (method === "GET" && path.length === 1)
      return query(
        ctx,
        name,
        Object.fromEntries(new URL(request.url).searchParams),
      );
    if (method === "POST") {
      if (name === "auth/change-password") {
        const input = await body(
          request,
          currentPasswordSchema.extend({ password }),
        );
        return auth.changePassword(ctx, input.currentPassword, input.password);
      }
      if (name === "auth/2fa/setup")
        return auth.setup(
          ctx,
          (await body(request, currentPasswordSchema)).currentPassword,
        );
      if (name === "auth/2fa/enable")
        return auth.enable(ctx, (await body(request, codeSchema)).code);
      if (name === "auth/2fa/disable" || name === "auth/2fa/recovery") {
        const input = await body(request, secondFactorSchema);
        return auth.manageFactor(
          ctx,
          input.currentPassword,
          input.code,
          name.endsWith("disable"),
        );
      }
      if (name === "users")
        return createUser(ctx, await body(request, userCreate));
      if (name === "roles")
        return saveRole(ctx, await body(request, roleSchema));
    }
    if (method === "PATCH" && name === "organizations")
      return updateOrganization(ctx, await body(request, organizationSchema));
    if (method === "PATCH" && name === "settings")
      return saveSettings(ctx, await body(request, settingsSchema));
    if (path.length === 2 && ["users", "roles"].includes(path[0])) {
      const id = z.uuid().parse(path[1]);
      if (method === "PATCH")
        return path[0] === "users"
          ? updateUser(ctx, id, await body(request, userUpdate))
          : saveRole(ctx, await body(request, roleSchema), id);
      if (method === "DELETE") {
        await body(request, z.object({}).strict());
        return path[0] === "users"
          ? updateUser(ctx, id, {}, true)
          : deleteRole(ctx, id);
      }
    }
    throw new AppError("NOT_FOUND", 404, "Endpoint not found.");
  });
}
export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
