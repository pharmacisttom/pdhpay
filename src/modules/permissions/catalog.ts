import { paymentPermissions } from "@/modules/payment/domain/permissions";

export const permissions = [
  ...paymentPermissions,
  "users.view",
  "users.create",
  "users.update",
  "users.delete",
  "roles.view",
  "roles.create",
  "roles.update",
  "roles.delete",
  "organizations.view",
  "organizations.update",
  "settings.view",
  "settings.update",
  "audit.view",
] as const;
export type PermissionName = (typeof permissions)[number];
