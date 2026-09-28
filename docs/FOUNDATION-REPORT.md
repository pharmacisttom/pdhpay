# TOMVIS CORE FOUNDATION v0.1

## A. Completed
Initialized a new Git repository and a Next.js 16.3.4 / React 19.3 / TypeScript modular monolith. Added tenant organizations, users, session authentication, password recovery/change architecture, TOTP setup and challenge, recovery codes, permission-based RBAC, audit service, global/organization settings architecture, versioned APIs and a responsive admin shell. Core contains no product-specific business logic.

## B. Files created
- Root: package.json, package-lock.json, tsconfig.json, next.config.ts, prisma.config.ts, eslint.config.mjs, postcss.config.mjs, components.json, vitest.config.ts, .env.example, ignore/config files, README.md and AGENTS.md.
- src/core: configuration validation, Prisma client, safe API handler, authentication context, permission helpers, cryptography, database rate limiting, errors and logging.
- src/modules: auth, users, roles, permissions, organizations, settings, audit and read-query composition.
- src/app: authentication pages, protected administration layout/pages, and /api/v1 route dispatcher.
- src/components: reusable layout, forms, Button/Input primitives and 2FA management.
- prisma: schema, initial SQL migration, migration lock and development seed.
- tests: security primitives, mocked API integration, session validation and optional real-MySQL isolation tests.
- scripts: PM2 configuration, Nginx example and expired authentication-data cleanup.
- docs: blueprint, architecture, database, security, API/UI standards, deployment, changelog and this report.

## C. Files modified
No pre-existing project files existed. All implementation/configuration files are new. Generated source, dependencies, caches and build outputs are ignored. No commit or push was performed.

## D. Database
13 models: Organization, User, Role, Permission, UserRole, RolePermission, Session, TwoFactorCredential, RecoveryCode, PasswordReset, AuditLog, SystemSetting and RateLimit.

Initial migration: prisma/migrations/20260910000000_foundation/migration.sql. Prisma schema validation and SQL generation passed. Composite tenant foreign keys protect user-role assignments. The migration has **not** been applied to a live MySQL database in this environment.

## E. Security
Argon2id passwords; HMAC-digested opaque session/reset/recovery tokens; secure production cookie attributes; idle/absolute expiry; password-change and account-disable revocation; encrypted AES-GCM TOTP secrets; guarded one-time OTP/recovery consumption; strict server-side Zod validation; Origin-based CSRF defense; shared database rate limits; explicit tenant filters; bounded safe projections; permission delegation checks; transactional audit writes; safe errors and security headers.

## F. Testing
- 22 tests passed across cryptographic/validation, mocked route integration and server-session suites.
- 1 live MySQL tenant-isolation test explicitly skipped: no configured MySQL instance; Docker engine unavailable.
- Real local production-server HTTP checks: /login 200; /dashboard 307 to /login; /api/v1/health 200; /api/v1/users 401. Protected responses are no-store; X-Frame-Options is DENY.
- Browser interaction, visual QA, and complete database-backed login/reset/2FA flows were not executed. Their acceptance procedure is documented in tests/README.md.

## G. Build
Dependency installation, lint (zero errors/warnings), TypeScript checking, Prisma generation/validation and production build passed. npm audit reported zero vulnerabilities after pinned overrides for mariadb 3.5.4, mysql2 3.24.4 and deepmerge-ts 8.0.2. These overrides require ongoing compatibility review, particularly live database validation.

## H. Not implemented
Password-reset provider delivery (injectable port supplied), rich user/role editing screens (mutation APIs supplied), machine-to-machine authentication, webhooks, full notification gateway, licensing, billing/subscriptions, business modules, WorkD, attendance, finance/healthcare/HR workflows, AI and mobile applications. No production deployment or production credentials.

## I. Risks / technical debt
Do not treat a successful build as production certification. Apply and test the migration on disposable MySQL before rollout. Configure reset delivery and operational secret management. Validate email delivery, MFA replay/recovery races and session revocation end to end. Rehearse backup restoration and rollback. Tighten CSP with nonces (current Next.js hydration policy permits inline scripts). Define audit archival/retention and encryption-key rotation operations. Settings store locale/theme preferences; full localization/theme rendering is a future UI enhancement. Organization onboarding is currently through the documented development seed or operator-managed provisioning; there is no public organization-registration API. Database-level isolation depends on application-scoped queries because MySQL has no application RLS.

## J. Next recommended step
Complete a Foundation v0.1 acceptance pass against disposable MySQL, configure the reset delivery adapter, and perform the documented end-to-end and operational security checks. Address those findings before starting a future product module. Stop at Core Foundation for this task.
