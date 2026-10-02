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

try {
  const url = new URL(dbUrl);
  const host = url.hostname || "127.0.0.1";
  const port = url.port || "3306";
  const username = decodeURIComponent(url.username || "root");
  const password = decodeURIComponent(url.password || "");
  const database = url.pathname.replace(/^\//, "");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, `pdhpay_backup_${database}_${timestamp}.sql`);

  console.log(`📦 Starting MySQL Database Backup...`);
  console.log(`   Database: ${database} @ ${host}:${port}`);
  console.log(`   Output:   ${backupPath}`);

  // Use mysqldump command
  const dumpCmd = `mysqldump -h ${host} -P ${port} -u ${username} -p"${password}" --routines --triggers --single-transaction ${database} > "${backupPath}"`;

  execSync(dumpCmd, { stdio: "inherit" });

  const stats = fs.statSync(backupPath);
  console.log(`✅ Backup Completed Successfully! File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
} catch (error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("❌ Backup failed:", msg);
  process.exit(1);
}
