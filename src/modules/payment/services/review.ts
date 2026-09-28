import {db} from "@/core/database/client";
import {requirePermission,type Context} from "@/core/auth/authorization";
import {missing,AppError} from "@/core/errors";
import {audit} from "@/modules/audit/service";
import {Prisma} from "@/generated/prisma/client";
import type {PaymentStatus} from "@/generated/prisma/enums";
import {pointScope} from "./points";
import type {reviewInput} from "../validators";
import type {z} from "zod";
import type {SlipStorage} from "../infrastructure/storage";
export async function paymentDetail(ctx:Context,id:string,requestId?:string){
 requirePermission(ctx,"payment.transaction.read");
 return db().$transaction(async tx=>{
  const row=await tx.paymentTransaction.findFirst({where:{id,organizationId:ctx.organizationId,point:pointScope(ctx)},include:{
   point:{select:{id:true,name:true,code:true}},shift:{select:{id:true,shiftName:true,status:true}},
   verifier:{select:{displayName:true}},receipter:{select:{displayName:true}},
   slips:{select:{id:true,storedFilename:true,mimeType:true,fileSize:true,extraction:{select:{status:true,amount:true,transferAt:true,bankName:true,reference:true,confidence:true,errorCode:true,processedAt:true}}}},
   statusHistory:{take:100,orderBy:{version:"desc"},include:{actor:{select:{displayName:true}}}},
  }});
  if(!row)missing();
  await audit(tx,ctx,"PAYMENT_VIEWED","payment",id,"SUCCESS",{requestId});
  const auditRows=ctx.permissions.includes("payment.audit.read")?await tx.auditLog.findMany({where:{organizationId:ctx.organizationId,resourceType:"payment",resourceId:id},take:100,orderBy:{createdAt:"desc"},select:{action:true,createdAt:true,actorUserId:true,metadata:true}}):[];
  return {...row,audit:auditRows};
 });
}
export async function reviewPayment(ctx:Context,id:string,action:string,input:z.infer<typeof reviewInput>,requestId?:string){
 const permissions:Record<string,string>={verify:"payment.transaction.verify",correct:"payment.transaction.correct",reject:"payment.transaction.reject",flag:"payment.transaction.correct",receipt:"payment.receipt.create",reconcile:"payment.reconciliation.manage"};
 if(!permissions[action])throw new AppError("NOT_FOUND",404,"ไม่พบคำสั่ง");
 requirePermission(ctx,permissions[action]);
 if(input.status==="CANCELLED")requirePermission(ctx,"payment.transaction.reject");
 return db().$transaction(async tx=>{
  const found=await tx.paymentTransaction.findFirst({where:{id,organizationId:ctx.organizationId,point:pointScope(ctx)},select:{paymentPointId:true}});
  if(!found)missing();
  await tx.$queryRaw`SELECT id FROM PaymentPoint WHERE id=${found.paymentPointId} AND organizationId=${ctx.organizationId} FOR UPDATE`;
  const row=await tx.paymentTransaction.findFirstOrThrow({where:{id,organizationId:ctx.organizationId},include:{shift:true}});
  if(!row.shift||row.shift.status!=="OPEN")throw new AppError("CONFLICT",409,"กะปิดหรือล็อกแล้ว ต้องเปิดกะอีกครั้งก่อนแก้ไข");
  if(row.version!==input.version)throw new AppError("CONFLICT",409,"รายการเปลี่ยนแล้ว กรุณาโหลดข้อมูลใหม่");
  if(["REJECTED","CANCELLED"].includes(row.status)||(row.status==="RECEIPTED"&&action!=="reconcile"))throw new AppError("CONFLICT",409,"สถานะนี้ไม่อนุญาตให้แก้ไข");
  let status:PaymentStatus=row.status;
  const data:Prisma.PaymentTransactionUncheckedUpdateInput={version:{increment:1}};
  if(action==="verify"||action==="correct"){
   if(action==="verify"&&row.status==="VERIFIED")throw new AppError("CONFLICT",409,"รายการยืนยันแล้ว");
   if(!input.amount)throw new AppError("INVALID_INPUT",400,"กรุณาระบุยอดที่ตรวจสอบ");
   if((action==="correct"||["POSSIBLE_DUPLICATE","INVALID_SLIP"].includes(row.status))&&!input.reason)throw new AppError("INVALID_INPUT",400,"กรุณาระบุเหตุผล");
   const amount=new Prisma.Decimal(input.amount);
   status=amount.equals(row.declaredAmount)?"VERIFIED":"AMOUNT_MISMATCH";
   Object.assign(data,{verifiedAmount:amount,verifiedBy:ctx.userId,verifiedAt:new Date()});
  }else if(action==="receipt"){
   if(row.status!=="VERIFIED"||!row.verifiedAmount||!input.receiptNo)throw new AppError("CONFLICT",409,"ต้องยืนยันยอดและระบุเลขใบเสร็จก่อน");
   status="RECEIPTED";Object.assign(data,{receiptNo:input.receiptNo,receiptedBy:ctx.userId,receiptedAt:new Date()});
  }else if(action==="reconcile"){
   if(!input.reconciliationStatus||!input.reason)throw new AppError("INVALID_INPUT",400,"กรุณาระบุผลกระทบยอดและเหตุผล");
   data.reconciliationStatus=input.reconciliationStatus;
  }else{
   if(!input.reason)throw new AppError("INVALID_INPUT",400,"กรุณาระบุเหตุผล");
   if(action==="flag"&&!input.status)throw new AppError("INVALID_INPUT",400,"กรุณาระบุสถานะ");
   status=action==="reject"?"REJECTED":input.status!;
  }
  data.status=status;
  const changed=await tx.paymentTransaction.updateMany({where:{id,organizationId:ctx.organizationId,version:input.version},data});
  if(changed.count!==1)throw new AppError("CONFLICT",409,"รายการเปลี่ยนแล้ว กรุณาโหลดใหม่");
  await tx.paymentStatusHistory.create({data:{organizationId:ctx.organizationId,paymentTransactionId:id,version:row.version+1,fromStatus:row.status,toStatus:status,changedBy:ctx.userId,reason:input.reason}});
  const actions:Record<string,string>={verify:"PAYMENT_VERIFIED",correct:"PAYMENT_AMOUNT_CHANGED",reject:"PAYMENT_REJECTED",receipt:"PAYMENT_RECEIPTED",flag:"PAYMENT_FLAGGED",reconcile:"PAYMENT_RECONCILED"};
  await audit(tx,ctx,actions[action],"payment",id,"SUCCESS",{requestId,oldStatus:row.status,newStatus:status,oldAmount:row.verifiedAmount?.toFixed(2),newAmount:input.amount,version:row.version+1});
  return {id,status,version:row.version+1};
 });
}
export async function slipResponse(ctx:Context,id:string,storage:SlipStorage,requestId?:string){
 requirePermission(ctx,"payment.transaction.read");
 const slip=await db().paymentSlip.findFirst({where:{id,organizationId:ctx.organizationId,transaction:{point:pointScope(ctx)}}});
 if(!slip)missing();
 await audit(db(),ctx,"SLIP_VIEWED","payment",slip.paymentTransactionId,"SUCCESS",{requestId});
 const bytes=await storage.download(slip.driveFileId);
 return new Response(new Uint8Array(bytes),{headers:{"Content-Type":slip.mimeType,"Content-Disposition":"inline; filename=\""+slip.storedFilename.replace(/[^A-Za-z0-9_.-]/g,"_")+"\"","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox","Cache-Control":"no-store"}});
}
