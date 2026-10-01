import { publicPaymentStatus } from "@/modules/payment/services/public";
import { AppError } from "@/core/errors";
import { PublicStatusView } from "@/modules/payment/components/public-status";

export const metadata = {
  title: "ติดตามสถานะการชำระเงิน | PDH Smart Payment",
  robots: { index: false, follow: false },
};

export default async function StatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const payment = await publicPaymentStatus((await params).token).catch(
    (error: unknown) =>
      error instanceof AppError ? null : Promise.reject(error)
  );

  const formattedPayment = payment
    ? {
        paymentNo: payment.paymentNo,
        status: payment.status,
        submittedAt: payment.submittedAt.toISOString(),
        receiptNo: payment.receiptNo,
        declaredAmount: payment.declaredAmount ? payment.declaredAmount.toFixed(2) : undefined,
        verifiedAmount: payment.verifiedAmount ? payment.verifiedAmount.toFixed(2) : null,
        point: {
          name: payment.point.name,
          qrToken: payment.point.qrToken,
        },
        statusHistory: payment.statusHistory?.map((h) => ({
          toStatus: h.toStatus,
          reason: h.reason,
          createdAt: h.createdAt.toISOString(),
        })),
      }
    : null;

  return <PublicStatusView payment={formattedPayment} />;
}
