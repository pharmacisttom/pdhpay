import { JWT } from "google-auth-library";
import { z } from "zod";
import { db } from "@/core/database/client";
import { AppError } from "@/core/errors";
import { requirePermission, type Context } from "@/core/auth/authorization";
import { audit } from "@/modules/audit/service";

const sheetConfig = z.object({
  GOOGLE_CLIENT_EMAIL: z.email(),
  GOOGLE_PRIVATE_KEY: z.string().min(64),
  GOOGLE_SHEET_ID: z.string().regex(/^[\w-]+$/),
  GOOGLE_SHEET_RANGE: z.string().min(1).max(120).default("Payments!A:K"),
});

function configuration() {
  const parsed = sheetConfig.safeParse({
    ...process.env,
    GOOGLE_SHEET_RANGE: process.env.GOOGLE_SHEET_RANGE || "Payments!A:K",
  });
  if (!parsed.success)
    throw new AppError(
      "SHEETS_UNAVAILABLE",
      503,
      "ยังไม่ได้ตั้งค่าการเชื่อมต่อ Google Sheets",
    );
  return parsed.data;
}

async function token() {
  const config = configuration();
  const client = new JWT({
    email: config.GOOGLE_CLIENT_EMAIL,
    key: config.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const access = await client.getAccessToken();
  if (!access.token) throw new Error("Missing Google access token");
  return { config, accessToken: access.token };
}

async function request(path: string, init: RequestInit = {}) {
  try {
    const { accessToken } = await token();
    const response = await fetch(`https://sheets.googleapis.com/v4/${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Sheets responded ${response.status}`);
    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "SHEETS_UNAVAILABLE",
      503,
      "ไม่สามารถเชื่อมต่อ Google Sheets ได้",
    );
  }
}

export const sheetsConfigSchema = z.object({
  sheetId: z.string().trim().regex(/^[\w-]+$/),
  range: z.string().trim().min(1).max(120).default("Payments!A:K"),
});

export async function googleSheetsStatus(ctx: Context) {
  requirePermission(ctx, "payment.report.export");

  const settings = await db().systemSetting.findMany({
    where: {
      organizationId: ctx.organizationId,
      key: { in: ["GOOGLE_SHEET_ID", "GOOGLE_SHEET_RANGE"] },
    },
  });

  for (const s of settings) {
    if (s.value !== null && s.value !== undefined) {
      process.env[s.key] = String(s.value);
    }
  }

  const parsed = sheetConfig.safeParse({
    ...process.env,
    GOOGLE_SHEET_RANGE: process.env.GOOGLE_SHEET_RANGE || "Payments!A:K",
  });

  return {
    configured: parsed.success,
    sheetId: process.env.GOOGLE_SHEET_ID || "",
    range: parsed.success ? parsed.data.GOOGLE_SHEET_RANGE : process.env.GOOGLE_SHEET_RANGE || "Payments!A:K",
  };
}

export async function saveSheetsConfig(
  ctx: Context,
  input: z.infer<typeof sheetsConfigSchema>,
  requestId?: string,
) {
  requirePermission(ctx, "payment.admin.manage");

  const updates: Record<string, string> = {
    GOOGLE_SHEET_ID: input.sheetId,
    GOOGLE_SHEET_RANGE: input.range || "Payments!A:K",
  };

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
      "GOOGLE_SHEETS_CONFIG_UPDATED",
      "payment-report",
      undefined,
      "SUCCESS",
      { requestId },
    );
  });

  return { success: true };
}

export async function syncReceiptedPayments(ctx: Context, requestId?: string) {
  requirePermission(ctx, "payment.report.export");
  const { config } = await token();
  const range = encodeURIComponent(config.GOOGLE_SHEET_RANGE);
  const existingResponse = await request(
    `spreadsheets/${config.GOOGLE_SHEET_ID}/values/${range}?majorDimension=ROWS`,
  );
  const existing = z
    .object({ values: z.array(z.array(z.unknown())).optional() })
    .parse(await existingResponse.json());
  const known = new Set(
    (existing.values ?? []).slice(1).map((row) => String(row[0] ?? "")),
  );
  const rows = await db().paymentTransaction.findMany({
    where: {
      organizationId: ctx.organizationId,
      status: "RECEIPTED",
      paymentNo: { notIn: [...known].slice(0, 10000) },
    },
    select: {
      paymentNo: true,
      submittedAt: true,
      transferDateTime: true,
      declaredAmount: true,
      verifiedAmount: true,
      sourceBank: true,
      status: true,
      receiptNo: true,
      point: { select: { code: true, name: true } },
    },
    orderBy: { submittedAt: "asc" },
    take: 200,
  });
  if (!rows.length) return { exported: 0 };
  const dataRows = rows.map((row) => [
    row.paymentNo,
    row.submittedAt.toISOString(),
    row.transferDateTime.toISOString(),
    row.point.code,
    row.point.name,
    row.declaredAmount.toFixed(2),
    row.verifiedAmount?.toFixed(2) ?? "",
    row.sourceBank,
    row.status,
    row.receiptNo ?? "",
    ctx.organizationId,
  ]);
  const values = existing.values?.length
    ? dataRows
    : [
        [
          "paymentNo",
          "submittedAt",
          "transferDateTime",
          "pointCode",
          "pointName",
          "declaredAmount",
          "verifiedAmount",
          "sourceBank",
          "status",
          "receiptNo",
          "organizationId",
        ],
        ...dataRows,
      ];
  await request(
    `spreadsheets/${config.GOOGLE_SHEET_ID}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    },
  );
  await audit(
    db(),
    ctx,
    "GOOGLE_SHEETS_EXPORTED",
    "payment-report",
    undefined,
    "SUCCESS",
    { requestId },
  );
  return { exported: dataRows.length };
}
