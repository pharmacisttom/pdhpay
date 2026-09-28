import { randomBytes } from "node:crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { db } from "@/core/database/client";
import {
  digest,
  token,
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  totp,
  totpStep,
} from "@/core/security/crypto";
import { rateLimit } from "@/core/security/rate-limit";
import { AppError } from "@/core/errors";
import { session, setSessionCookie } from "@/core/auth/session";
import type { Context } from "@/core/auth/authorization";
import type { Prisma } from "@/generated/prisma/client";
import { audit, authAudit } from "@/modules/audit/service";
import { env } from "@/core/config/env";
import { resetDelivery } from "./delivery";
const invalid = () =>
  new AppError(
    "INVALID_CREDENTIALS",
    401,
    "Invalid credentials or verification code.",
  );
let dummyHash: Promise<string> | undefined;
export async function login(input: {
  organization: string;
  email: string;
  password: string;
}) {
  await rateLimit("login:aggregate", 300);
  await rateLimit(`login:${input.organization}:${input.email}`, 10);
  const user = await db().user.findFirst({
    where: { email: input.email, organization: { slug: input.organization } },
    include: { organization: true, twoFactor: true },
  });
  dummyHash ??= hashPassword(token());
  const valid = await verifyPassword(
    user?.passwordHash ?? (await dummyHash),
    input.password,
  );
  if (
    !user ||
    !valid ||
    user.status !== "ACTIVE" ||
    !user.organization.active
  ) {
    await authAudit(
      user ? { userId: user.id, organizationId: user.organizationId } : null,
      "LOGIN_FAILED",
      "FAILURE",
    );
    throw invalid();
  }
  const raw = token();
  const pending = await db().$transaction(async (tx) => {
    const locked = await tx.user.updateMany({
      where: { id: user.id, passwordHash: user.passwordHash, status: "ACTIVE" },
      data: { updatedAt: new Date() },
    });
    if (locked.count !== 1) throw invalid();
    const factor = await tx.twoFactorCredential.findUnique({
      where: { userId: user.id },
    });
    const pending = !!factor?.enabled;
    const duration = pending ? 300 : 28800;
    await tx.session.create({
      data: {
        userId: user.id,
        tokenHash: digest(raw),
        pendingTwoFactor: pending,
        expiresAt: new Date(Date.now() + duration * 1000),
        idleExpiresAt: new Date(Date.now() + Math.min(duration, 1800) * 1000),
      },
    });
    if (!pending) {
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      await audit(
        tx,
        { userId: user.id, organizationId: user.organizationId },
        "LOGIN_SUCCESS",
        "auth",
      );
    }
    return pending;
  });
  await setSessionCookie(raw, pending ? 300 : 28800);
  return { requiresTwoFactor: pending };
}
export async function register(input: {
  organization: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  await rateLimit("register:aggregate", 50, 3600);
  await rateLimit(`register:${input.organization}:${input.email}`, 3, 3600);
  const organization = await db().organization.findFirst({
    where: { slug: input.organization, active: true },
    select: { id: true },
  });
  if (!organization)
    throw new AppError(
      "REGISTRATION_UNAVAILABLE",
      400,
      "ไม่สามารถสมัครสมาชิกสำหรับหน่วยงานนี้ได้",
    );
  const passwordHash = await hashPassword(input.password);
  return db().$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName: `${input.firstName} ${input.lastName}`.trim(),
        passwordHash,
        status: "PENDING",
      },
      select: { id: true },
    });
    await audit(
      tx,
      { organizationId: organization.id, userId: user.id },
      "REGISTRATION_REQUESTED",
      "user",
      user.id,
    );
    return { message: "ส่งคำขอสมัครแล้ว กรุณารอผู้ดูแลกำหนดบทบาทและอนุมัติ" };
  });
}
async function consumeFactor(
  tx: Prisma.TransactionClient,
  userId: string,
  code: string,
) {
  const credential = await tx.twoFactorCredential.findUnique({
    where: { userId },
  });
  if (!credential?.enabled) throw invalid();
  if (/^\d{6}$/.test(code)) {
    const step = totpStep(decrypt(credential.encryptedSecret), code);
    if (step === null || step <= credential.lastStep) throw invalid();
    const changed = await tx.twoFactorCredential.updateMany({
      where: { userId, enabled: true, lastStep: { lt: step } },
      data: { lastStep: step },
    });
    if (changed.count !== 1) throw invalid();
  } else {
    const changed = await tx.recoveryCode.updateMany({
      where: { userId, codeHash: digest(code), usedAt: null },
      data: { usedAt: new Date() },
    });
    if (changed.count !== 1) throw invalid();
  }
}
export async function challenge(code: string) {
  const row = await session(true);
  await rateLimit(`2fa:${row.userId}`, 10);
  const raw = token();
  await db().$transaction(async (tx) => {
    const active = await tx.user.updateMany({
      where: { id: row.userId, status: "ACTIVE" },
      data: { updatedAt: new Date() },
    });
    if (active.count !== 1) throw invalid();
    await consumeFactor(tx, row.userId, code);
    const consumed = await tx.session.deleteMany({
      where: {
        id: row.id,
        pendingTwoFactor: true,
        expiresAt: { gt: new Date() },
      },
    });
    if (consumed.count !== 1) throw invalid();
    await tx.session.create({
      data: {
        userId: row.userId,
        tokenHash: digest(raw),
        expiresAt: new Date(Date.now() + 28800000),
        idleExpiresAt: new Date(Date.now() + 1800000),
      },
    });
    await tx.user.update({
      where: { id: row.userId },
      data: { lastLoginAt: new Date() },
    });
    await audit(
      tx,
      { userId: row.userId, organizationId: row.user.organizationId },
      "LOGIN_SUCCESS",
      "auth",
    );
  });
  await setSessionCookie(raw, 28800);
  return { authenticated: true };
}
export async function logout() {
  let row;
  try {
    row = await session();
  } catch {
    try {
      row = await session(true);
    } catch {
      /* idempotent logout */
    }
  }
  if (row)
    await db().$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { id: row.id } });
      await audit(
        tx,
        { userId: row.userId, organizationId: row.user.organizationId },
        "LOGOUT",
        "auth",
      );
    });
  await setSessionCookie("", 0);
  return { loggedOut: true };
}
export async function forgot(input: { organization: string; email: string }) {
  await rateLimit("reset:aggregate", 100);
  await rateLimit(`reset:${input.organization}:${input.email}`, 3);
  const user = await db().user.findFirst({
    where: {
      email: input.email,
      status: "ACTIVE",
      organization: { slug: input.organization, active: true },
    },
  });
  const deliver = resetDelivery();
  if (user && deliver) {
    const raw = token();
    await db().passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: digest(raw),
        expiresAt: new Date(Date.now() + 1800000),
      },
    });
    try {
      await deliver({
        to: user.email,
        url: `${env().APP_URL}/reset-password#token=${encodeURIComponent(raw)}`,
      });
    } catch {
      console.error(
        JSON.stringify({ level: "error", event: "RESET_DELIVERY_FAILED" }),
      );
    }
  }
  return { message: "If the account is eligible, a reset link will be sent." };
}
export async function reset(raw: string, password: string) {
  await rateLimit("reset-consume:aggregate", 100);
  const hash = await hashPassword(password);
  await db().$transaction(async (tx) => {
    const row = await tx.passwordReset.findUnique({
      where: { tokenHash: digest(raw) },
      include: { user: { include: { organization: true } } },
    });
    if (
      !row ||
      row.usedAt ||
      row.expiresAt <= new Date() ||
      row.user.status !== "ACTIVE" ||
      !row.user.organization.active
    )
      throw invalid();
    const count = await tx.passwordReset.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (count.count !== 1) throw invalid();
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash: hash, passwordChangedAt: new Date() },
    });
    await tx.session.deleteMany({ where: { userId: row.userId } });
    await tx.passwordReset.deleteMany({ where: { userId: row.userId } });
    await audit(
      tx,
      { userId: row.userId, organizationId: row.user.organizationId },
      "PASSWORD_RESET",
      "user",
      row.userId,
    );
  });
  return { message: "Password reset. Sign in again." };
}
async function reauthenticate(ctx: Context, password: string) {
  await rateLimit(`reauth:${ctx.userId}`, 10);
  const user = await db().user.findFirst({
    where: {
      id: ctx.userId,
      organizationId: ctx.organizationId,
      status: "ACTIVE",
    },
  });
  if (!user || !(await verifyPassword(user.passwordHash, password)))
    throw invalid();
  return user;
}
export async function changePassword(
  ctx: Context,
  current: string,
  password: string,
) {
  const user = await reauthenticate(ctx, current);
  const hash = await hashPassword(password);
  await db().$transaction(async (tx) => {
    const changed = await tx.user.updateMany({
      where: { id: user.id, passwordHash: user.passwordHash },
      data: { passwordHash: hash, passwordChangedAt: new Date() },
    });
    if (changed.count !== 1) throw invalid();
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.passwordReset.deleteMany({ where: { userId: user.id } });
    await audit(tx, ctx, "PASSWORD_CHANGED", "user", user.id);
  });
  await setSessionCookie("", 0);
  return { message: "Password changed. Sign in again." };
}
export async function setup(ctx: Context, current: string) {
  const user = await reauthenticate(ctx, current);
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  await db().$transaction(async (tx) => {
    // Serialize setup/enable on the user row.
    await tx.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });
    const existing = await tx.twoFactorCredential.findUnique({
      where: { userId: user.id },
    });
    if (existing?.enabled)
      throw new AppError(
        "CONFLICT",
        409,
        "Two-factor authentication is already enabled.",
      );
    await tx.twoFactorCredential.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        encryptedSecret: encrypt(secret),
        setupExpiresAt: new Date(Date.now() + 600000),
      },
      update: {
        encryptedSecret: encrypt(secret),
        lastStep: -1,
        setupExpiresAt: new Date(Date.now() + 600000),
      },
    });
  });
  const uri = totp(secret, user.email).toString();
  return { uri, qr: await QRCode.toDataURL(uri) };
}
async function replaceRecovery(tx: Prisma.TransactionClient, userId: string) {
  const codes = Array.from({ length: 10 }, () =>
    randomBytes(16).toString("hex"),
  );
  await tx.recoveryCode.deleteMany({ where: { userId } });
  await tx.recoveryCode.createMany({
    data: codes.map((code) => ({ userId, codeHash: digest(code) })),
  });
  return codes;
}
export async function enable(ctx: Context, code: string) {
  await rateLimit(`2fa:${ctx.userId}`, 10);
  const codes = await db().$transaction(async (tx) => {
    await tx.user.update({
      where: { id: ctx.userId },
      data: { updatedAt: new Date() },
    });
    const credential = await tx.twoFactorCredential.findUnique({
      where: { userId: ctx.userId },
    });
    if (
      !credential ||
      credential.enabled ||
      credential.setupExpiresAt <= new Date()
    )
      throw invalid();
    const step = totpStep(decrypt(credential.encryptedSecret), code);
    if (step === null) throw invalid();
    await tx.twoFactorCredential.update({
      where: { userId: ctx.userId },
      data: { enabled: true, lastStep: step },
    });
    await tx.session.deleteMany({
      where: { userId: ctx.userId, id: { not: ctx.sessionId } },
    });
    await audit(tx, ctx, "2FA_ENABLED", "user", ctx.userId);
    return replaceRecovery(tx, ctx.userId);
  });
  return { recoveryCodes: codes };
}
export async function manageFactor(
  ctx: Context,
  current: string,
  code: string,
  disable: boolean,
) {
  await reauthenticate(ctx, current);
  return db().$transaction(async (tx) => {
    await tx.user.update({
      where: { id: ctx.userId },
      data: { updatedAt: new Date() },
    });
    await consumeFactor(tx, ctx.userId, code);
    await tx.session.deleteMany({
      where: { userId: ctx.userId, id: { not: ctx.sessionId } },
    });
    if (disable) {
      await tx.twoFactorCredential.delete({ where: { userId: ctx.userId } });
      await tx.recoveryCode.deleteMany({ where: { userId: ctx.userId } });
      await audit(tx, ctx, "2FA_DISABLED", "user", ctx.userId);
      return { disabled: true };
    }
    const recoveryCodes = await replaceRecovery(tx, ctx.userId);
    await audit(tx, ctx, "RECOVERY_CODES_REGENERATED", "user", ctx.userId);
    return { recoveryCodes };
  });
}
