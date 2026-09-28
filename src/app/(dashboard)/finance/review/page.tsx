import { pageContext } from "@/core/auth/page";
import { ReviewQueue } from "@/modules/payment/components/review-queue";
export default async function ReviewPage() { return <ReviewQueue ctx={await pageContext()} title="คิวรอตรวจสลิป" statuses={["SUBMITTED", "PENDING_VERIFY"]} />; }
