import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "@/core/database/client";
import { nextPaymentNumber } from "@/modules/payment/repositories/payment-number";
import { permissions } from "@/modules/permissions/catalog";
import { seedPayment } from "../prisma/seeds/payment";

const enabled = !!process.env.TEST_DATABASE_URL;
describe.skipIf(!enabled)("payment database constraints and seed", () => {
  const orgIds: string[] = [];
  let a: string,
    b: string,
    userA: string,
    userB: string,
    bankA: string,
    bankB: string,
    pointA: string,
    pointA2: string,
    pointB: string;
  const sequenceDate = new Date("2097-04-09T00:00:00Z");
  beforeAll(async () => {
    for (const name of ["A", "B"]) {
      const org = await db().organization.create({
        data: { name, slug: `payment-test-${randomUUID()}` },
      });
      orgIds.push(org.id);
    }
    [a, b] = orgIds;
    const users = await Promise.all(
      [a, b].map((organizationId) =>
        db().user.create({
          data: {
            organizationId,
            email: "fixture@example.test",
            displayName: "Synthetic fixture",
            passwordHash: "not-a-login-hash",
          },
        }),
      ),
    );
    [userA, userB] = users.map((u) => u.id);
    const banks = await Promise.all(
      [a, b].map((organizationId) =>
        db().bankAccount.create({
          data: {
            organizationId,
            code: "TEST",
            bankName: "Dummy",
            accountName: "Dummy",
            accountNumber: "000",
          },
        }),
      ),
    );
    [bankA, bankB] = banks.map((bank) => bank.id);
    const points = await Promise.all(
      [
        [a, userA, bankA, "A"],
        [a, userA, bankA, "A2"],
        [b, userB, bankB, "B"],
      ].map(([organizationId, createdBy, bankAccountId, code]) =>
        db().paymentPoint.create({
          data: {
            organizationId,
            createdBy,
            bankAccountId,
            code,
            name: code,
            qrToken: randomBytes(32).toString("hex"),
          },
        }),
      ),
    );
    [pointA, pointA2, pointB] = points.map((point) => point.id);
  });
  afterAll(async () => {
    const where = { organizationId: { in: orgIds } };
    await db().paymentStatusHistory.deleteMany({ where });
    await db().paymentSlip.deleteMany({ where });
    await db().paymentTransaction.deleteMany({ where });
    await db().paymentShift.deleteMany({ where });
    await db().paymentPointUser.deleteMany({ where });
    await db().paymentPoint.deleteMany({ where });
    await db().bankAccount.deleteMany({ where });
    await db().rolePermission.deleteMany({ where: { role: where } });
    await db().user.deleteMany({ where });
    await db().role.deleteMany({ where });
    await db().organization.deleteMany({ where: { id: { in: orgIds } } });
    await db().paymentNumberSequence.deleteMany({
      where: { date: sequenceDate },
    });
    await db().$disconnect();
  });
  const transactionData = () => ({
    organizationId: a,
    paymentPointId: pointA,
    paymentNo: `TEST-${randomUUID().slice(0, 20)}`,
    hn: "SYNTHETIC",
    patientName: "Synthetic patient",
    declaredAmount: "100.10",
    sourceBank: "Dummy",
    transferDateTime: new Date(),
  });

  it("rejects cross-tenant bank, staff and transaction point references", async () => {
    await expect(
      db().paymentPoint.create({
        data: {
          organizationId: a,
          bankAccountId: bankB,
          createdBy: userA,
          code: "BAD",
          name: "Bad",
          qrToken: randomBytes(32).toString("hex"),
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      db().paymentPointUser.create({
        data: { organizationId: a, paymentPointId: pointA, userId: userB },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      db().paymentTransaction.create({
        data: { ...transactionData(), paymentPointId: pointB },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("enforces positive declared amounts, exact decimals, and unique references", async () => {
    await expect(
      db().paymentTransaction.create({
        data: { ...transactionData(), declaredAmount: "0" },
      }),
    ).rejects.toThrow();
    await expect(
      db().paymentTransaction.create({
        data: { ...transactionData(), declaredAmount: "-0.01" },
      }),
    ).rejects.toThrow();
    const payment = await db().paymentTransaction.create({
      data: transactionData(),
    });
    expect(payment.declaredAmount.toFixed(2)).toBe("100.10");
    await expect(
      db().paymentTransaction.create({
        data: { ...transactionData(), paymentNo: payment.paymentNo },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("prevents duplicate open shifts and cross-point shift assignment", async () => {
    const data = {
      organizationId: a,
      paymentPointId: pointA,
      openedBy: userA,
      shiftDate: new Date(),
      shiftName: "Test",
      startTime: new Date(),
    };
    const shift = await db().paymentShift.create({ data });
    await expect(db().paymentShift.create({ data })).rejects.toMatchObject({
      code: "P2002",
    });
    await expect(
      db().paymentTransaction.create({
        data: {
          ...transactionData(),
          paymentPointId: pointA2,
          shiftId: shift.id,
        },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
    await expect(
      db().paymentShift.update({
        where: { id: shift.id },
        data: { status: "LOCKED" },
      }),
    ).rejects.toThrow();
    await db().paymentShift.update({
      where: { id: shift.id },
      data: { status: "LOCKED", openSlot: null },
    });
    await expect(db().paymentShift.create({ data })).resolves.toMatchObject({
      status: "OPEN",
    });
  });

  it("permits duplicate slip hashes but forbids a cross-tenant slip", async () => {
    const payment = await db().paymentTransaction.create({
      data: transactionData(),
    });
    const data = {
      organizationId: a,
      paymentTransactionId: payment.id,
      driveFolderId: "synthetic",
      storedFilename: "test.png",
      originalFilename: "test.png",
      mimeType: "image/png",
      fileSize: 100,
      sha256: "a".repeat(64),
    };
    await db().paymentSlip.create({
      data: { ...data, driveFileId: randomUUID() },
    });
    await db().paymentSlip.create({
      data: { ...data, driveFileId: randomUUID() },
    });
    expect(
      await db().paymentSlip.count({
        where: { organizationId: a, sha256: data.sha256 },
      }),
    ).toBe(2);
    await expect(
      db().paymentSlip.create({
        data: { ...data, organizationId: b, driveFileId: randomUUID() },
      }),
    ).rejects.toMatchObject({ code: "P2003" });
  });

  it("supports optimistic writes and rolls back status with its history", async () => {
    const payment = await db().paymentTransaction.create({
      data: transactionData(),
    });
    await expect(
      db().$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: { status: "PENDING_VERIFY", version: 1 },
        });
        await tx.paymentStatusHistory.create({
          data: {
            organizationId: a,
            paymentTransactionId: payment.id,
            toStatus: "PENDING_VERIFY",
            version: 1,
            changedBy: userB,
          },
        });
      }),
    ).rejects.toMatchObject({ code: "P2003" });
    expect(
      (
        await db().paymentTransaction.findUniqueOrThrow({
          where: { id: payment.id },
        })
      ).version,
    ).toBe(0);
    const counts = await Promise.all(
      [1, 2].map(() =>
        db().paymentTransaction.updateMany({
          where: { id: payment.id, organizationId: a, version: 0 },
          data: { version: { increment: 1 } },
        }),
      ),
    );
    expect(counts.map((r) => r.count).sort()).toEqual([0, 1]);
  });

  it("allocates concurrent numbers using the Bangkok calendar day", async () => {
    // UTC April 8 at 17:00 is Bangkok April 9.
    const now = new Date("2097-04-08T17:00:00Z");
    const numbers = await Promise.all(
      Array.from({ length: 8 }, () =>
        db().$transaction((tx) => nextPaymentNumber(tx, now)),
      ),
    );
    expect(new Set(numbers).size).toBe(8);
    expect(numbers.every((n) => /^PAY-20970409-\d{6}$/.test(n))).toBe(true);
    const before = await db().paymentNumberSequence.findUniqueOrThrow({
      where: { date: sequenceDate },
    });
    await expect(
      db().$transaction(async (tx) => {
        await nextPaymentNumber(tx, now);
        throw new Error("rollback");
      }),
    ).rejects.toThrow("rollback");
    expect(
      (
        await db().paymentNumberSequence.findUniqueOrThrow({
          where: { date: sequenceDate },
        })
      ).value,
    ).toBe(before.value);
  });

  it("seeds idempotently without rotating QR tokens or overwriting edits", async () => {
    for (const name of permissions)
      await db().permission.upsert({
        where: { name },
        create: { name },
        update: {},
      });
    await db().$transaction((tx) => seedPayment(tx, a, userA), {
      timeout: 30000,
    });
    const old = await db().paymentPoint.findUniqueOrThrow({
      where: { organizationId_code: { organizationId: a, code: "OPD" } },
    });
    await db().paymentPoint.update({
      where: { id: old.id },
      data: { name: "Operator edit" },
    });
    await db().$transaction((tx) => seedPayment(tx, a, userA), {
      timeout: 30000,
    });
    const current = await db().paymentPoint.findUniqueOrThrow({
      where: { id: old.id },
    });
    expect(current.qrToken).toBe(old.qrToken);
    expect(current.name).toBe("Operator edit");
    expect(
      await db().paymentPoint.count({
        where: {
          organizationId: a,
          code: { in: ["OPD", "ER", "IPD", "PHARMACY", "DENTAL"] },
        },
      }),
    ).toBe(5);
    const executive = await db().role.findUniqueOrThrow({
      where: {
        organizationId_name: { organizationId: a, name: "EXECUTIVE_VIEWER" },
      },
      include: { permissions: { include: { permission: true } } },
    });
    expect(
      executive.permissions.every((p) => p.permission.name.endsWith(".read")),
    ).toBe(true);
  });
});
