import { requirePermission, type Context } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { audit } from "@/modules/audit/service";
import {
  GoogleDriveStorageService,
  googleDriveConfigured,
} from "../infrastructure/google-drive";

export function driveStatus(ctx: Context) {
  requirePermission(ctx, "payment.admin.manage");
  return { configured: googleDriveConfigured() };
}

export async function testDriveConnection(ctx: Context, requestId?: string) {
  requirePermission(ctx, "payment.admin.manage");
  const result = await new GoogleDriveStorageService().healthCheck();
  await audit(
    db(),
    ctx,
    "GOOGLE_DRIVE_CONNECTION_TESTED",
    "payment-storage",
    undefined,
    "SUCCESS",
    { requestId },
  );
  return result;
}
