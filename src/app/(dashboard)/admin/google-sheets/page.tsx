import { pageContext } from "@/core/auth/page";
import { googleSheetsStatus } from "@/modules/payment/infrastructure/google-sheets";
import { GoogleSheetsSync } from "@/components/payment/google-sheets-sync";

export default async function GoogleSheetsPage() {
  const ctx = await pageContext();
  const status = await googleSheetsStatus(ctx);
  return <GoogleSheetsSync {...status} />;
}
