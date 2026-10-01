import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { db } from "@/core/database/client";
import { env } from "@/core/config/env";
import { AppError } from "@/core/errors";
import { rateLimit } from "@/core/security/rate-limit";
import { audit } from "@/modules/audit/service";
import { submissionInput } from "../validators";
import { validateSlip, MAX_SLIP_BYTES } from "../validators/file";
import { nextPaymentNumber } from "../repositories/payment-number";
import type { SlipStorage } from "../infrastructure/storage";
import { digest } from "@/core/security/crypto";
const statusToken = (submissionKey: string) =>
  createHmac("sha256", env().AUTH_SECRET)
    .update("payment-status:" + submissionKey)
    .digest("base64url");
export function challenge(token: string, now = Date.now()) {
  const stamp = String(now);
  return (
    stamp +
    "." +
    createHmac("sha256", env().AUTH_SECRET)
      .update(token + ":" + stamp)
      .digest("hex")
  );
}
export function checkChallenge(token: string, value: string, now = Date.now()) {
  const [stamp, signature] = value.split(".");
  if (!/^\d{13}$/.test(stamp ?? "") || !/^[a-f0-9]{64}$/.test(signature ?? ""))
    throw new AppError("INVALID_INPUT", 400, "กรุณาเปิดแบบฟอร์มใหม่");
  const age = now - Number(stamp);
  if (
    age < 2000 ||
    age > 900000 ||
    !timingSafeEqual(
      Buffer.from(challenge(token, Number(stamp)).split(".")[1], "hex"),
      Buffer.from(signature, "hex"),
    )
  )
    throw new AppError("INVALID_INPUT", 400, "กรุณาเปิดแบบฟอร์มใหม่");
}
export async function publicPoint(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new AppError("NOT_FOUND", 404, "ไม่พบจุดชำระเงิน");
  const point = await db().paymentPoint.findUnique({
    where: { qrToken: token },
    include: { bankAccount: true, organization: true },
  });
  if (
    !point ||
    point.status !== "ACTIVE" ||
    !point.bankAccount.active ||
    !point.organization.active
  )
    throw new AppError("NOT_FOUND", 404, "จุดชำระเงินปิดใช้งาน");
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  if (point.openTime && point.closeTime && point.openTime !== point.closeTime) {
    const open =
      point.openTime < point.closeTime
        ? clock >= point.openTime && clock < point.closeTime
        : clock >= point.openTime || clock < point.closeTime;
    if (!open)
      throw new AppError("CONFLICT", 409, "นอกเวลาทำการของจุดชำระเงิน");
  }
  return point;
}
export async function boundedForm(request: Request) {
  if (!request.body) throw new AppError("INVALID_INPUT", 400, "ไม่มีไฟล์");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > MAX_SLIP_BYTES + 65536) {
      await reader.cancel();
      throw new AppError("INVALID_INPUT", 413, "ไฟล์ใหญ่เกินกำหนด");
    }
    chunks.push(part.value);
  }
  try {
    return await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    throw new AppError("INVALID_INPUT", 400, "แบบฟอร์มไม่ถูกต้อง");
  }
}
export async function submitPayment(
  request: Request,
  storage: SlipStorage,
  requestId: string,
) {
  await rateLimit("payment:public:aggregate", 120, 60);
  const form = await boundedForm(request);
  for (const key of new Set(form.keys()))
    if (form.getAll(key).length !== 1)
      throw new AppError("INVALID_INPUT", 400, "ข้อมูลซ้ำ");
  const raw = Object.fromEntries(form);
  const { file, challenge: proof, ...fields } = raw;
  const input = submissionInput.parse(fields);
  checkChallenge(input.token, String(proof ?? ""));
  if (!(file instanceof File))
    throw new AppError("INVALID_FILE", 400, "กรุณาแนบสลิป");
  await rateLimit("payment:public:point:" + input.token, 30, 60);
  const point = await publicPoint(input.token);
  const validated = await validateSlip(file);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(input) + validated.sha256)
    .digest("hex");
  const existing = await db().paymentUpload.findUnique({
    where: { id: input.submissionKey },
  });
  if (existing) {
    if (existing.fingerprint !== fingerprint)
      throw new AppError("CONFLICT", 409, "รหัสการส่งซ้ำไม่ตรงกัน");
    if (existing.state === "COMMITTED")
      return {
        paymentNo: existing.paymentNo,
        statusToken: statusToken(input.submissionKey),
      };
    throw new AppError(
      "CONFLICT",
      409,
      "รายการนี้กำลังดำเนินการหรือไม่สำเร็จ กรุณาติดต่อเจ้าหน้าที่ก่อนส่งใหม่",
    );
  }
  const intent = await db().$transaction(async (tx) => {
    const paymentNo = await nextPaymentNumber(tx);
    return tx.paymentUpload.create({
      data: {
        id: input.submissionKey,
        organizationId: point.organizationId,
        paymentPointId: point.id,
        fingerprint,
        paymentNo,
      },
    });
  });
  try {
    const driveId = await storage.allocateId();
    await db().paymentUpload.update({
      where: { id: intent.id },
      data: { driveFileId: driveId, state: "UPLOADING" },
    });
    // Drive filenames must not expose HN, patient data or payment amounts.
    const filename = `${intent.paymentNo}_${intent.id}.${validated.ext}`;
    const stored = await storage.upload({
      id: driveId,
      name: filename,
      bytes: validated.bytes,
      mime: validated.mime,
      pointCode: point.code,
      date: intent.createdAt,
      uploadId: intent.id,
    });
    return await db().$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM PaymentPoint WHERE id=${point.id} AND organizationId=${point.organizationId} FOR UPDATE`;
        const current = await tx.paymentPoint.findUniqueOrThrow({
          where: { id: point.id },
          include: { bankAccount: true },
        });
        if (
          current.qrToken !== input.token ||
          current.status !== "ACTIVE" ||
          !current.bankAccount.active
        )
          throw new AppError(
            "CONFLICT",
            409,
            "จุดชำระเงินเปลี่ยนสถานะ กรุณาติดต่อเจ้าหน้าที่",
          );
        await tx.$queryRaw`SELECT id FROM Organization WHERE id=${point.organizationId} FOR UPDATE`;
        const shift = await tx.paymentShift.findFirst({
          where: {
            organizationId: point.organizationId,
            paymentPointId: point.id,
            status: "OPEN",
          },
        });
        if (!shift)
          throw new AppError(
            "CONFLICT",
            409,
            "ยังไม่เปิดกะรับชำระ กรุณาติดต่อเจ้าหน้าที่",
          );
        const duplicate = await tx.paymentSlip.findFirst({
          where: {
            organizationId: point.organizationId,
            sha256: validated.sha256,
          },
        });
        const status = duplicate ? "POSSIBLE_DUPLICATE" : "PENDING_VERIFY";
        const publicStatusToken = statusToken(input.submissionKey);
        const payment = await tx.paymentTransaction.create({
          data: {
            organizationId: point.organizationId,
            paymentPointId: point.id,
            shiftId: shift.id,
            paymentNo: intent.paymentNo,
            submissionKey: intent.id,
            statusTokenHash: digest(publicStatusToken),
            deviceFingerprintHash: digest("payment-device:" + input.deviceId),
            hn: input.hn,
            vn: input.vn || null,
            an: input.an || null,
            patientName: input.patientName,
            payerName: input.payerName || null,
            payerPhone: input.payerPhone || null,
            declaredAmount: input.declaredAmount,
            sourceBank: input.sourceBank,
            transferDateTime: new Date(input.transferDateTime),
            note: input.note || null,
            status,
            reconciliationStatus: duplicate ? "DUPLICATE" : "NOT_FOUND",
          },
        });
        const slip = await tx.paymentSlip.create({
          data: {
            organizationId: point.organizationId,
            paymentTransactionId: payment.id,
            ...stored,
            storedFilename: filename,
            // Source filenames can contain patient names or device metadata.
            originalFilename: `upload.${validated.ext}`,
            mimeType: validated.mime,
            fileSize: validated.bytes.length,
            sha256: validated.sha256,
          },
        });
        await tx.paymentSlipExtraction.create({
          data: {
            organizationId: point.organizationId,
            paymentSlipId: slip.id,
          },
        });
        await tx.paymentStatusHistory.create({
          data: {
            organizationId: point.organizationId,
            paymentTransactionId: payment.id,
            toStatus: status,
            version: 0,
          },
        });
        // Anonymous submitter has no Core user; tenant is derived exclusively from QR.
        await audit(
          tx,
          { organizationId: point.organizationId, userId: null },
          "PAYMENT_SUBMITTED",
          "payment",
          payment.id,
          "SUCCESS",
          {
            requestId,
            newStatus: status,
            newAmount: input.declaredAmount,
            userAgent: request.headers.get("user-agent") ?? undefined,
          },
        );
        await tx.paymentUpload.update({
          where: { id: intent.id },
          data: { state: "COMMITTED" },
        });
        return { paymentNo: payment.paymentNo, statusToken: publicStatusToken };
      },
      { timeout: 15000 },
    );
  } catch (error) {
    await db()
      .paymentUpload.updateMany({
        where: { id: intent.id, state: { not: "COMMITTED" } },
        data: { state: "FAILED" },
      })
      .catch(() => {});
    throw error;
  }
}
export async function publicPaymentStatus(rawToken: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(rawToken))
    throw new AppError("NOT_FOUND", 404, "ไม่พบรายการ");
  await rateLimit("payment:status:" + rawToken, 30, 60);
  const payment = await db().paymentTransaction.findUnique({
    where: { statusTokenHash: digest(rawToken) },
    select: {
      paymentNo: true,
      status: true,
      submittedAt: true,
      verifiedAt: true,
      receiptedAt: true,
      receiptNo: true,
      declaredAmount: true,
      verifiedAmount: true,
      point: { select: { name: true, qrToken: true } },
      statusHistory: {
        take: 5,
        orderBy: { version: "desc" },
        select: { toStatus: true, reason: true, createdAt: true },
      },
    },
  });
  if (!payment) throw new AppError("NOT_FOUND", 404, "ไม่พบรายการ");
  return payment;
}

