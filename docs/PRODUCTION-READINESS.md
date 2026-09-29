# Production readiness

ห้ามเปิดรับข้อมูลผู้ป่วยจนกว่ารายการนี้จะเสร็จและมีผู้รับผิดชอบลงนามรับรอง

## Release gate

- ใช้ Node.js ตาม `package.json` และติดตั้งด้วย `npm ci` จาก lockfile
- สร้าง production secrets ใหม่ทั้งหมด; `APP_URL` ต้องเป็น HTTPS
- แยก migration DB account ออกจาก runtime DB account
- สำรองฐานข้อมูลและทดสอบกู้คืนใน environment แยก
- รัน `npm run db:migrate`, `npm run lint`, `npm run typecheck`, `npm test`
  และ `npm run build`; MySQL tests ต้องไม่ถูก skip
- ตั้งค่า Google Drive private folder และแชร์เฉพาะ service account
- ตั้งค่า Google Sheets เฉพาะเมื่อมีนโยบายอนุญาตให้ export ข้อมูลผู้ป่วย
- ทดสอบ upload/download, duplicate detection, OCR failure และ orphan cleanup
- ตั้ง cron สำหรับ `scripts/cleanup.ts` และ `scripts/cleanup-payment-uploads.ts`
- ตั้ง TLS, Nginx request limits, monitoring, alerting และ encrypted off-site backup
- กำหนด retention/deletion สำหรับ slips, audit logs และ exports ตามนโยบาย PDPA
- ทำ UAT กับฝ่ายการเงินโดยยืนยันว่า OCR ไม่ใช่หลักฐานว่าเงินเข้าบัญชี

## Required production variables

`DATABASE_URL`, `AUTH_SECRET`, `TOTP_ENCRYPTION_KEY`, `APP_URL`,
`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` และ `GOOGLE_DRIVE_FOLDER_ID`.
เพิ่ม `GOOGLE_SHARED_DRIVE_ID`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_RANGE` และ
`GOOGLE_VISION_ENABLED` เฉพาะฟังก์ชันที่เปิดใช้งาน ห้ามใส่ค่าจริงใน GitHub.

## Current limitations

- OCR ช่วยอ่านข้อมูลแต่ไม่ยืนยันว่าเงินเข้าบัญชี ต้องตรวจสอบกับ statement/API ธนาคาร
- Password reset delivery ต้องเชื่อม provider ขององค์กรก่อนเปิดใช้งาน
- ต้องทำ security, privacy, accessibility และ disaster-recovery acceptance ในระบบจริง
