import {z} from "zod";
import {db} from "@/core/database/client";
import {requirePermission,type Context} from "@/core/auth/authorization";
import {Prisma} from "@/generated/prisma/client";
import {PaymentStatus} from "@/generated/prisma/enums";
import {pointScope} from "../services/points";
export const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Bangkok",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
export const filters=z.object({
 from:date.default(today),to:date.default(today),fromTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("00:00"),toTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("23:59"),
 page:z.coerce.number().int().min(1).max(10000).default(1),limit:z.coerce.number().int().min(1).max(100).default(20),
 sort:z.enum(["newest","oldest","amount"]).default("newest"),q:z.string().max(100).default(""),hn:z.string().max(40).optional(),paymentNo:z.string().max(32).optional(),
 point:z.uuid().optional(),bank:z.string().max(120).optional(),status:z.enum(PaymentStatus).optional(),officer:z.uuid().optional(),shift:z.uuid().optional(),
}).strict().refine(p=>p.from<=p.to && (Date.parse(p.to)-Date.parse(p.from))/86400000<=366,"ช่วงวันที่ต้องไม่เกิน 366 วัน");
export type Filters=z.infer<typeof filters>;
export function paymentWhere(ctx:Context,p:Filters,report=false):Prisma.PaymentTransactionWhereInput{
 return {organizationId:ctx.organizationId,...(report&&ctx.permissions.includes("payment.report.read")?{}:{point:pointScope(ctx)}),
 submittedAt:{gte:new Date(p.from+"T"+p.fromTime+":00+07:00"),lte:new Date(p.to+"T"+p.toTime+":59.999+07:00")},
 ...(p.point?{paymentPointId:p.point}:{}),...(p.bank?{sourceBank:p.bank}:{}),...(p.status?{status:p.status}:{}),
 ...(p.officer?{verifiedBy:p.officer}:{}),...(p.shift?{shiftId:p.shift}:{}),...(p.hn?{hn:p.hn}:{}),...(p.paymentNo?{paymentNo:p.paymentNo}:{}),
 ...(p.q?{OR:[{hn:{contains:p.q}},{paymentNo:{contains:p.q}},{patientName:{contains:p.q}}]}:{}),
 };
}
export async function listPayments(ctx:Context,p:Filters){
 requirePermission(ctx,"payment.transaction.read");const where=paymentWhere(ctx,p);
 const [items,total]=await db().$transaction([
 db().paymentTransaction.findMany({where,select:{id:true,paymentNo:true,hn:true,patientName:true,submittedAt:true,declaredAmount:true,verifiedAmount:true,sourceBank:true,status:true,version:true,point:{select:{name:true}},verifier:{select:{displayName:true}}},orderBy:p.sort==="amount"?[{declaredAmount:"desc"},{id:"desc"}]:[{submittedAt:p.sort==="oldest"?"asc":"desc"},{id:"desc"}],skip:(p.page-1)*p.limit,take:p.limit}),
 db().paymentTransaction.count({where})]);return {items,total,page:p.page,limit:p.limit};
}
export async function summary(ctx:Context,p:Filters){
 requirePermission(ctx,"payment.dashboard.read");
 const groups=await db().paymentTransaction.groupBy({by:["status"],where:paymentWhere(ctx,p,true),_count:true,_sum:{declaredAmount:true,verifiedAmount:true}});
 const zero=new Prisma.Decimal(0);
 return {count:groups.reduce((a,g)=>a+g._count,0),declared:groups.reduce((a,g)=>a.add(g._sum.declaredAmount??zero),zero).toFixed(2),
 verified:groups.filter(g=>["VERIFIED","RECEIPTED"].includes(g.status)).reduce((a,g)=>a.add(g._sum.verifiedAmount??zero),zero).toFixed(2),groups:groups.map(g=>({status:g.status,count:g._count,declared:g._sum.declaredAmount?.toFixed(2)??"0.00",verified:g._sum.verifiedAmount?.toFixed(2)??"0.00"}))};
}
