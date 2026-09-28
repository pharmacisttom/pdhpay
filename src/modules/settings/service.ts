import { z } from "zod";
import { db } from "@/core/database/client";
import { type Context, requirePermission } from "@/core/auth/authorization";
import { audit } from "@/modules/audit/service";
export const settingsSchema = z
  .object({
    applicationName: z.string().trim().min(1).max(80),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
    locale: z.enum(["en", "th"]),
    theme: z.enum(["light", "dark", "system"]),
  })
  .strict();
export async function getSettings(ctx: Context) {
  requirePermission(ctx, "settings.view");
  const rows = await db().systemSetting.findMany({
    where: {
      OR: [
        { scope: "global", organizationId: null },
        { scope: ctx.organizationId, organizationId: ctx.organizationId },
      ],
      key: { in: ["applicationName", "timezone", "locale", "theme"] },
    },
  });
  const values: Record<string, unknown> = {
    applicationName: "TOMVIS Core",
    timezone: "UTC",
    locale: "en",
    theme: "system",
  };
  for (const row of rows.sort(
    (a, b) => Number(a.scope !== "global") - Number(b.scope !== "global"),
  ))
    values[row.key] = row.value;
  return values;
}
export async function saveSettings(
  ctx: Context,
  input: z.infer<typeof settingsSchema>,
) {
  requirePermission(ctx, "settings.update");
  await db().$transaction(async (tx) => {
    for (const [key, value] of Object.entries(input))
      await tx.systemSetting.upsert({
        where: { scope_key: { scope: ctx.organizationId, key } },
        create: {
          scope: ctx.organizationId,
          organizationId: ctx.organizationId,
          key,
          value,
        },
        update: { value },
      });
    await audit(tx, ctx, "SETTINGS_UPDATED", "settings");
  });
  return input;
}
