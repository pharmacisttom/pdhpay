import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { db } from "../src/core/database/client";

async function main() {
  const folderId = "1ljSm9X79onx1bjnkdn41E0x4SfjZskjC";
  console.log(`🚀 Updating Google Drive Folder ID to: ${folderId}`);

  // 1. Update Database SystemSettings for organization pdh
  const org = await db().organization.findFirst({
    where: { slug: "pdh" },
  });

  if (!org) {
    console.error("❌ Organization 'pdh' not found.");
    process.exit(1);
  }

  await db().systemSetting.upsert({
    where: { scope_key: { scope: org.id, key: "GOOGLE_DRIVE_FOLDER_ID" } },
    create: {
      scope: org.id,
      organizationId: org.id,
      key: "GOOGLE_DRIVE_FOLDER_ID",
      value: folderId,
    },
    update: {
      value: folderId,
    },
  });

  console.log("✅ Updated SystemSetting in MySQL database.");

  // 2. Update .env files
  const envFiles = [".env", ".env.development", ".env.production"];

  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, "utf-8");

      if (content.includes("GOOGLE_DRIVE_FOLDER_ID=")) {
        content = content.replace(/GOOGLE_DRIVE_FOLDER_ID=.*$/m, `GOOGLE_DRIVE_FOLDER_ID="${folderId}"`);
      } else {
        content += `\nGOOGLE_DRIVE_FOLDER_ID="${folderId}"\n`;
      }

      fs.writeFileSync(filePath, content, "utf-8");
      console.log(`✅ Updated ${file}`);
    }
  }

  process.env.GOOGLE_DRIVE_FOLDER_ID = folderId;
  console.log("🎉 Google Drive Folder ID configuration completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
