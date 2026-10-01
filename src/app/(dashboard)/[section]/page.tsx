import Link from "next/link";
import { notFound } from "next/navigation";
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
        <section className="panel">
          <dl className="info-grid">
            <dt>Name</dt>
            <dd>{String(object.name)}</dd>
            <dt>Sign-in slug</dt>
            <dd>{String(object.slug)}</dd>
            <dt>Status</dt>
            <dd>{object.active ? "Active" : "Disabled"}</dd>
          </dl>
          {ctx.permissions.includes("organizations.update") && (
            <ApiForm
              endpoint="organizations"
              method="PATCH"
              label="Save organization"
              fields={[
                {
                  name: "name",
                  label: "Organization name",
                  value: String(object.name),
                },
              ]}
            />
          )}
        </section>
      )}
      {section === "settings" && (
        <>
          <section className="panel">
            <h2>Workspace preferences</h2>
            {ctx.permissions.includes("settings.update") ? (
              <ApiForm
                endpoint="settings"
                method="PATCH"
                label="Save preferences"
                fields={[
                  {
                    name: "applicationName",
                    label: "Application name",
                    value: String(object.applicationName),
                  },
                  {
                    name: "timezone",
                    label: "Timezone (IANA)",
                    value: String(object.timezone),
                  },
                  {
                    name: "locale",
                    label: "Locale (en or th)",
                    value: String(object.locale),
                  },
                  {
                    name: "theme",
                    label: "Theme preference (light, dark, system)",
                    value: String(object.theme),
                  },
                ]}
              />
            ) : (
              <p>Contact your administrator to change workspace preferences.</p>
            )}
          </section>
          <section className="panel">
            <h2>Change password</h2>
            <ApiForm
              endpoint="auth/change-password"
              label="Change password"
              redirect="/login"
              fields={[
                {
                  name: "currentPassword",
                  label: "Current password",
                  type: "password",
                  autoComplete: "current-password",
                },
                {
                  name: "password",
                  label: "New password (12 characters minimum)",
                  type: "password",
                  autoComplete: "new-password",
                },
              ]}
            />
          </section>
          <TwoFactor
            enabled={
              !!(
                await db().twoFactorCredential.findUnique({
                  where: { userId: ctx.userId },
                })
              )?.enabled
            }
          />
        </>
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
