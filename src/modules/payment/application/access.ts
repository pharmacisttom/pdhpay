import {
  requireContext,
  requirePermission,
  tenantWhere,
  type Context,
} from "@/core/auth/authorization";
import type { PaymentPermission } from "../domain/permissions";

/** Only pass contexts resolved by Tomvis on the server, never request bodies. */
export function paymentScope(
  identity: Context | null,
  permission: PaymentPermission,
) {
  const ctx = requireContext(identity);
  requirePermission(ctx, permission);
  return tenantWhere(ctx);
}
