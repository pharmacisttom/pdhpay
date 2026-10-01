import type { Metadata } from "next";
import { pageContext } from "@/core/auth/page";
import { requirePermission } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { pointScope } from "@/modules/payment/services/points";
import { env } from "@/core/config/env";
import { QrPosterClient } from "@/modules/payment/components/qr-poster-client";

export const metadata: Metadata = {
  title: "พิมพ์โปสเตอร์ QR Code ประจำจุดรับชำระ",
};

export default async function QrPosterPage() {
  const ctx = await pageContext();
  requirePermission(ctx, "payment.point.read");

  const points = await db().paymentPoint.findMany({
    where: pointScope(ctx),
    select: {
      id: true,
      code: true,
      name: true,
      department: true,
      location: true,
      status: true,
      qrToken: true,
      bankAccount: {
        select: {
          bankName: true,
          accountNumber: true,
          active: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { code: "asc" }],
    take: 200,
  });

  return (
    <section lang="th">
      <QrPosterClient initialPoints={points} appUrl={env().APP_URL} />
    </section>
  );
}
