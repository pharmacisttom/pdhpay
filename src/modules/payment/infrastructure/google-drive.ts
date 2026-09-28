import { JWT } from "google-auth-library";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "@/core/errors";
import type { SlipStorage, StoredSlip } from "./storage";
const config = z.object({
  GOOGLE_CLIENT_EMAIL: z.email(),
  GOOGLE_PRIVATE_KEY: z.string().min(64),
  GOOGLE_DRIVE_FOLDER_ID: z.string().regex(/^[\w-]+$/),
  GOOGLE_SHARED_DRIVE_ID: z
    .string()
    .regex(/^[\w-]+$/)
    .optional(),
});
export function googleDriveConfigured() {
  return config.safeParse({
    ...process.env,
    GOOGLE_SHARED_DRIVE_ID: process.env.GOOGLE_SHARED_DRIVE_ID || undefined,
  }).success;
}
export class GoogleDriveStorageService implements SlipStorage {
  private configuration() {
    const parsed = config.safeParse({
      ...process.env,
      GOOGLE_SHARED_DRIVE_ID: process.env.GOOGLE_SHARED_DRIVE_ID || undefined,
    });
    if (!parsed.success)
      throw new AppError(
        "STORAGE_UNAVAILABLE",
        503,
        "ระบบจัดเก็บยังไม่พร้อม กรุณาติดต่อเจ้าหน้าที่",
      );
    return parsed.data;
  }
  private async request(path: string, init: RequestInit = {}) {
    const c = this.configuration();
    const client = new JWT({
      email: c.GOOGLE_CLIENT_EMAIL,
      key: c.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    try {
      const token = await client.getAccessToken();
      const response = await fetch("https://www.googleapis.com/" + path, {
        ...init,
        headers: { ...init.headers, Authorization: "Bearer " + token.token },
        signal: AbortSignal.timeout(20000),
        cache: "no-store",
      });
      if (!response.ok && response.status !== 204)
        throw new Error("Drive request failed");
      return response;
    } catch {
      throw new AppError(
        "STORAGE_UNAVAILABLE",
        503,
        "ไม่สามารถติดต่อระบบจัดเก็บ กรุณาลองใหม่หรือติดต่อเจ้าหน้าที่",
      );
    }
  }
  async healthCheck() {
    const c = this.configuration();
    const folder = z
      .object({
        id: z.string(),
        name: z.string(),
        mimeType: z.string(),
        trashed: z.boolean().default(false),
      })
      .parse(
        await (
          await this.request(
            "drive/v3/files/" +
              encodeURIComponent(c.GOOGLE_DRIVE_FOLDER_ID) +
              "?supportsAllDrives=true&fields=id,name,mimeType,trashed",
          )
        ).json(),
      );
    const permissions = z
      .object({ permissions: z.array(z.object({ type: z.string() })) })
      .parse(
        await (
          await this.request(
            "drive/v3/files/" +
              encodeURIComponent(c.GOOGLE_DRIVE_FOLDER_ID) +
              "/permissions?supportsAllDrives=true&fields=permissions(type)",
          )
        ).json(),
      );
    const privateFolder = !permissions.permissions.some((p) =>
      ["anyone", "domain"].includes(p.type),
    );
    if (
      folder.trashed ||
      folder.mimeType !== "application/vnd.google-apps.folder" ||
      !privateFolder
    )
      throw new AppError(
        "STORAGE_UNAVAILABLE",
        503,
        "โฟลเดอร์ Google Drive ไม่พร้อมหรือไม่ได้จำกัดสิทธิ์",
      );
    return {
      connected: true,
      folderName: folder.name,
      privateFolder,
      sharedDrive: !!c.GOOGLE_SHARED_DRIVE_ID,
    };
  }
  async allocateId() {
    const response = await this.request(
      "drive/v3/files/generateIds?count=1&space=drive",
    );
    const result = z
      .object({ ids: z.array(z.string()).min(1) })
      .parse(await response.json());
    return result.ids[0];
  }
  private async folder(parent: string, name: string) {
    const c = this.configuration();
    const params = new URLSearchParams({
      q:
        "'" +
        parent +
        "' in parents and name = '" +
        name.replace(/'/g, "\\'") +
        "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id)",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      pageSize: "1",
    });
    if (c.GOOGLE_SHARED_DRIVE_ID) {
      params.set("corpora", "drive");
      params.set("driveId", c.GOOGLE_SHARED_DRIVE_ID);
    }
    const found = z
      .object({ files: z.array(z.object({ id: z.string() })) })
      .parse(await (await this.request("drive/v3/files?" + params)).json());
    if (found.files[0]) return found.files[0].id;
    const created = await this.request(
      "drive/v3/files?supportsAllDrives=true&fields=id",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parent],
        }),
      },
    );
    return z.object({ id: z.string() }).parse(await created.json()).id;
  }
  async upload(
    input: Parameters<SlipStorage["upload"]>[0],
  ): Promise<StoredSlip> {
    const c = this.configuration();
    const permissions = z
      .object({ permissions: z.array(z.object({ type: z.string() })) })
      .parse(
        await (
          await this.request(
            "drive/v3/files/" +
              encodeURIComponent(c.GOOGLE_DRIVE_FOLDER_ID) +
              "/permissions?supportsAllDrives=true&fields=permissions(type)",
          )
        ).json(),
      );
    if (
      permissions.permissions.some((p) => ["anyone", "domain"].includes(p.type))
    )
      throw new AppError(
        "STORAGE_UNAVAILABLE",
        503,
        "โฟลเดอร์จัดเก็บต้องจำกัดสิทธิ์การเข้าถึง",
      );
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(input.date);
    let folder = c.GOOGLE_DRIVE_FOLDER_ID;
    for (const part of [...date.split("-"), input.pointCode])
      folder = await this.folder(folder, part);
    const boundary = "pdh_" + randomUUID();
    const metadata = {
      id: input.id,
      name: input.name,
      parents: [folder],
      appProperties: { pdhUploadId: input.uploadId },
    };
    const payload = Buffer.concat([
      Buffer.from(
        "--" +
          boundary +
          "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
          JSON.stringify(metadata) +
          "\r\n--" +
          boundary +
          "\r\nContent-Type: " +
          input.mime +
          "\r\n\r\n",
      ),
      input.bytes,
      Buffer.from("\r\n--" + boundary + "--\r\n"),
    ]);
    const response = await this.request(
      "upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id",
      {
        method: "POST",
        headers: { "Content-Type": "multipart/related; boundary=" + boundary },
        body: payload,
      },
    );
    const file = z.object({ id: z.string() }).parse(await response.json());
    return { driveFileId: file.id, driveFolderId: folder };
  }
  async download(id: string) {
    const response = await this.request(
      "drive/v3/files/" +
        encodeURIComponent(id) +
        "?alt=media&supportsAllDrives=true",
    );
    const reader = response.body?.getReader();
    if (!reader) throw new AppError("STORAGE_UNAVAILABLE", 503, "ไม่พบไฟล์");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 5 * 1024 * 1024) {
        await reader.cancel();
        throw new AppError("STORAGE_UNAVAILABLE", 503, "ไฟล์เกินขนาดที่กำหนด");
      }
      chunks.push(part.value);
    }
    return Buffer.concat(chunks);
  }
  async delete(id: string) {
    await this.request(
      "drive/v3/files/" + encodeURIComponent(id) + "?supportsAllDrives=true",
      { method: "DELETE" },
    );
  }
}
