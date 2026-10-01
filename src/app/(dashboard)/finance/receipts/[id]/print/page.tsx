import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { pageContext } from "@/core/auth/page";
import { requirePermission } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { pointScope } from "@/modules/payment/services/points";
import { PrintButton } from "@/modules/payment/components/print";
import { getTranslation, formatDate } from "@/modules/payment/i18n/translations";

export const metadata: Metadata = { title: "พิมพ์ใบเสร็จรับเงิน" };

export default async function ReceiptPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await pageContext();
  requirePermission(ctx, "payment.point.read");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const transaction = await db().paymentTransaction.findFirst({
    where: {
      id,
      organizationId: ctx.organizationId,
      status: "RECEIPTED",
      point: pointScope(ctx),
    },
    include: {
      point: { select: { name: true, code: true } },
      receipter: { select: { displayName: true } },
    },
  });

  if (!transaction) notFound();

  const t = getTranslation("th");
  const amountStr = transaction.verifiedAmount
    ? transaction.verifiedAmount.toFixed(2)
    : transaction.declaredAmount.toFixed(2);

  return (
    <section lang="th" className="receipt-page p-4 flex justify-center">
      <div className="w-full max-w-[480px]">
        <div className="no-print mb-4 flex justify-end">
          <PrintButton />
        </div>

        <article className="receipt-sheet bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-md text-sm space-y-4">
          <div className="text-center space-y-1">
            <Image
              src="/brand/pdh-finance-logo.png"
              width={80}
              height={80}
              alt="โรงพยาบาลปลวกแดง"
              className="mx-auto"
              priority
            />
            <h1 className="text-lg font-bold text-teal-800">{t.receipt.title}</h1>
            <p className="text-xs font-semibold text-slate-600">{t.hospitalName}</p>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-3 my-2 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">{t.receipt.receiptNoLabel}:</span>
              <span className="font-mono font-bold text-slate-800">
                {transaction.receiptNo || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">เลขอ้างอิงรายการ:</span>
              <span className="font-mono text-slate-700">{transaction.paymentNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t.receipt.dateLabel}:</span>
              <span className="text-slate-700">
                {transaction.receiptedAt
                  ? formatDate(transaction.receiptedAt, "th")
                  : formatDate(transaction.submittedAt, "th")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">จุดรับชำระเงิน:</span>
              <span className="text-slate-700 font-medium">{transaction.point.name}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">HN:</span>
              <span className="font-mono font-semibold text-slate-800">
                {transaction.hn}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ชื่อผู้ป่วย:</span>
              <span className="font-semibold text-slate-800">{transaction.patientName}</span>
            </div>
            {transaction.payerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">ชื่อผู้ชำระ:</span>
                <span className="text-slate-700">{transaction.payerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">{t.receipt.paymentMethodLabel}:</span>
              <span className="text-slate-700">{t.receipt.paymentMethodValue}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center my-3">
            <span className="font-bold text-sm text-slate-800">จำนวนเงินรวม:</span>
            <span className="font-extrabold text-base text-teal-800">
              ฿{parseFloat(amountStr).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200">
            <span>{t.receipt.cashierLabel}:</span>
            <span className="font-medium text-slate-700">
              {transaction.receipter?.displayName || "เจ้าหน้าที่การเงิน"}
            </span>
          </div>

          <p className="text-[11px] text-center text-slate-400 pt-2 italic">
            เอกสารนี้ออกโดยระบบรับชำระเงินอิเล็กทรอนิกส์ โรงพยาบาลปลวกแดง
          </p>
        </article>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print, nav, header, aside {
            display: none !important;
          }
          .receipt-sheet, .receipt-sheet * {
            visibility: visible;
          }
          .receipt-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 1rem !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A5 portrait;
            margin: 5mm;
          }
        }
      `}</style>
    </section>
  );
}
