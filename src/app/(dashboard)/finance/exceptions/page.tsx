import { pageContext } from "@/core/auth/page";
import { ReviewQueue } from "@/modules/payment/components/review-queue";
export default async function ExceptionsPage() { return <ReviewQueue ctx={await pageContext()} title="รายการผิดปกติ" statuses={["AMOUNT_MISMATCH", "POSSIBLE_DUPLICATE", "INVALID_SLIP"]} />; }
