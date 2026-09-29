import sharp from "sharp";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import { createHash } from "node:crypto";
import { AppError } from "@/core/errors";
export const MAX_SLIP_BYTES = 5 * 1024 * 1024;
export async function validateSlip(file: File) {
  const bad = () =>
    new AppError(
      "INVALID_FILE",
      400,
      "ไฟล์ไม่ถูกต้อง รองรับ JPG, PNG, WEBP หรือ PDF ขนาดไม่เกิน 5 MB",
    );
  if (!file.size || file.size > MAX_SLIP_BYTES || file.name.length > 255)
    throw bad();
  let bytes = Buffer.from(await file.arrayBuffer());
  let ext = "",
    mime = "";
  if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
    ext = "jpg";
    mime = "image/jpeg";
  } else if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    ext = "png";
    mime = "image/png";
  } else if (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP"
  ) {
    ext = "webp";
    mime = "image/webp";
  } else if (bytes.subarray(0, 5).toString() === "%PDF-") {
    ext = "pdf";
    mime = "application/pdf";
  }
  if (
    !ext ||
    !new RegExp("\\." + (ext === "jpg" ? "jpe?g" : ext) + "$", "i").test(
      file.name,
    ) ||
    file.type !== mime
  )
    throw bad();
  try {
    if (ext === "pdf") {
      if (!bytes.subarray(-1024).toString().includes("%%EOF")) throw bad();
      const doc = await PDFDocument.load(bytes, {
        ignoreEncryption: false,
        throwOnInvalidObject: true,
      });
      if (doc.getPageCount() < 1 || doc.getPageCount() > 10) throw bad();
      for (const [, object] of doc.context.enumerateIndirectObjects()) {
        if (object instanceof PDFDict)
          for (const [key, value] of object.entries()) {
            if (
              [
                "/JS",
                "/JavaScript",
                "/OpenAction",
                "/AA",
                "/EmbeddedFiles",
                "/Launch",
                "/XFA",
                "/RichMedia",
              ].includes(key.toString()) ||
              (key === PDFName.of("S") &&
                [
                  "/JavaScript",
                  "/Launch",
                  "/SubmitForm",
                  "/ImportData",
                ].includes(value.toString()))
            )
              throw bad();
          }
      }
    } else {
      const decoder = sharp(bytes, {
        limitInputPixels: 24000000,
        failOn: "warning",
      });
      const metadata = await decoder.metadata();
      if ((metadata.pages ?? 1) > 1) throw bad();
      await decoder.raw().toBuffer();
      // Decode and re-encode before storage to strip EXIF, GPS, comments and
      // trailing payloads instead of trusting the source image container.
      if (ext === "jpg")
        bytes = await decoder
          .rotate()
          .jpeg({ quality: 92, mozjpeg: true })
          .toBuffer();
      else if (ext === "png")
        bytes = await decoder.rotate().png({ compressionLevel: 9 }).toBuffer();
      else bytes = await decoder.rotate().webp({ quality: 92 }).toBuffer();
    }
  } catch {
    throw bad();
  }
  return {
    bytes,
    ext,
    mime,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
