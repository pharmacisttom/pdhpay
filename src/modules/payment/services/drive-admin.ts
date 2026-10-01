import { z } from "zod";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { audit } from "@/modules/audit/service";
import {
  GoogleDriveStorageService,
  googleDriveConfigured,
} from "../infrastructure/google-drive";

export const driveConfigSchema = z.object({
  clientEmail: z.string().trim().email(),
  privateKey: z.string().trim().optional(),
  folderId: z.string().trim().regex(/^[\w-]+$/),
  sharedDriveId: z.string().trim().optional(),
  visionEnabled: z.boolean().default(false),
});

export async function driveStatus(ctx: Context) {
  requirePermission(ctx, "payment.admin.manage");
  
  // Load settings from DB if available
  const settings = await db().systemSetting.findMany({
    where: {
      organizationId: ctx.organizationId,
      key: {
        in: [
          "GOOGLE_CLIENT_EMAIL",
          "GOOGLE_PRIVATE_KEY",
          "GOOGLE_DRIVE_FOLDER_ID",
          "GOOGLE_SHARED_DRIVE_ID",
          "GOOGLE_VISION_ENABLED",
        ],
      },
    },
  });

  for (const s of settings) {
    if (s.value !== null && s.value !== undefined) {
      process.env[s.key] = String(s.value);
    }
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
  const sharedDriveId = process.env.GOOGLE_SHARED_DRIVE_ID || "";
  const visionEnabled = process.env.GOOGLE_VISION_ENABLED === "true";
  const configured = googleDriveConfigured();

  return {
    configured,
    clientEmail,
    folderId,
    sharedDriveId,
    visionEnabled,
  };
}

export async function saveDriveConfig(
  ctx: Context,
  input: z.infer<typeof driveConfigSchema>,
  requestId?: string,
) {
  requirePermission(ctx, "payment.admin.manage");

  const updates: Record<string, string> = {
    GOOGLE_CLIENT_EMAIL: input.clientEmail,
    GOOGLE_DRIVE_FOLDER_ID: input.folderId,
    GOOGLE_SHARED_DRIVE_ID: input.sharedDriveId || "",
    GOOGLE_VISION_ENABLED: input.visionEnabled ? "true" : "false",
  };

  if (input.privateKey) {
    updates.GOOGLE_PRIVATE_KEY = input.privateKey;
  }

  await db().$transaction(async (tx) => {
    for (const [key, value] of Object.entries(updates)) {
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
      process.env[key] = value;
    }

    await audit(
      tx,
      ctx,
      "GOOGLE_DRIVE_CONFIG_UPDATED",
      "payment-storage",
      undefined,
      "SUCCESS",
      { requestId },
    );
  });

  return { success: true };
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
