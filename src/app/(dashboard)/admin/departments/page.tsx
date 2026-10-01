import type { Metadata } from "next";
import { pageContext } from "@/core/auth/page";
import { requirePermission } from "@/core/auth/authorization";
import { DepartmentManager } from "@/modules/payment/components/department-manager";

export const metadata: Metadata = {
  title: "จัดการแผนก | PDH Smart Payment",
};

export default async function DepartmentsAdminPage() {
  const ctx = await pageContext();
  requirePermission(ctx, "payment.admin.manage");

  return <DepartmentManager />;
}
