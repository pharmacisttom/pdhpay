# Phase 1 validation — 2026-09-27

Baseline: TOMVIS main `8610ef0e5cfaafa6820e8794372d4bc7e3aa152b`.
Runtime: workspace-local Node v24.21.0; original system Node remains unchanged.
On Windows use npm.cmd when PowerShell blocks npm.ps1.

| Check | Result |
| --- | --- |
| npm ci | Passed; pinned lockfile, 559 packages installed, reported 0 vulnerabilities |
| npm run lint | Passed, exit 0 |
| npm run typecheck | Passed, Prisma generation + strict TypeScript, exit 0 |
| npm test | 29 passed, 1 skipped; 5 suites passed, 1 skipped |
| npm run build | Passed; Next production build includes dynamic /finance |
| Core preservation | All src/core file SHA-256 hashes match imported source |
| Dependency direction | No modules/ imports found in src/core |

Added tests verify missing authentication, finance permission denial, direct-page
navigation denial, tenant scope derivation, no role-name bypass and registration
of the complete permission catalog. Existing Core crypto/session/API tests pass.

Production-server HTTP smoke checks at loopback port 3107:

| Route | Result |
| --- | --- |
| /login | 200 |
| /finance without cookie | 307, Location /login |
| /api/v1/users without cookie | 401, no-store |
| /api/v1/health | 200, no-store (application only, not DB readiness) |

All four responses include X-Frame-Options DENY and X-Content-Type-Options nosniff.
No production deployment was performed.

## Limits

- Live MySQL test skipped because no TEST_DATABASE_URL was supplied. No migration
  or seed ran; no database login, role assignment or transactional audit was
  exercised against a real MySQL server.
- Google Drive, public uploads, payment workflows and finance roles belong to
  later phases and were not implemented or tested here.
- No browser visual/accessibility or authenticated end-to-end run was performed.
- npm reports install-script policy warnings for upstream dependencies; package
  installation, Prisma generation, native Argon2 tests and build nevertheless
  succeeded. Dependencies and overrides were preserved.
- Existing upstream docs/FOUNDATION-REPORT.md records upstream work, not this
  workspace's validation. This document is the current Phase 1 evidence.

## Changes and next phase

Imported the Core application, its initial migration and tests. Added the payment
permission catalog, Core-backed access function, protected /finance page, sidebar
link, environment placeholders and payment integration tests. No src/core or
Prisma schema changes; no new payment API endpoints or database tables.

All 20 payment permissions are declared in
src/modules/payment/domain/permissions.ts and composed into the existing catalog.
Database registration occurs only when the existing development seed is run;
production role grants require a separate reviewed rollout.

Next: Phase 2 Prisma payment schema, additive migration and development seed,
including disposable MySQL tests of composite tenant FKs and concurrency.
