import { cookies } from "next/headers";
import { db } from "@/core/database/client";
import { digest, token } from "@/core/security/crypto";
import { AppError } from "@/core/errors";
import type { Context } from "./authorization";
export const cookieName = () =>
  process.env.NODE_ENV === "production"
    ? "__Host-tomvis-session"
    : "tomvis-session";
export async function setSessionCookie(value: string, seconds: number) {
  (await cookies()).set(cookieName(), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: seconds,
  });
}
export async function createSession(userId: string, pendingTwoFactor: boolean) {
  const raw = token();
  const duration = pendingTwoFactor ? 300 : 28800;
  await db().session.create({
    data: {
      tokenHash: digest(raw),
      userId,
      pendingTwoFactor,
      expiresAt: new Date(Date.now() + duration * 1000),
      idleExpiresAt: new Date(Date.now() + Math.min(duration, 1800) * 1000),
    },
  });
  await setSessionCookie(raw, duration);
}
export async function session(pending = false) {
  const raw = (await cookies()).get(cookieName())?.value;
  if (!raw) throw new AppError("UNAUTHENTICATED", 401, "Please sign in.");
  const row = await db().session.findUnique({
    where: { tokenHash: digest(raw) },
    include: {
      user: {
        include: {
          organization: true,
          roles: {
            include: {
              role: {
                include: { permissions: { include: { permission: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (
    !row ||
    row.expiresAt <= new Date() ||
    row.idleExpiresAt <= new Date() ||
    row.pendingTwoFactor !== pending ||
    row.user.status !== "ACTIVE" ||
    !row.user.organization.active
  )
    throw new AppError("UNAUTHENTICATED", 401, "Please sign in.");
  if (!pending) {
    const refreshed = await db().session.updateMany({
      where: { id: row.id },
      data: {
        idleExpiresAt: new Date(
          Math.min(row.expiresAt.getTime(), Date.now() + 1800000),
        ),
      },
    });
    if (refreshed.count !== 1)
      throw new AppError("UNAUTHENTICATED", 401, "Please sign in.");
  }
  return row;
}
export async function context(): Promise<Context> {
  const row = await session();
  return {
    userId: row.userId,
    organizationId: row.user.organizationId,
    sessionId: row.id,
    permissions: [
      ...new Set(
        row.user.roles.flatMap((r) =>
          r.role.permissions.map((p) => p.permission.name),
        ),
      ),
    ],
  };
}
