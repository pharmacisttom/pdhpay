import { PublicForm } from "@/modules/payment/components/public-form";
import { publicPoint, challenge } from "@/modules/payment/services/public";
import { AppError } from "@/core/errors";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "ส่งหลักฐานการชำระเงิน",
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
  if (point instanceof AppError)
    return (
      <main className="public-payment">
        <h1>ไม่สามารถรับหลักฐานได้</h1>
        <p>{point.message}</p>
      </main>
    );
  return (
    <PublicForm token={token} proof={challenge(token)} pointName={point.name} />
  );
}
