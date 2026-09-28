import { pageContext } from "@/core/auth/page";
import { reportRows } from "@/modules/payment/services/reports";
import { today } from "@/modules/payment/queries/transactions";
import { ReportView } from "@/modules/payment/components/report-view";

export default async function DailyReport({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const date = (await searchParams).date ?? today();
  const rows = await reportRows(await pageContext(), {
    from: date,
    to: date,
    limit: 1000,
  });
  return (
    <ReportView title="รายงานประจำวัน" from={date} to={date} rows={rows} />
  );
}
