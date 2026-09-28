import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/database/client";

export function auditData(
  ctx: { organizationId: string; userId: string | null } | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  result = "SUCCESS",
) {
  return {
    organizationId: ctx?.organizationId,
    actorUserId: ctx?.userId,
    action,
    resourceType,
    resourceId,
    result,
  };
}
// Deliberately no arbitrary metadata or request-body argument: secrets cannot be passed through.
export async function audit(
  tx: Prisma.TransactionClient,
  ctx: { organizationId: string; userId: string | null } | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  result = "SUCCESS",
  details?: {
    requestId?: string;
    oldStatus?: string;
    newStatus?: string;
    oldAmount?: string;
    newAmount?: string;
    version?: number;
    userAgent?: string;
    ipAddress?: string;
  },
) {
  await tx.auditLog.create({
    data: {
      ...auditData(ctx, action, resourceType, resourceId, result),
      ipAddress: details?.ipAddress?.slice(0, 45),
      userAgent: details?.userAgent?.slice(0, 300),
      metadata: details ? {
        requestId: details.requestId,
        oldStatus: details.oldStatus,
        newStatus: details.newStatus,
        oldAmount: details.oldAmount,
        newAmount: details.newAmount,
        version: details.version,
      } : undefined,
    },
  });
}
export async function authAudit(
  ctx: { organizationId: string; userId: string | null } | null,
  action: string,
  result = "SUCCESS",
) {
  await audit(db(), ctx, action, "auth", undefined, result);
}

