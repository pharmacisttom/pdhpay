import { AppError, denied } from "@/core/errors";
export type Context = {
  userId: string;
  organizationId: string;
  sessionId: string;
  permissions: string[];
};
export const hasPermission = (context: Context, permission: string) =>
  context.permissions.includes(permission);
export function requirePermission(context: Context, permission: string) {
  if (!hasPermission(context, permission)) denied();
}
export function tenantWhere(context: Context, id?: string) {
  return { organizationId: context.organizationId, ...(id ? { id } : {}) };
}
export function requireContext(context: Context | null): Context {
  if (!context) throw new AppError("UNAUTHENTICATED", 401, "Please sign in.");
  return context;
}
