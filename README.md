# PDH Smart Payment

ระบบรับหลักฐานการชำระเงิน โรงพยาบาลปลวกแดง บน TOMVIS Core 0.1.0

ฐาน: https://github.com/pharmacisttom/Tomvis.git
commit 8610ef0e5cfaafa6820e8794372d4bc7e3aa152b

ใช้ session, RBAC, audit, database และ UI ของ Core เดิม; หน้า /finance ต้องมี payment.dashboard.read.
Phase 2 เพิ่ม schema, migration และ development seed ของ payment แล้ว ยังไม่เปิดรับชำระเงินจริง.

## Development

1. ใช้ Node ตาม package.json: >=22.17.0 <23 หรือ >=24 (workspace นี้มี Node 24 ใน .tools)
2. npm ci
3. คัดลอก .env.example เป็น .env; ตั้ง DATABASE_URL ไปยัง MySQL 8 development
4. ตั้ง AUTH_SECRET สุ่มอย่างน้อย 32 ตัวอักษร และ TOTP_ENCRYPTION_KEY เป็น random 32 bytes encoded base64; Core ไม่ใช้ NEXTAUTH_SECRET
5. npm run db:generate และ npm run db:migrate หลังตรวจ DB เป้าหมาย
6. ตั้ง NODE_ENV=development, SEED_ORGANIZATION=pdh-dev และ SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD แล้ว npm run db:seed เฉพาะ development
7. npm run dev; เข้าสู่ระบบ /login แล้วเปิด /finance

Google variables ยังไม่ต้องตั้งใน Phase 1. ห้าม commit credentials. งานนี้ไม่รัน migration/seed ให้อัตโนมัติ.

## Validation

npm run lint, npm run typecheck, npm test, npm run build

Live DB tests ต้องตั้ง TEST_DATABASE_URL ไปยัง disposable DB ชื่อจบ _test; skipped tests ไม่ถือว่าผ่าน.

- [Audit และแผน Phase 1](docs/phase-1-audit.md)
- [ผลตรวจ Phase 1](docs/phase-1-validation.md)
- [ฐานข้อมูล XAMPP ที่ตั้งค่าแล้ว](docs/local-database.md)
- [ผล Phase 2 และข้อจำกัด](docs/phase-2-report.md)
- [Payment database](docs/payment-database.md)
- [Payment architecture](docs/payment-architecture.md)
- [Core architecture](docs/ARCHITECTURE.md)
- [Core setup เดิม](docs/TOMVIS-README.md)
- [Security baseline](docs/SECURITY.md)

ยังต้องพัฒนา Phase 3–12: จัดการจุดชำระเงิน/QR, upload/Drive, verification, shifts, reports, Thai UI และ production readiness. Build ผ่านไม่ได้หมายถึงพร้อมใช้งานจริง.
