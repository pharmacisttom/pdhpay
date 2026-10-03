import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { pageContext } from "@/core/auth/page";
import { db } from "@/core/database/client";
import { query } from "@/modules/queries";
import { AppError } from "@/core/errors";
import { ApiForm } from "@/components/shared/api-form";
import { TwoFactor } from "@/components/shared/two-factor";
import { RegistrationApproval } from "@/components/users/registration-approval";
import { UserManager } from "@/components/users/user-manager";
import { RoleManager } from "@/components/roles/role-manager";
import { OneAdminDashboard } from "@/components/dashboard/one-admin-dashboard";

const titles: Record<string, string> = {
  dashboard: "Overview",
  users: "Users",
  roles: "Roles & access",
  organizations: "Organization",
  audit: "Audit log",
  settings: "Settings",
};
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { section } = await params;
  if (!titles[section]) notFound();
  const ctx = await pageContext();
  let data;
  try {
    data =
      section === "settings" && !ctx.permissions.includes("settings.view")
        ? {}
        : await query(ctx, section, await searchParams);
  } catch (error) {
    if (error instanceof AppError && error.status === 403)
      return (
        <>
          <h1>Access restricted</h1>
          <p>Your account does not have access to this page.</p>
        </>
      );
    throw error;
  }
  const object = data as Record<string, unknown>;
  return (
    <>
      {section === "users" && <UserManager initialData={object} />}
      {section === "roles" && <RoleManager initialData={object} />}
      {section === "dashboard" && <OneAdminDashboard data={object} />}
      {section === "audit" && (
        <>
          <div className="page-head">
            <p className="eyebrow">Workspace administration</p>
            <h1>{titles[section]}</h1>
            <p>A record of account activity and administrative changes.</p>
          </div>
          <Collection section="audit" data={object} />
        </>
      )}
      {section === "organizations" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{String(object.name)}</h1>
                  <p className="text-xs text-slate-500 mt-0.5">ข้อมูลองค์กรและพารามิเตอร์ระบบรับชำระเงิน</p>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                object.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${object.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                {object.active ? "เปิดใช้งาน (Active)" : "ปิดใช้งาน"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 font-medium">ชื่อองค์กร (Organization Name)</span>
                <span className="font-bold text-slate-800 text-sm">{String(object.name)}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-medium">Sign-in Slug (รหัสเข้าใช้งาน)</span>
                <span className="font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {String(object.slug)}
                </span>
              </div>
            </div>

            {ctx.permissions.includes("organizations.update") && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-3">แก้ไขชื่อองค์กร</h3>
                <ApiForm
                  endpoint="organizations"
                  method="PATCH"
                  label="บันทึกข้อมูลองค์กร"
                  fields={[
                    {
                      name: "name",
                      label: "ชื่อองค์กร (Organization name)",
                      value: String(object.name),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {section === "settings" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">ตั้งค่าระบบ (Workspace Preferences)</h2>
              <p className="text-xs text-slate-500 mt-0.5">กำหนดการตั้งค่าภาพรวมของระบบ PDHPAY</p>
            </div>
            {ctx.permissions.includes("settings.update") ? (
              <ApiForm
                endpoint="settings"
                method="PATCH"
                label="บันทึกการตั้งค่า"
                fields={[
                  {
                    name: "applicationName",
                    label: "ชื่อแอปพลิเคชัน (Application name)",
                    value: String(object.applicationName),
                  },
                  {
                    name: "timezone",
                    label: "เขตเวลา (Timezone IANA)",
                    value: String(object.timezone),
                  },
                  {
                    name: "locale",
                    label: "ภาษาหลัก (Locale: en หรือ th)",
                    value: String(object.locale),
                  },
                  {
                    name: "theme",
                    label: "ธีมระบบ (light, dark, system)",
                    value: String(object.theme),
                  },
                ]}
              />
            ) : (
              <p className="text-xs text-slate-500">โปรดติดต่อผู้ดูแลระบบเพื่อทำการแก้ไขการตั้งค่า</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">เปลี่ยนรหัสผ่าน (Change Password)</h2>
              <p className="text-xs text-slate-500 mt-0.5">เปลี่ยนรหัสผ่านบัญชีผู้ใช้ของคุณ</p>
            </div>
            <ApiForm
              endpoint="auth/change-password"
              label="ยืนยันเปลี่ยนรหัสผ่าน"
              redirect="/login"
              fields={[
                {
                  name: "currentPassword",
                  label: "รหัสผ่านปัจจุบัน",
                  type: "password",
                  autoComplete: "current-password",
                },
                {
                  name: "password",
                  label: "รหัสผ่านใหม่ (อย่างน้อย 12 ตัวอักษร)",
                  type: "password",
                  autoComplete: "new-password",
                },
              ]}
            />
          </div>

          <TwoFactor
            enabled={
              !!(
                await db().twoFactorCredential.findUnique({
                  where: { userId: ctx.userId },
                })
              )?.enabled
            }
          />
        </div>
      )}
    </>
  );
}
function Collection({
  section,
  data,
}: {
  section: string;
  data: Record<string, unknown>;
}) {
  const items = data.items as Record<string, unknown>[];
  const page = Number(data.page),
    total = Number(data.total),
    pageSize = Number(data.pageSize);
  const columns =
    section === "users"
      ? ["Name", "Email", "Status", "Created"]
      : section === "roles"
        ? ["Role", "Permissions", "Members"]
        : ["Event", "Result", "Resource", "Time"];
  return (
    <>
      {section === "users" &&
        items.some((item) => item.status === "PENDING") && (
          <section className="panel">
            <p className="eyebrow">คำขอรออนุมัติ</p>
            <h2>กำหนดบทบาทก่อนเปิดใช้งานบัญชี</h2>
            <PendingRegistrations items={items} />
          </section>
        )}
      {section !== "audit" && (
        <form className="toolbar">
          <label>
            Search
            <input className="input" name="q" maxLength={100} />
          </label>
          <button className="button button-outline" type="submit">
            Search
          </button>
        </form>
      )}
      <div className="table-wrap">
        {items.length ? (
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th scope="col" key={c}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={String(item.id)}>
                  {(section === "users"
                    ? [
                        item.displayName,
                        item.email,
                        item.status,
                        new Date(String(item.createdAt)).toLocaleDateString(
                          "en-GB",
                        ),
                      ]
                    : section === "roles"
                      ? [
                          item.name,
                          (
                            item.permissions as {
                              permission: { name: string };
                            }[]
                          )
                            .map((p) => p.permission.name)
                            .join(", "),
                          (item._count as { users: number }).users,
                        ]
                      : [
                          item.action,
                          item.result,
                          item.resourceType,
                          new Date(String(item.createdAt)).toISOString(),
                        ]
                  ).map((value, index) => (
                    <td key={index}>{String(value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No records found.</div>
        )}
      </div>
      <div className="pagination">
        <span>
          {total} records · Page {page}
        </span>
        <div className="actions">
          {page > 1 && (
            <Link href={`/${section}?page=${page - 1}`}>Previous</Link>
          )}
          {page * pageSize < total && (
            <Link href={`/${section}?page=${page + 1}`}>Next</Link>
          )}
        </div>
      </div>
    </>
  );
}

async function PendingRegistrations({
  items,
}: {
  items: Record<string, unknown>[];
}) {
  const ctx = await pageContext();
  const roles = await db().role.findMany({
    where: { organizationId: ctx.organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="registration-list">
      {items
        .filter((item) => item.status === "PENDING")
        .map((item) => (
          <article key={String(item.id)} className="registration-item">
            <div>
              <strong>{String(item.displayName)}</strong>
              <p>{String(item.email)}</p>
            </div>
            <RegistrationApproval userId={String(item.id)} roles={roles} />
          </article>
        ))}
    </div>
  );
}
