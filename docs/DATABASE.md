# Database
MySQL 8+, Prisma 7 with the MariaDB driver adapter. UUID identifiers; UTC application dates. Organization owns User, Role, AuditLog and tenant SystemSetting records. Permission is a global catalog. UserRole joins users and roles using composite tenant foreign keys. RolePermission joins roles and permissions. Session, TwoFactorCredential, RecoveryCode and PasswordReset belong to User. RateLimit holds shared expiring counters.

Tenant-owned user and role keys include organizationId, enforced by composite foreign keys on assignments. Email is unique within an organization. Users belong to one organization in v0.1. SUPER_ADMIN is a seeded tenant role with all current permissions, not a cross-tenant bypass.

SystemSetting uses a non-null scope key (`global` or organization UUID) and key uniqueness; global rows have no organization FK, tenant rows include the organization FK. Only the settings service writes rows, deriving both fields. Global settings are deployment-managed; tenant administrators cannot modify them.

Indexes cover tenant lists, audit chronology, session/user lookup, token expiry and rate-limit expiry. Credentials and sessions cascade with user deletion; runtime user deletion is soft disabling. Organizations and roles are protected through restrictive FKs where appropriate. Audit identifiers deliberately remain scalar historical references so user removal cannot erase audit history. Do not hard-delete organizations through application code.

Initial migration is generated from the schema with `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`. Apply with `npm run db:migrate`; never use db push in production. Review and commit a migration for every schema change. MySQL has no application RLS: all module queries must use the authenticated tenant filter; integration tests verify this boundary.
