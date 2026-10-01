import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "../src/core/database/client";

async function main() {
  console.log("🚀 Creating production test transaction with uploaded Krungthai slip...");

  const candidatePaths = [
    "C:\\Users\\ACER\\.gemini\\antigravity-ide\\brain\\tempmediaStorage\\media_1790867606742.jpg",
    "C:/Users/ACER/.gemini/antigravity-ide/brain/tempmediaStorage/media_1790867606742.jpg",
    path.join(process.env.APPDATA || "", "..", ".gemini", "antigravity-ide", "brain", "tempmediaStorage", "media_1790867606742.jpg"),
  ];

  const publicUploadDir = path.join(process.cwd(), "public", "uploads", "slips");
  if (!fs.existsSync(publicUploadDir)) {
    fs.mkdirSync(publicUploadDir, { recursive: true });
  }

  const destImagePath = path.join(publicUploadDir, "krungthai-slip-40.jpg");
  const artifactDir = "C:\\Users\\ACER\\.gemini\\antigravity-ide\\brain\\bec2082d-4261-405a-8f3d-be7b5e827fd0";
  const artifactSlipPath = path.join(artifactDir, "krungthai-slip-40.jpg");

  let foundPath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  let sha256Hex = crypto.createHash("sha256").update("KrungthaiSlip40THB" + Date.now()).digest("hex");

  if (foundPath) {
    fs.copyFileSync(foundPath, destImagePath);
    console.log(`✅ Copied slip image to public: ${destImagePath}`);
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(foundPath, artifactSlipPath);
      console.log(`✅ Copied slip image to artifact dir: ${artifactSlipPath}`);
    }
    const fileBuffer = fs.readFileSync(destImagePath);
    sha256Hex = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  } else {
    console.warn(`⚠️ Source image file not found in candidates, using fallback placeholder.`);
  }

  // Find Organization and Payment Point (OPD)
  const org = await db().organization.findFirst({
    where: { slug: "pdh" },
  });

  if (!org) {
    console.error("❌ Organization 'pdh' not found.");
    process.exit(1);
  }

  const point = await db().paymentPoint.findFirst({
    where: { organizationId: org.id, code: "OPD" },
  });

  if (!point) {
    console.error("❌ Payment point 'OPD' not found.");
    process.exit(1);
  }

  const paymentNo = `PAY-${Date.now().toString().slice(-6)}`;
  const transferTime = new Date("2026-10-01T20:38:00+07:00");

  const txn = await db().paymentTransaction.create({
    data: {
      organizationId: org.id,
      paymentNo,
      paymentPointId: point.id,
      hn: "HN6901083",
      vn: "VN690812",
      patientName: "นายจตุพล ก***",
      payerName: "นายจตุพล ก***",
      payerPhone: "081-234-5678",
      declaredAmount: 40.00,
      verifiedAmount: 40.00,
      sourceBank: "ธนาคารกรุงไทย",
      transferDateTime: transferTime,
      status: "PENDING_VERIFY",
      reconciliationStatus: "MATCHED",
      note: "สลิปโอนเงินผ่าน Krungthai NEXT - รหัสอ้างอิง Ad7b2816318264463 (ปลายทาง: นางสาว ระพีพร นนทภาพ)",
      slips: {
        create: {
          driveFileId: `LOCAL-${Date.now()}`,
          driveFolderId: "LOCAL_TEST_FOLDER",
          storedFilename: "krungthai-slip-40.jpg",
          originalFilename: "media_1790867606742.jpg",
          mimeType: "image/jpeg",
          fileSize: fs.existsSync(destImagePath) ? fs.statSync(destImagePath).size : 124500,
          sha256: sha256Hex,
          extraction: {
            create: {
              status: "EXTRACTED",
              provider: "GOOGLE_VISION",
              amount: 40.00,
              transferAt: transferTime,
              bankName: "ธนาคารกรุงไทย",
              reference: "Ad7b2816318264463",
              confidence: 0.9850,
            },
          },
        },
      },
    },
    include: {
      slips: {
        include: {
          extraction: true,
        },
      },
    },
  });

  console.log("✅ Production test transaction created successfully!");
  console.log(`   Transaction ID: ${txn.id}`);
  console.log(`   Payment No:     ${txn.paymentNo}`);
  console.log(`   HN:             ${txn.hn}`);
  console.log(`   Patient Name:   ${txn.patientName}`);
  console.log(`   Declared Amount:${txn.declaredAmount} THB`);
  console.log(`   Ref Code:       Ad7b2816318264463`);
  console.log(`   Status:         ${txn.status}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
