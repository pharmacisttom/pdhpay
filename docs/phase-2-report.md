# PDH Smart Payment — Phase 2 completion report

Date: 2026-09-27. Continues the Phase 1 integration; source remains TOMVIS
commit 8610ef0e5cfaafa6820e8794372d4bc7e3aa152b.

## Created files

- prisma/migrations/20260927000000_payment_foundation/migration.sql
- prisma/seeds/payment.ts
- src/modules/payment/repositories/payment-number.ts
- tests/payment-database.test.ts
- tests/payment-seed.test.ts
- docs/payment-database.md, docs/permissions.md and this report

## Modified files

- prisma/schema.prisma: eight payment models, four enums and inverse Core relations
- prisma/seed.ts: calls payment seed inside original transaction; explicit dev/test guard
- .env.example: PDH development organization default and credential instructions
- README.md and docs/local-database.md: current setup and validation state
- Ignored .env: generated development seed credentials; no committed secrets

No src/core file changed: all hashes match Phase 1 upstream. No package or
lockfile change. Existing foundation migration is unchanged. Phase 1 reports
remain historical evidence; this report records the current state.

## Database and migration

Added BankAccount, PaymentPoint, PaymentPointUser, PaymentShift,
PaymentTransaction, PaymentSlip, PaymentStatusHistory and PaymentNumberSequence.
Uses existing Core Organization/User/Role/Permission/AuditLog. Migration is
additive with composite tenant FKs, exact decimal money, business indexes and
CHECK constraints. See payment-database.md for detailed invariants and limits.

Migration applied first to `pdhpayment_phase2_test`, then to `pdhpayment` on the
user-selected XAMPP MariaDB 10.4.32 at 127.0.0.1:3306. Migration status is up to
date. Development database was backed up before migration to ignored
.tools/pdhpayment-before-phase2.sql; no reset, drop or db push used.

Development now has 22 tables including Prisma migration metadata, one
organization, one Core test user, nine roles, one inactive dummy bank, five
inactive points (OPD, ER, IPD, PHARMACY, DENTAL), and five point assignments.
No patient, slip or transaction data seeded. Full seed run twice; identities,
password hashes, token values, fixture counts and role grants remained stable.

## API endpoints and routes

No new APIs or routes in Phase 2. /finance remains the Phase 1 protected landing
page. Payment-number allocation is an internal repository function, not a public
endpoint. Payment workflows are not yet enabled.

## Permissions and environment

Reuses the 20 Phase 1 payment permissions and Core catalog. Development seed adds
FINANCE_ADMIN, FINANCE_OFFICER, FINANCE_VERIFIER, FINANCE_AUDITOR and
EXECUTIVE_VIEWER roles. Existing ORG_ADMIN is the test user's role. No new auth,
session, login, RBAC engine or audit store was created.

Seed requires NODE_ENV=development/test plus SEED_ORGANIZATION,
SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD. Current credentials are stored only in
ignored .env. APP_URL/AUTH_SECRET/TOTP_ENCRYPTION_KEY follow existing Core rules.
TEST_DATABASE_URL is supplied only to the disposable integration-test run.

## Checks

| Check | Result |
| --- | --- |
| Prisma format / validate / generate | Passed |
| Additive SQL review | No Core table column changes or destructive statements |
| Migration on disposable database | Both foundation and payment migrations passed |
| Migration on development database | Payment migration passed; schema up to date |
| Full development seed rerun | Idempotent; no password or QR rotation |
| npm run lint | Passed, exit 0 |
| npm run typecheck | Passed, exit 0 |
| npm run build | Passed, exit 0 |
| npm test with disposable TEST_DATABASE_URL | 39 passed across 8 suites; none skipped |

Live database tests cover Core tenant isolation plus payment cross-tenant bank,
staff, point and slip FKs; same-point shift assignment; duplicate open shifts;
positive amounts and exact decimals; unique payment references; duplicate hashes
being accepted; rollback of state/history failures; optimistic version conflicts;
eight concurrent reference allocators; Bangkok date boundary and allocation
rollback; idempotent payment seed and read-only executive grants. Unit tests
reject production/unspecified seed environments. Full seed rerun on development
also confirms preservation of the Core user's password hash.

## Remaining risks and next phase

- XAMPP mysql.db privilege table remains corrupt, as discovered before Phase 2.
  No repair attempted. Local development still uses root temporarily; resolve
  system privilege health before dedicated-account provisioning/production use.
- Tests ran on selected MariaDB 10.4.32, not an actual MySQL 8 instance.
- SQL CHECKs must be preserved in future Prisma migrations.
- No payment mutation routes exist yet: status transitions/history/audit writes,
  LOCKED-shift protection and upload safety must be implemented in later phases.
- Seed permissions are additive; reruns do not remove operator-added grants.
- Development points and dummy bank deliberately remain inactive.

Next authorized phase when requested: Phase 3 payment-point management and QR
generation using the existing Core permissions and these tenant constraints.
