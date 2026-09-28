# Payment development role mapping

All permission checks continue to use Tomvis Context/requirePermission.
Names are declared in src/modules/payment/domain/permissions.ts and composed into
the original catalog. Point assignments are an additional future access check;
role membership alone must not authorize every payment point.

| Role | Development seed grants |
| --- | --- |
| SUPER_ADMIN / ORG_ADMIN | Existing Core seed policy: all catalog permissions, within their tenant |
| FINANCE_ADMIN | All 20 payment permissions |
| FINANCE_OFFICER | Dashboard, transaction and point reads; receipt creation; shift open/close |
| FINANCE_VERIFIER | Dashboard, transaction and point reads; verify/reject/correct; reconciliation read/manage |
| FINANCE_AUDITOR | Dashboard, transaction, point, report, audit and reconciliation reads; report export |
| EXECUTIVE_VIEWER | Dashboard and report reads only |

The seeded test user uses the existing ORG_ADMIN role and is assigned to the five
development points. Finance roles are created but not automatically assigned to
other users. Reopen is reserved for roles explicitly granted payment.shift.reopen.
Core role APIs still prevent delegating permissions the actor does not possess.
