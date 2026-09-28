# Proposed payment architecture

สถานะ: ออกแบบบน TOMVIS Core 0.1.0 commit 8610ef0e5cfaafa6820e8794372d4bc7e3aa152b; payment persistence เป็นแผน Phase 2

## Boundaries

```text
src/app                        Routes, layouts, request parsing
  ↓
src/modules/payment/
  domain/                      Status rules and business invariants
  application/                 Use cases and transaction coordination
  infrastructure/              Tomvis adapters and private Drive storage
  repositories/                Tenant-scoped persistence
  services/                    Payment services
  validators/                  Server-side input validation
  components/                  Thai responsive UI
  types/                       Module DTOs
  actions/                     Mutating entry points if used by Tomvis
  queries/                     Authorized paginated reads
  ↓
src/core                       Existing Tomvis services, inspected in Phase 1
```

Core must not import the payment module. Authentication, permissions, organization context, audit, logging and the database client remain owned by Tomvis. Phase 1 uses pageContext, requireContext, requirePermission and tenantWhere directly. The existing modules/audit/service.ts will own financial audit writes after its metadata contract is extended and reviewed.

Staff operations resolve session and organization on the server, then check permission and payment-point assignment. Public submission resolves organization and point from an active secure QR token; browser-supplied IDs cannot grant access. Staff SSE, slip access and exports require the same authorization as ordinary reads.

## Proposed persistence

| Entity | Purpose and constraints |
| --- | --- |
| PaymentTransaction | UUID, organization, payment number, point, optional shift, patient/payer fields, Decimal(15,2) amounts, status, verification/receipt metadata, timestamps, integer version |
| PaymentSlip | Private Drive IDs, original/stored names, validated MIME, size and SHA-256; no file binary in MySQL |
| PaymentPoint | Organization, code, name, department/location, bank account, operating hours, status, rotatable random QR token |
| PaymentPointUser | Unique organization/point/user assignment referring to existing core user |
| PaymentStatusHistory | Append-only transition, actor, reason and time; complements rather than duplicates core security audit |
| PaymentShift | Organization/point, work interval, OPEN/CLOSED/LOCKED, actor metadata, counts and Decimal totals |
| BankAccount | Organization-owned receiving account and active state |

Require organization consistency across every relation, not just a top-level query filter. Match Core UUID Char(36) IDs and restrictive organization relations; use composite organization keys for point, bank, user and shift assignments. Keep monetary values as decimal strings across transport; do not calculate money with JavaScript floating point.

Use unique paymentNo and organization/point-code constraints. Plan indexes for organization with submittedAt, status/submittedAt, point/submittedAt, hn, transferDateTime and verifiedAt based on final queries. Index SHA-256 for duplicate lookup without uniqueness: duplicates must be flagged, not rejected.

## Consistency decisions to implement

- Generate payment numbers on the server with an atomic database sequence and a unique constraint. Final number format and sequence scope belong in Phase 2.
- Verify using expected version and eligible current status in a transaction; persist amount, actor, status history and audit consistently. Reject stale writes.
- Serialize close-shift with payment mutations using a shared locking protocol. Recheck LOCKED inside transactions. Reopening requires payment.shift.reopen and an audit event.
- Receipt creation requires an eligible verified payment and protection against duplicate issuance.
- If core audit cannot share a database transaction, use a durable outbox compatible with its API; never assume best-effort logging is sufficient.
- Drive upload and MySQL cannot share one transaction. Define staged upload, retry/idempotency and orphan cleanup before Phase 5. Do not return success when required metadata is missing.
- Duplicate hashes must be checked with a concurrency-safe design so simultaneous identical submissions are flagged for review.

## Security and delivery gates

Use existing Tomvis CSRF/session/error patterns after inspection. Enforce server authorization, request limits and file validation before upload. Keep slips private and stream them through authorized server endpoints with audited access. Never log QR tokens, credentials or unnecessary patient information.

Store timestamps consistently and calculate daily report boundaries in Asia/Bangkok. Paginate and filter on the server. For multiple PM2 workers, use durable shared event delivery or database-backed SSE polling, not a process-local event bus alone. Recheck session expiry and tenant authorization for long-lived streams.

Phase 1 acceptance requires working Tomvis integration and successful lint/typecheck/build checks. Prisma migrations and seeds are Phase 2. No subsequent phase starts while that gate is unmet.
