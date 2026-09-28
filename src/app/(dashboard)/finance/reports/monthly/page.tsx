import { pageContext } from "@/core/auth/page";
import { reportRows } from "@/modules/payment/services/reports";
import { today } from "@/modules/payment/queries/transactions";
import { ReportView } from "@/modules/payment/components/report-view";

export default async function MonthlyReport({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const month = (await searchParams).month ?? today().slice(0, 7);
  const start = `${month}-01`;
  const end = new Date(`${month}-01T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  const to = end.toISOString().slice(0, 10);
  const rows = await reportRows(await pageContext(), {
    from: start,
    to,
    limit: 5000,
  });
  return (
    <ReportView title="รายงานประจำเดือน" from={start} to={to} rows={rows} />
  );
}
