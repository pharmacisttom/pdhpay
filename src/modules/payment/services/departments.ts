import { db } from "@/core/database/client";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { missing, AppError } from "@/core/errors";
import { audit } from "@/modules/audit/service";
import { z } from "zod";

export const departmentInput = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{1,40}$/),
  name: z.string().trim().min(1).max(160),
  description: z.string().max(500).optional().nullable(),
  active: z.boolean().default(true),
}).strict();

export type DepartmentInput = z.infer<typeof departmentInput>;

export async function listDepartments(ctx: Context) {
  requirePermission(ctx, "payment.point.read");
  return db().department.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { code: "asc" },
    take: 200,
  });
}

export async function saveDepartment(
  ctx: Context,
  input: DepartmentInput,
  id?: string,
  requestId?: string
) {
  requirePermission(ctx, "payment.admin.manage");
  return db().$transaction(async (tx) => {
    if (id) {
      const existing = await tx.department.findFirst({
        where: { id, organizationId: ctx.organizationId },
      });
      if (!existing) missing();

      const updated = await tx.department.update({
        where: { id },
        data: {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          active: input.active,
        },
      });

      await audit(tx, ctx, "DEPARTMENT_UPDATED", "department", id, "SUCCESS", {
        requestId,
      });

      return updated;
    } else {
      const existingCode = await tx.department.findFirst({
        where: { organizationId: ctx.organizationId, code: input.code },
      });
      if (existingCode) {
        throw new AppError("CONFLICT", 409, "รหัสแผนกนี้มีอยู่ในระบบแล้ว");
      }

      const created = await tx.department.create({
        data: {
          organizationId: ctx.organizationId,
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          active: input.active,
        },
      });

      await audit(tx, ctx, "DEPARTMENT_CREATED", "department", created.id, "SUCCESS", {
        requestId,
      });

      return created;
    }
  });
}
