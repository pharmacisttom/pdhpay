import type { Metadata } from "next";
import { pageContext } from "@/core/auth/page";
import { requirePermission } from "@/core/auth/authorization";
import { UserManager } from "@/modules/payment/components/user-manager";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้งานและสิทธิ์ | PDH Smart Payment",
};

export default async function UsersAdminPage() {
  const ctx = await pageContext();
  requirePermission(ctx, "admin.users.manage");

  return <UserManager />;
}
