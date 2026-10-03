import { pageContext } from "@/core/auth/page";
import { requirePermission } from "@/core/auth/authorization";
import { ReceiptMeter } from "@/modules/payment/components/receipt-meter";

export default async function Page() {
  requirePermission(await pageContext(), "payment.report.read");
  return <ReceiptMeter />;
}
