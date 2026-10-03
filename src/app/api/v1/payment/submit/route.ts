import { handle } from "@/core/api/handler";
import { submitPayment } from "@/modules/payment/services/public";
import { GoogleDriveStorageService } from "@/modules/payment/infrastructure/google-drive";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handle(
    request,
    (requestId) => submitPayment(request, new GoogleDriveStorageService(), requestId),
    { multipart: true }
  );
}
