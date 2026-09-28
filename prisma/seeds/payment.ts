import { randomBytes } from "node:crypto";
import type { Prisma } from "../../src/generated/prisma/client";
import {
  paymentPermissions,
  type PaymentPermission,
} from "../../src/modules/payment/domain/permissions";

export function assertDevelopmentSeed(mode: string | undefined) {
  if (mode !== "development" && mode !== "test") {
    throw new Error(
      "Seed requires an explicit development or test environment.",
    );
  }
}

export const financeRoles: Record<string, readonly PaymentPermission[]> = {
  FINANCE_ADMIN: paymentPermissions,
  FINANCE_OFFICER: [
    "payment.dashboard.read",
    "payment.transaction.read",
    "payment.receipt.create",
    "payment.point.read",
    "payment.shift.open",
    "payment.shift.close",
  ],
  FINANCE_VERIFIER: [
    "payment.dashboard.read",
    "payment.transaction.read",
    "payment.transaction.verify",
    "payment.transaction.reject",
    "payment.transaction.correct",
    "payment.point.read",
    "payment.reconciliation.read",
    "payment.reconciliation.manage",
  ],
  FINANCE_AUDITOR: [
    "payment.dashboard.read",
    "payment.transaction.read",
    "payment.report.read",
    "payment.report.export",
    "payment.audit.read",
    "payment.reconciliation.read",
    "payment.point.read",
  ],
  EXECUTIVE_VIEWER: ["payment.dashboard.read", "payment.report.read"],
};

const points = [
  ["OPD", "การเงินผู้ป่วยนอก"],
  ["ER", "การเงินอุบัติเหตุและฉุกเฉิน"],
  ["IPD", "การเงินผู้ป่วยใน"],
  ["PHARMACY", "การเงินห้องยา"],
  ["DENTAL", "การเงินทันตกรรม"],
] as const;

/** Called inside the existing Tomvis seed transaction, with its existing admin. */
export async function seedPayment(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
) {
  assertDevelopmentSeed(process.env.NODE_ENV);
  const catalog = await tx.permission.findMany({
    where: { name: { in: [...paymentPermissions] } },
  });
  if (catalog.length !== paymentPermissions.length)
    throw new Error("Core permission catalog is incomplete.");
  for (const [name, allowed] of Object.entries(financeRoles)) {
    const role = await tx.role.upsert({
      where: { organizationId_name: { organizationId, name } },
      create: { organizationId, name },
      update: {},
    });
    // Add missing seed grants only; never erase operator-managed assignments.
    for (const permission of catalog.filter((p) =>
      allowed.includes(p.name as PaymentPermission),
    )) {
      await tx.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }
  const bank = await tx.bankAccount.upsert({
    where: { organizationId_code: { organizationId, code: "DEV-DUMMY" } },
    create: {
      organizationId,
      code: "DEV-DUMMY",
      bankName: "ธนาคารจำลองสำหรับทดสอบ",
      accountName: "PDH DEVELOPMENT ONLY",
      accountNumber: "0000000000",
      active: false,
    },
    update: {},
  });
  for (const [code, name] of points) {
    const point = await tx.paymentPoint.upsert({
      where: { organizationId_code: { organizationId, code } },
      create: {
        organizationId,
        code,
        name,
        department: code,
        bankAccountId: bank.id,
        createdBy: userId,
        qrToken: randomBytes(32).toString("hex"),
        status: "INACTIVE",
        description: "จุดทดสอบ ยังไม่เปิดรับชำระเงินจริง",
      },
      update: {},
    });
    await tx.paymentPointUser.upsert({
      where: {
        organizationId_paymentPointId_userId: {
          organizationId,
          paymentPointId: point.id,
          userId,
        },
      },
      create: { organizationId, paymentPointId: point.id, userId },
      update: {},
    });
  }
}
