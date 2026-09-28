import {
  randomBytes,
  createHmac,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import argon2 from "argon2";
import * as OTPAuth from "otpauth";
import { env } from "@/core/config/env";
export const token = () => randomBytes(32).toString("base64url");
export const digest = (value: string) =>
  createHmac("sha256", env().AUTH_SECRET).update(value).digest("hex");
export const hashPassword = (value: string) =>
  argon2.hash(value, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
export const verifyPassword = (hash: string, value: string) =>
  argon2.verify(hash, value);
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    Buffer.from(env().TOTP_ENCRYPTION_KEY, "base64"),
    iv,
  );
  return Buffer.concat([
    iv,
    cipher.update(value, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
}
export function decrypt(value: string) {
  const bytes = Buffer.from(value, "base64");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(env().TOTP_ENCRYPTION_KEY, "base64"),
    bytes.subarray(0, 12),
  );
  cipher.setAuthTag(bytes.subarray(-16));
  return Buffer.concat([
    cipher.update(bytes.subarray(12, -16)),
    cipher.final(),
  ]).toString("utf8");
}
export function totp(secret: string, label = "TOMVIS") {
  return new OTPAuth.TOTP({
    issuer: "TOMVIS Core",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}
export function totpStep(secret: string, code: string, now = Date.now()) {
  const delta = totp(secret).validate({
    token: code,
    window: 1,
    timestamp: now,
  });
  return delta === null ? null : Math.floor(now / 30000) + delta;
}
