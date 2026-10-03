import { z } from "zod";
export const money = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/)
  .refine((v) => Number(v) > 0, "จำนวนเงินต้องมากกว่า 0");
export const id = z.uuid();
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .nullable();
export const pointInput = z
  .object({
    code: z.string().regex(/^[A-Z0-9_-]{1,40}$/),
    name: z.string().trim().min(1).max(160),
    description: z.string().max(500).nullable().optional(),
    department: z.string().max(120).nullable().optional(),
    location: z.string().max(160).nullable().optional(),
    bankAccountId: id,
    openTime: time.optional(),
    closeTime: time.optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "TEMPORARILY_CLOSED", "MAINTENANCE"]),
  })
  .strict();
export const bankInput = z
  .object({
    code: z.string().regex(/^[A-Z0-9_-]{1,40}$/),
    bankName: z.string().min(1).max(120),
    accountName: z.string().min(1).max(160),
    accountNumber: z.string().regex(/^[0-9-]{5,40}$/),
    branch: z.string().max(120).optional(),
    active: z.boolean(),
  })
  .strict();
export const pointUpdate = pointInput.extend({
  expectedUpdatedAt: z.iso.datetime(),
});
export const staffInput = z
  .object({
    userIds: z.array(id).max(100),
    expectedUpdatedAt: z.iso.datetime(),
  })
  .strict();
export const versionInput = z
  .object({ version: z.number().int().nonnegative() })
  .strict();
export const submissionInput = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/),
    submissionKey: z.uuid(),
    deviceId: z.uuid(),
    certified: z.union([z.literal("true"), z.literal("false"), z.boolean()]).optional(),
    hn: z
      .string()
      .trim()
      .max(40)
      .optional(),
    vn: z.string().max(40).optional(),
    an: z.string().max(40).optional(),
    patientName: z.string().trim().max(160).optional(),
    payerName: z.string().max(160).optional(),
    payerPhone: z
      .string()
      .regex(/^[0-9+ -]{0,30}$/)
      .optional(),
    declaredAmount: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/)
      .optional(),
    sourceBank: z.string().trim().max(120).optional(),
    transferDateTime: z.string().optional(),
    note: z.string().max(2000).optional(),
    website: z.literal("").optional(),
  })
  .strict();
export const reviewInput = z
  .object({
    version: z.number().int().nonnegative(),
    amount: money.optional(),
    hn: z.string().trim().max(40).optional(),
    patientName: z.string().trim().max(160).optional(),
    vn: z.string().max(40).nullable().optional(),
    an: z.string().max(40).nullable().optional(),
    sourceBank: z.string().trim().max(120).optional(),
    transferDateTime: z.string().optional(),
    receiptNo: z.string().trim().min(1).max(80).optional(),
    reason: z.string().trim().min(1).max(1000).optional(),
    status: z
      .enum([
        "INVALID_SLIP",
        "POSSIBLE_DUPLICATE",
        "AMOUNT_MISMATCH",
        "CANCELLED",
      ])
      .optional(),
    reconciliationStatus: z
      .enum(["MATCHED", "PARTIAL_MATCH", "MISMATCH", "NOT_FOUND", "DUPLICATE"])
      .optional(),
  })
  .strict();
export const shiftInput = z
  .object({ paymentPointId: id, shiftName: z.string().trim().min(1).max(120) })
  .strict();
