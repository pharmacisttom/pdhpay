import { z } from "zod";
const schema = z.object({
  DATABASE_URL: z.string().startsWith("mysql://"),
  AUTH_SECRET: z.string().min(32),
  TOTP_ENCRYPTION_KEY: z
    .string()
    .refine(
      (v) => Buffer.from(v, "base64").length === 32,
      "Expected 32 base64-encoded bytes",
    ),
  APP_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});
export function env() {
  const value = schema.parse(process.env);
  if (value.NODE_ENV === "production" && !value.APP_URL.startsWith("https://"))
    throw new Error("Production requires HTTPS");
  return value;
}
