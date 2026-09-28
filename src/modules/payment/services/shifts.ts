import {db} from "@/core/database/client";
import {requirePermission,type Context} from "@/core/auth/authorization";
import {AppError,missing} from "@/core/errors";
import {audit} from "@/modules/audit/service";
import {Prisma} from "@/generated/prisma/client";
import {pointScope} from "./points";
import {today} from "../queries/transactions";
export async function shiftTotals(tx:Prisma.TransactionClient,ctx:Context,id:string){
 const where={organizationId:ctx.organizationId,shiftId:id};
 const all=await tx.paymentTransaction.aggregate({where,_count:true,_sum:{declaredAmount:true}});
 const verified=await tx.paymentTransaction.aggregate({where:{...where,status:{in:["VERIFIED","RECEIPTED"]}},_sum:{verifiedAmount:true}});
 const receipted=await tx.paymentTransaction.aggregate({where:{...where,status:"RECEIPTED"},_sum:{verifiedAmount:true}});
 const declared=all._sum.declaredAmount??new Prisma.Decimal(0),amount=verified._sum.verifiedAmount??new Prisma.Decimal(0);
 return {transactionCount:all._count,declaredAmount:declared,verifiedAmount:amount,receiptAmount:receipted._sum.verifiedAmount??new Prisma.Decimal(0),differenceAmount:declared.sub(amount)};
}
export async function openShift(ctx:Context,input:{paymentPointId:string;shiftName:string},requestId?:string){
 requirePermission(ctx,"payment.shift.open");
 return db().$transaction(async tx=>{
  const point=await tx.paymentPoint.findFirst({where:{id:input.paymentPointId,...pointScope(ctx)},include:{bankAccount:true}});
  if(!point)missing();
  await tx.$queryRaw`SELECT id FROM PaymentPoint WHERE id=${point.id} AND organizationId=${ctx.organizationId} FOR UPDATE`;
  if(point.status!=="ACTIVE"||!point.bankAccount.active)throw new AppError("CONFLICT",409,"จุดหรือบัญชีรับเงินยังไม่เปิดใช้งาน");
  const shift=await tx.paymentShift.create({data:{organizationId:ctx.organizationId,paymentPointId:point.id,shiftName:input.shiftName,shiftDate:new Date(today()+"T00:00:00Z"),startTime:new Date(),openedBy:ctx.userId}});
  await audit(tx,ctx,"SHIFT_OPENED","paymentShift",shift.id,"SUCCESS",{requestId,newStatus:"OPEN"});
  return shift;
 });
}
export async function changeShift(ctx:Context,id:string,action:string,version:number,requestId?:string){
 if(!["close","lock","reopen"].includes(action))throw new AppError("NOT_FOUND",404,"ไม่พบคำสั่ง");
 requirePermission(ctx,action==="reopen"?"payment.shift.reopen":"payment.shift.close");
 return db().$transaction(async tx=>{
  const found=await tx.paymentShift.findFirst({where:{id,organizationId:ctx.organizationId,point:pointScope(ctx)}});
  if(!found)missing();
  await tx.$queryRaw`SELECT id FROM PaymentPoint WHERE id=${found.paymentPointId} AND organizationId=${ctx.organizationId} FOR UPDATE`;
  const row=await tx.paymentShift.findUniqueOrThrow({where:{id}});
  if(row.version!==version||(action==="close"&&row.status!=="OPEN")||(action==="lock"&&row.status!=="CLOSED")||(action==="reopen"&&row.status==="OPEN"))throw new AppError("CONFLICT",409,"สถานะกะเปลี่ยนแล้ว กรุณาโหลดใหม่");
  const status=action==="reopen"?"OPEN":action==="lock"?"LOCKED":"CLOSED";
  const totals=await shiftTotals(tx,ctx,id);
  await tx.paymentShift.update({where:{id},data:{...totals,status,openSlot:status==="OPEN"?1:null,version:{increment:1},closedBy:status==="OPEN"?null:ctx.userId,closedAt:status==="OPEN"?null:new Date(),endTime:status==="OPEN"?null:new Date()}});
  await audit(tx,ctx,action==="reopen"?"SHIFT_REOPENED":action==="lock"?"SHIFT_LOCKED":"SHIFT_CLOSED","paymentShift",id,"SUCCESS",{requestId,oldStatus:row.status,newStatus:status,version:version+1});
  return {id,status,...totals};
 });
}
export async function listShifts(ctx:Context){
 requirePermission(ctx,"payment.dashboard.read");
 return db().paymentShift.findMany({where:{organizationId:ctx.organizationId,point:pointScope(ctx)},include:{point:{select:{name:true}}},orderBy:{openedAt:"desc"},take:100});
}
export async function previewShift(ctx:Context,id:string){
 requirePermission(ctx,"payment.dashboard.read");
 const row=await db().paymentShift.findFirst({where:{id,organizationId:ctx.organizationId,point:pointScope(ctx)}});
 if(!row)missing();return {...row,...await shiftTotals(db(),ctx,id)};
}
