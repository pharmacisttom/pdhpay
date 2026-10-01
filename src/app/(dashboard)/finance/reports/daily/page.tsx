import type { Metadata } from "next";
import { pageContext } from "@/core/auth/page";
import { requirePermission } from "@/core/auth/authorization";
import { DailyReportClient } from "@/modules/payment/components/daily-report-client";

export const metadata: Metadata = {
  title: "รายงานสรุปการรับชำระเงินรายวัน",
};

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const ctx = await pageContext();
  requirePermission(ctx, "payment.report.read");

  const resolved = await searchParams;
  const initialDate =
    resolved.date || new Date().toISOString().slice(0, 10);

  return (
    <section lang="th">
      <DailyReportClient initialDate={initialDate} />
    </section>
  );
}
