/** Product permissions registered in the existing Tomvis catalog. */
export const paymentPermissions = [
  "payment.dashboard.read",
  "payment.transaction.read",
  "payment.transaction.verify",
  "payment.transaction.reject",
  "payment.transaction.correct",
  "payment.receipt.create",
  "payment.report.read",
  "payment.report.export",
  "payment.point.read",
  "payment.point.create",
  "payment.point.update",
  "payment.point.disable",
  "payment.point.assign_staff",
  "payment.shift.open",
  "payment.shift.close",
  "payment.shift.reopen",
  "payment.reconciliation.read",
  "payment.reconciliation.manage",
  "payment.audit.read",
  "payment.admin.manage",
] as const;

export type PaymentPermission = (typeof paymentPermissions)[number];
