import { GoogleDriveStorageService } from "../infrastructure/google-drive";

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  pointCode?: string;
  date?: Date;
  uploadId?: string;
}

export async function uploadSlipToDrive(options: UploadOptions) {
  const service = new GoogleDriveStorageService();
  const fileId = await service.allocateId();
  const pointCode = options.pointCode || "GENERAL";
  const date = options.date || new Date();
  const uploadId = options.uploadId || fileId;

  const result = await service.upload({
    id: fileId,
    name: options.filename,
    bytes: options.buffer,
    mime: options.mimeType,
    pointCode,
    date,
    uploadId,
  });

  return {
    driveFileId: result.driveFileId,
    driveFolderId: result.driveFolderId,
  };
}
