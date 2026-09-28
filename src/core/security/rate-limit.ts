import { db } from "@/core/database/client";
import { digest } from "./crypto";
import { AppError } from "@/core/errors";
export async function rateLimit(key: string, limit: number, seconds = 900) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const row = await db().rateLimit.upsert({
    where: { key: digest(`${key}:${bucket}`) },
    create: {
      key: digest(`${key}:${bucket}`),
      expiresAt: new Date((bucket + 1) * seconds * 1000),
    },
    update: { count: { increment: 1 } },
  });
  if (row.count > limit)
    throw new AppError(
      "RATE_LIMITED",
      429,
      "Too many attempts. Please try again later.",
    );
}
