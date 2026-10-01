import fs from "fs";
import path from "path";

const src = "C:/Users/ACER/.gemini/antigravity-ide/brain/tempmediaStorage/media_1790867606742.jpg";
const destArtifact = "C:/Users/ACER/.gemini/antigravity-ide/brain/bec2082d-4261-405a-8f3d-be7b5e827fd0/krungthai_slip_test.jpg";
const destPublic = path.join(process.cwd(), "public", "uploads", "slips", "krungthai-slip-40.jpg");

try {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, destArtifact);
    fs.copyFileSync(src, destPublic);
    console.log("✅ Successfully copied user uploaded slip!");
  } else {
    console.log("⚠️ Source path does not exist directly via node, looking for alternatives.");
  }
} catch (e: any) {
  console.error("Copy error:", e.message);
}
