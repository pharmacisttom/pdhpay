import { z } from "zod";
export const password = z.string().min(12).max(128);
export const identity = z
  .object({
    organization: z.string().regex(/^[a-z0-9-]{1,80}$/),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
  })
  .strict();
export const loginSchema = identity.extend({
  password: z.string().min(1).max(128),
});
export const registerSchema = identity
  .extend({
    password,
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
  })
  .strict();
export const codeSchema = z
  .object({ code: z.string().min(6).max(64) })
  .strict();
export const currentPasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128) })
  .strict();
export const secondFactorSchema = currentPasswordSchema.extend({
  code: z.string().min(6).max(64),
});
