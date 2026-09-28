# Deployment runbook (manual, not executed)
Provision Ubuntu, supported Node.js LTS, MySQL 8+, Nginx and PM2. Create a non-root app account and a private database. Use separate migration and runtime DB credentials; runtime needs SELECT/INSERT/UPDATE/DELETE only. Enforce encrypted database transport when crossing hosts.

Install using npm ci, provide secrets through a protected environment file owned by the app account (0600), run prisma generate, lint/typecheck/tests, back up the database, run prisma migrate deploy, then npm run build. Configure the password-reset delivery port before making account recovery available. PM2 runs npm start bound to localhost; use scripts/ecosystem.config.cjs. TLS termination and limits are illustrated by scripts/nginx.conf; replace hostname and certificate paths. Do not expose MySQL publicly.

Health probe: GET /api/v1/health returns process liveness only. Monitor 5xx rates, latency, DB connections, failed logins, disk capacity and backup failures. Do not send credentials to log aggregation. Schedule scripts/cleanup.ts daily for expired authentication data and rate buckets; audit retention is a separate approved policy.

Back up MySQL daily with encrypted storage, off-host copies and defined retention. Before each release record the build ID, migration state and backup identifier. Rehearse restoration in isolation. Rollback app code only when schema-compatible; prefer forward-fix migrations. Restore backups only under a planned outage with explicit data-loss assessment. Never blindly roll back or reset production migrations.

Complete disposable-MySQL integration tests, TLS/session/CSRF smoke tests, tenant isolation review and restoration rehearsal before a production release. No production deployment has been automated.
