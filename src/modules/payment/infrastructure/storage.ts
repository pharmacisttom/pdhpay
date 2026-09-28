export type StoredSlip={driveFileId:string;driveFolderId:string};
export interface SlipStorage{
 allocateId():Promise<string>;
 upload(input:{id:string;name:string;bytes:Buffer;mime:string;pointCode:string;date:Date;uploadId:string}):Promise<StoredSlip>;
 download(id:string):Promise<Uint8Array>;
 delete(id:string):Promise<void>;
}
