import { z } from "zod";
import { db } from "@/core/database/client";
import { type Context, requirePermission } from "@/core/auth/authorization";
import { audit } from "@/modules/audit/service";
export const organizationSchema = z
  .object({ name: z.string().trim().min(1).max(160) })
  .strict();
export async function updateOrganization(
  ctx: Context,
  input: z.infer<typeof organizationSchema>,
) {
  requirePermission(ctx, "organizations.update");
  return db().$transaction(async (tx) => {
    const row = await tx.organization.update({
      where: { id: ctx.organizationId },
      data: input,
      select: { id: true, name: true, slug: true },
    });
    await audit(
      tx,
      ctx,
      "ORGANIZATION_UPDATED",
      "organization",
      ctx.organizationId,
    );
    return row;
  });
}
