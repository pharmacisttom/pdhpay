import { randomBytes } from "node:crypto";
import { db } from "@/core/database/client";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { AppError, missing } from "@/core/errors";
import { audit } from "@/modules/audit/service";
import { pointInput, pointUpdate, staffInput, bankInput } from "../validators";
import type { z } from "zod";
export const pointScope = (ctx: Context) => ({
  organizationId: ctx.organizationId,
  ...(ctx.permissions.includes("payment.admin.manage")
    ? {}
    : { users: { some: { userId: ctx.userId } } }),
});
export async function getPoint(ctx: Context, pointId: string) {
  requirePermission(ctx, "payment.point.read");
  const point = await db().paymentPoint.findFirst({
    where: { id: pointId, ...pointScope(ctx) },
    include: { bankAccount: true, users: { select: { userId: true } } },
  });
  if (!point) missing();
  return point;
}
export async function savePoint(
  ctx: Context,
  input: z.infer<typeof pointInput> | z.infer<typeof pointUpdate>,
  pointId?: string,
  requestId?: string,
) {
  requirePermission(
    ctx,
    pointId ? "payment.point.update" : "payment.point.create",
  );
  if (input.status !== "ACTIVE")
    requirePermission(ctx, "payment.point.disable");
  const { expectedUpdatedAt, ...data } =
    "expectedUpdatedAt" in input
      ? input
      : { ...input, expectedUpdatedAt: undefined };
  return db().$transaction(async (tx) => {
    const bank = await tx.bankAccount.findFirst({
      where: { id: data.bankAccountId, organizationId: ctx.organizationId },
    });
    if (!bank || (data.status === "ACTIVE" && !bank.active))
      throw new AppError(
        "INVALID_INPUT",
        400,
        "กรุณาเลือกบัญชีธนาคารที่เปิดใช้งาน",
      );
    if (pointId) {
      const result = await tx.paymentPoint.updateMany({
        where: {
          id: pointId,
          organizationId: ctx.organizationId,
          updatedAt: new Date(expectedUpdatedAt!),
        },
        data,
      });
      if (result.count !== 1)
        throw new AppError("CONFLICT", 409, "ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่");
    } else {
      const point = await tx.paymentPoint.create({
        data: {
          ...data,
          organizationId: ctx.organizationId,
          createdBy: ctx.userId,
          qrToken: randomBytes(32).toString("hex"),
        },
      });
      pointId = point.id;
    }
    await audit(
      tx,
      ctx,
      data.status === "ACTIVE"
        ? expectedUpdatedAt
          ? "PAYMENT_POINT_UPDATED"
          : "PAYMENT_POINT_CREATED"
        : "PAYMENT_POINT_DISABLED",
      "paymentPoint",
      pointId,
      "SUCCESS",
      { requestId },
    );
    return { id: pointId };
  });
}
export async function assignStaff(
  ctx: Context,
  pointId: string,
  input: z.infer<typeof staffInput>,
  requestId?: string,
) {
  requirePermission(ctx, "payment.point.assign_staff");
  return db().$transaction(async (tx) => {
    const point = await tx.paymentPoint.updateMany({
      where: {
        id: pointId,
        organizationId: ctx.organizationId,
        updatedAt: new Date(input.expectedUpdatedAt),
      },
      data: { updatedAt: new Date() },
    });
    if (point.count !== 1)
      throw new AppError("CONFLICT", 409, "ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่");
    const ids = [...new Set(input.userIds)];
    if (
      (await tx.user.count({
        where: {
          organizationId: ctx.organizationId,
          id: { in: ids },
          status: "ACTIVE",
        },
      })) !== ids.length
    )
      throw new AppError("INVALID_INPUT", 400, "เจ้าหน้าที่ไม่ถูกต้อง");
    await tx.paymentPointUser.deleteMany({
      where: { organizationId: ctx.organizationId, paymentPointId: pointId },
    });
    await tx.paymentPointUser.createMany({
      data: ids.map((userId) => ({
        organizationId: ctx.organizationId,
        paymentPointId: pointId,
        userId,
      })),
    });
    await audit(
      tx,
      ctx,
      "PAYMENT_POINT_STAFF_CHANGED",
      "paymentPoint",
      pointId,
      "SUCCESS",
      { requestId },
    );
    return { id: pointId };
  });
}
export async function rotateToken(
  ctx: Context,
  pointId: string,
  requestId?: string,
) {
  requirePermission(ctx, "payment.point.update");
  return db().$transaction(async (tx) => {
    const result = await tx.paymentPoint.updateMany({
      where: { organizationId: ctx.organizationId, id: pointId },
      data: { qrToken: randomBytes(32).toString("hex") },
    });
    if (result.count !== 1) missing();
    await audit(
      tx,
      ctx,
      "PAYMENT_POINT_QR_ROTATED",
      "paymentPoint",
      pointId,
      "SUCCESS",
      { requestId },
    );
    return { id: pointId };
  });
}
export async function saveBank(
  ctx: Context,
  input: z.infer<typeof bankInput>,
  bankId?: string,
  requestId?: string,
) {
  requirePermission(ctx, "payment.admin.manage");
  return db().$transaction(async (tx) => {
    if (bankId) {
      if (
        (
          await tx.bankAccount.updateMany({
            where: { id: bankId, organizationId: ctx.organizationId },
            data: input,
          })
        ).count !== 1
      )
        missing();
    } else
      bankId = (
        await tx.bankAccount.create({
          data: { ...input, organizationId: ctx.organizationId },
        })
      ).id;
    await audit(
      tx,
      ctx,
      "PAYMENT_BANK_UPDATED",
      "bankAccount",
      bankId,
      "SUCCESS",
      { requestId },
    );
    return { id: bankId };
  });
}
