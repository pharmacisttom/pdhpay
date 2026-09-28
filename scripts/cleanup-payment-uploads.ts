import "dotenv/config";
import {db} from "../src/core/database/client";
import {GoogleDriveStorageService} from "../src/modules/payment/infrastructure/google-drive";
const storage=new GoogleDriveStorageService();
try{
 const stale=await db().paymentUpload.findMany({where:{state:{in:["RESERVED","UPLOADING","FAILED"]},updatedAt:{lt:new Date(Date.now()-3600000)}},take:100,orderBy:{updatedAt:"asc"}});
 let cleaned=0;
 for(const intent of stale){
  if(await db().paymentTransaction.findUnique({where:{submissionKey:intent.id},select:{id:true}}))continue;
  if(intent.driveFileId)await storage.delete(intent.driveFileId);
  await db().paymentUpload.updateMany({where:{id:intent.id,state:intent.state,updatedAt:intent.updatedAt},data:{state:"CLEANED"}});cleaned++;
 }
 console.log(JSON.stringify({event:"PAYMENT_UPLOAD_CLEANUP",cleaned}));
}catch{console.error(JSON.stringify({event:"PAYMENT_UPLOAD_CLEANUP_FAILED"}));process.exitCode=1;}finally{await db().$disconnect();}
