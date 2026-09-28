# Payment persistence — Phase 2

Uses the Phase 1 TOMVIS Core schema and UUID Char(36) identities. No replacement
User, Organization, Permission, Role or AuditLog tables are introduced. Existing
Core tables gain Prisma inverse relation fields only; migration SQL does not
alter their columns or data.

## Tables

| Model | Purpose |
| --- | --- |
| BankAccount | Tenant receiving account, stable code and active flag |
| PaymentPoint | Tenant/code, random QR token, bank, creator, location, local hours, status |
| PaymentPointUser | Composite tenant/point/user assignment using existing User |
| PaymentShift | Point, Bangkok business date, UTC interval, actors, totals, state and version |
| PaymentTransaction | Patient/payer submission, decimal amounts, verification/receipt metadata, status, reconciliation state and version |
| PaymentSlip | Private Drive metadata, filenames, MIME, size and SHA-256; no binary contents |
| PaymentStatusHistory | Versioned business-state history; does not replace Core security audit |
| PaymentNumberSequence | Global daily atomic counter for globally unique payment references |

All tenant relations use composite keys. A transaction's shift must belong to the
same organization **and point**. Bank, point creator, verifier, receipter, shift
actors and history actors cannot refer to another tenant's records. Deletion is
restrictive so financial history is not cascaded away. Historical public
submissions can have null staff actors and initially no assigned shift.

Money uses Decimal(15,2); accept decimal strings in future APIs and retain decimal
arithmetic. No float fields. SQL CHECK constraints reject nonpositive declared
amounts, negative verified amounts, invalid counters, invalid shift intervals and
nonpositive slip sizes. Difference totals can be negative.

Payment statuses: SUBMITTED, PENDING_VERIFY, VERIFIED, RECEIPTED,
AMOUNT_MISMATCH, POSSIBLE_DUPLICATE, INVALID_SLIP, REJECTED, CANCELLED.
Point statuses: ACTIVE, INACTIVE, TEMPORARILY_CLOSED, MAINTENANCE.
Shift statuses: OPEN, CLOSED, LOCKED.
Reconciliation states: MATCHED, PARTIAL_MATCH, MISMATCH, NOT_FOUND, DUPLICATE.

## Uniqueness and indexes

- Globally unique paymentNo and qrToken; Drive file ID unique, hash deliberately
  non-unique. Reusing identical bytes must remain possible for duplicate review.
- Receipt number unique within an organization, with multiple nulls allowed.
- Status history unique per organization/transaction/version.
- OPEN shift has openSlot=1; CLOSED/LOCKED has null. CHECK plus unique
  organization/point/openSlot enforces at most one open shift per point.
- Tenant indexes cover submittedAt/id, status/time, point/time, HN, transfer time,
  verified time, verifier/time, bank/time, slip hash, history and shift date/state.

## Reference allocation

`src/modules/payment/repositories/payment-number.ts` allocates
PAY-YYYYMMDD-NNNNNN using the Asia/Bangkok calendar date. The sequence date is
stored as a DATE. Its scope is global so numbers cannot collide across tenants.
An atomic INSERT ON DUPLICATE KEY UPDATE locks the day's row; allocation and
payment creation must run in the **same** Prisma transaction. Never catch an
allocation failure and continue that transaction. Capacity is 999999/day;
overflow aborts. Rolling back a payment also rolls back its allocation.

## Migration

`20260927000000_payment_foundation` is additive: eight tables, indexes, foreign
keys, and SQL-only CHECK constraints. CHECK constraints are documented in SQL
because Prisma schema does not represent them. Inspect future migrations to
preserve these constraints. Applied successfully to the selected MariaDB 10.4.32
development/test server; MySQL 8 itself has not been exercised here.

Development backup before migration: ignored
`.tools/pdhpayment-before-phase2.sql`. No reset or db push was used. Do not
reverse this migration by dropping tables after real financial data exists;
use reviewed forward fixes or a separately rehearsed full restore.

## Seed

Existing `prisma/seed.ts` still owns Tomvis identity, hashing and permission
creation. It calls `prisma/seeds/payment.ts` within the same transaction.
Requires explicit NODE_ENV=development or test and environment-supplied admin
credentials; production/unspecified modes are rejected.

Creates five points (OPD, ER, IPD, PHARMACY, DENTAL), an inactive dummy bank, and
five finance roles alongside the four Core roles. Points start INACTIVE to avoid
accepting real payments against dummy accounts. The existing development admin
is the test user and is assigned to these five points. No additional identity
system or separate seed login is introduced. No payment/slip/patient fixtures
are inserted into development.

Re-running preserves passwords, names, bank data and QR tokens; it adds missing
seed records/grants without deleting operator changes. Thus manually broadened
role grants are not automatically revoked by seed. Production grants require a
reviewed provisioning process rather than this seed.

## Boundaries for later phases

Version columns support optimistic locking but do not implement verify/close
workflows themselves. State-transition eligibility, atomic status history plus
Core audit, append-only history access, LOCKED-shift edit guards, file validation,
duplicate flagging, and QR point-status validation belong in application services
before their routes are exposed. No triggers or pretend payment APIs are added.
