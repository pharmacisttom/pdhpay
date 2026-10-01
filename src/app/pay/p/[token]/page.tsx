import { PublicForm } from "@/modules/payment/components/public-form";
import { publicPoint, challenge } from "@/modules/payment/services/public";
import { AppError } from "@/core/errors";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "ส่งหลักฐานการชำระเงิน | PDH Smart Payment",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const point = await publicPoint(token).catch((error: unknown) => {
    if (error instanceof AppError) return error;
    throw error;
  });

  if (point instanceof AppError) {
    return (
      <main className="public-payment">
        <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <h1 style={{ color: "#d32f2f" }}>ไม่สามารถรับหลักฐานได้</h1>
          <p>{point.message}</p>
        </div>
      </main>
    );
  }

  const pointData = {
    name: point.name,
    code: point.code,
    location: point.location ?? undefined,
    bankAccount: {
      bankName: point.bankAccount.bankName,
      accountName: point.bankAccount.accountName,
      accountNumber: point.bankAccount.accountNumber,
      code: point.bankAccount.code,
    },
  };

  return (
    <PublicForm
      token={token}
      proof={challenge(token)}
      pointData={pointData}
    />
  );
}
