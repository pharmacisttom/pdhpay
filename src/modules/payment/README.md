# Payment module

Phase 1 integrates the Tomvis permission catalog and authenticated page boundary.
`application/access.ts` delegates permission and tenant enforcement to existing
Core functions. It is not a new authentication or RBAC implementation.

The protected `/finance` landing page uses the existing dashboard shell and
session. It has no payment records, simulated totals or enabled payment actions.
The production finance dashboard remains Phase 6.

Planned directories, created when their implementations become necessary:

- `domain`: statuses, money rules and permission names.
- `application`: use cases and transactional orchestration.
- `infrastructure`: private Google Drive storage and external adapters.
- `repositories`: Prisma queries with organization and point scope.
- `services`: business services using Core database and audit services.
- `validators`: strict Zod input schemas.
- `components`: Thai payment UI.
- `types`: DTOs that exclude credentials and unnecessary patient information.
- `actions`: mutating entry points following Tomvis conventions.
- `queries`: authorized server-side pagination and reports.

Do not implement duplicate Core services. Reuse `core/database/client`,
`core/auth/session`, `core/auth/authorization`, `core/api/handler`,
`core/security/rate-limit`, `core/logger` and `modules/audit/service`.
Payment-point assignments must additionally be enforced after Phase 2 adds the
models; organization permission alone will not authorize every point.
