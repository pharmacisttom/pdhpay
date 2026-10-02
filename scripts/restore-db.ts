import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl) {
  console.error("❌ DATABASE_URL is not defined in environment.");
  process.exit(1);
}

const backupFile = process.argv[2];
if (!backupFile) {
  console.error("❌ Please provide a backup SQL file path.");
  console.error("   Example: npx tsx scripts/restore-db.ts backups/pdhpay_backup_2026-10-01.sql");
  process.exit(1);
}

const fullBackupPath = path.isAbsolute(backupFile)
  ? backupFile
  : path.join(process.cwd(), backupFile);

if (!fs.existsSync(fullBackupPath)) {
  console.error(`❌ Backup file not found: ${fullBackupPath}`);
  process.exit(1);
}

try {
  const url = new URL(dbUrl);
  const host = url.hostname || "127.0.0.1";
  const port = url.port || "3306";
  const username = decodeURIComponent(url.username || "root");
  const password = decodeURIComponent(url.password || "");
  const database = url.pathname.replace(/^\//, "");

  console.log(`⚠️  Restoring Database from ${fullBackupPath}...`);
  console.log(`   Target Database: ${database} @ ${host}:${port}`);

  const restoreCmd = `mysql -h ${host} -P ${port} -u ${username} -p"${password}" ${database} < "${fullBackupPath}"`;

  execSync(restoreCmd, { stdio: "inherit" });

  console.log(`✅ Database Restored Successfully!`);
} catch (error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("❌ Restore failed:", msg);
  process.exit(1);
}
