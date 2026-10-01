import { pageContext } from "@/core/auth/page";
import { driveStatus } from "@/modules/payment/services/drive-admin";
import { GoogleDriveStatus } from "@/components/payment/google-drive-status";

export default async function GoogleDrivePage() {
  const status = await driveStatus(await pageContext());
  return <GoogleDriveStatus {...status} />;
}
