import { redirect } from "next/navigation";
import { context, session } from "@/core/auth/session";
import { AppError } from "@/core/errors";
import { AdminShell } from "@/components/layout/admin-shell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await (async () => {
    try {
      return { ctx: await context(), row: await session() };
    } catch (error) {
      if (error instanceof AppError && error.status === 401) redirect("/login");
      throw error;
    }
  })();
  return (
    <AdminShell
      ctx={identity.ctx}
      name={identity.row.user.displayName}
      organization={identity.row.user.organization.name}
    >
      {children}
    </AdminShell>
  );
}
