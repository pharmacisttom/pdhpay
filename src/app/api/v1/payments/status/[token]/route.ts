import { handle } from "@/core/api/handler";
import { publicPaymentStatus } from "@/modules/payment/services/public";

export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return handle(request, async () => publicPaymentStatus((await params).token));
}
