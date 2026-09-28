# PDH Smart Payment — Phase 1 audit

วันที่ตรวจ: 2026-09-27

Source: https://github.com/pharmacisttom/Tomvis.git
main commit: 8610ef0e5cfaafa6820e8794372d4bc7e3aa152b (TOMVIS Core 0.1.0)

นำ source snapshot มาเป็นฐานที่ D:\pdhpayment; เก็บต้นฉบับใน .tomvis-source ซึ่งถูก ignore ไม่แก้ D:\Tomvisframework หรือ D:\smartjeffe และไม่ push/deploy

## 1. Current architecture

```text
src/app/                       Auth/dashboard layouts and API adapters
  api/v1/[...path]/route.ts     Existing REST composition
  (dashboard)/finance/         New protected landing page
src/modules/                   auth, users, roles, organizations, settings, audit
  permissions/catalog.ts       Core + payment permission catalog
  payment/                     Business module
src/core/                      auth, api, config, database, errors, logger, security
src/components/                Layout, API forms, 2FA, Button/Input
prisma/                        Schema, foundation migration, development seed
```

Architecture: app → modules → core; Core must never import payment.
Pinned stack: Next 16.3.4, React 19.3.0, Prisma 7.10.0, TypeScript 6.0.3, Tailwind 4.3.3, Zod 4.6.1, QRCode 1.5.4.
ใช้ lockfile เดิม ไม่เพิ่ม dependency; SweetAlert2/Drive SDK ยังไม่จำเป็นใน Phase 1

## 2. Reusable components

| Capability | Existing implementation |
| --- | --- |
| Session/cookies | src/core/auth/session.ts |
| Page auth | src/core/auth/page.ts: pageContext |
| Permissions/tenant | src/core/auth/authorization.ts: requireContext, requirePermission, tenantWhere |
| Login/logout/2FA | src/modules/auth/service.ts, src/app/(auth) |
| Transactional audit | src/modules/audit/service.ts |
| Database | src/core/database/client.ts: Prisma + MariaDB adapter |
| API/errors | src/core/api/handler.ts, src/core/errors/index.ts |
| Shared rate limits | src/core/security/rate-limit.ts |
| UI | admin-shell, api-form, Button/Input, two-factor |
| Security headers | next.config.ts; ไม่มี middleware แยก |
| Environment | core/config/env.ts, .env.example, prisma.config.ts |

## 3. Current database

13 models: Organization, User, Role, Permission, UserRole, RolePermission, Session, TwoFactorCredential, RecoveryCode, PasswordReset, AuditLog, SystemSetting, RateLimit.
UUID Char(36); composite organization/user และ organization/role FKs ป้องกัน cross-tenant assignments.
Audit references เป็น historical scalar fields ไม่ cascade ตาม user.
นำ migration เดิม prisma/migrations/20260910000000_foundation/migration.sql เข้ามาโดยไม่แก้ schema และไม่รัน migrate/seed

## 4. Auth / RBAC / Audit

Opaque session tokens มี digest ใน DB, idle/absolute expiry, active user/organization checks และ reload permissions ทุก request.
Logout ลบ session + audit ใน transaction แล้ว clear cookie; ApiForm redirect /login.
ใช้ permission strings ไม่ใช้ role-name bypass. Role service ห้าม delegate permission ที่ actor ไม่มี.
Audit service ใช้ transaction เดิมและรับ allowlisted action/resource/result; ยังไม่รับ old/new amount หรือ request context ครบตาม payment requirements.

## 5. Gaps / conflicts

- Node เดิม v20.17.0 ต่ำกว่า engines ของ Core: เตรียม Node 24 LTS ใน .tools โดยไม่เปลี่ยน system runtime
- Mutation guard รับ JSON ไม่เกิน 16 KiB: Phase 4 ต้องเพิ่ม bounded multipart adapter โดยคง Origin check และ rate limits
- Audit model มี metadata/ipAddress/userAgent แต่ service ยังไม่รับ; ต้องเพิ่ม typed allowlist สำหรับ amount/status diffs และ requestId ก่อน financial mutations
- Logger เดิมมี level/event/requestId แต่ยังไม่ครบ timestamp/user/organization/module/action
- /api/v1/health เดิมตรวจเฉพาะแอป; /api/health ที่ probe DB ยังต้องทำ
- CSP อนุญาต inline script; camera permission ปิด ต้องทดสอบ mobile upload/capture
- Password-reset delivery ยังต้อง wire provider
- ไม่มี disposable MySQL/Drive configuration; ไม่ถือว่าทดสอบ integration จริงแล้ว
- Core UI ยังเป็นภาษาอังกฤษ; /finance ใหม่ใช้ภาษาไทย
- Finance roles และ point assignments ยังไม่สร้าง; catalog registration ไม่ใช่ production grant

## 6. Added files

นำ upstream source/config/tests/schema/migration/docs มาเป็นฐาน ยกเว้น .git; upstream README อยู่ docs/TOMVIS-README.md.
เพิ่ม src/modules/payment/README.md, domain/permissions.ts, application/access.ts, src/app/(dashboard)/finance/page.tsx, tests/payment-access.test.ts, tests/payment-page.test.ts และเอกสาร payment.

## 7. Changes relative to upstream

- modules/permissions/catalog.ts compose payment permissions ทั้ง 20 รายการ
- components/layout/admin-shell.tsx เพิ่ม finance link ตาม permission
- .env.example เพิ่ม Google server-only placeholders สำหรับ Phase 5
- .gitignore, tsconfig.json, eslint.config.mjs exclude reference checkout/local tools
- README.md เป็น product setup

ไม่แก้ src/core, Prisma schema หรือ existing auth flow.
Development seed เดิมจะ register permissions และ grant ให้ development admin roles เมื่อผู้พัฒนารันเอง; ห้ามใช้ seed นี้กับ production.

## 8. Migration plan

Phase 2: PaymentTransaction, PaymentSlip, PaymentPoint, PaymentPointUser, PaymentStatusHistory, PaymentShift, BankAccount และ atomic payment-number sequence.
ใช้ existing organization/User UUIDs; composite FKs ป้องกัน cross-tenant point/user/bank/shift relations.
Decimal(15,2), optimistic version, unique paymentNo, scoped query indexes และ non-unique SHA-256 index (flag duplicates ไม่ reject).
สร้าง additive SQL migration และทดสอบบน disposable MySQL ที่ชื่อจบ _test. Development seed ใช้ Core identities เดิม.
ดู payment-architecture.md สำหรับ consistency, Drive compensation และ SSE design.

## 9. Phase 1 implementation / acceptance

เพิ่ม module boundary, permission catalog และ /finance ที่เรียก pageContext + Core permission/tenant helpers.
Reuse dashboard layout/logout; ไม่สร้าง login/RBAC/audit ใหม่.
ยังไม่เปิด public submission หรือ payment mutation APIs.
ผล lint/typecheck/build ผ่าน; tests ผ่าน 29 รายการ และ skip live MySQL 1 รายการ ดูหลักฐานและข้อจำกัดใน phase-1-validation.md. รอบนี้หยุดที่ Phase 1 ตามขอบเขตที่สั่ง.
