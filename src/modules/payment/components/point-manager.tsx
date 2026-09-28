"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import { useEffect,useState } from "react";
import Swal from "sweetalert2";
import { api,confirmAction,showError } from "./api";
type Point={id:string;code:string;name:string;status:string;description?:string|null;department?:string|null;location?:string|null;bankAccountId:string;openTime?:string|null;closeTime?:string|null;updatedAt:string;users:{userId:string}[]};
type Lookups={banks:{id:string;bankName:string;code:string;active:boolean}[];users:{id:string;displayName:string}[]};
export function PointManager({pointId,mode="list"}:{pointId?:string;mode?:"list"|"new"|"edit"|"detail"}){
 const router=useRouter();
 const [rows,setRows]=useState<Point[]>([]),[point,setPoint]=useState<Point|null>(null),[lookups,setLookups]=useState<Lookups>({banks:[],users:[]}),[page,setPage]=useState(1),[total,setTotal]=useState(0),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{let live=true;Promise.all([api<{items:Point[];total:number}>("points?page="+page),api<Lookups>("lookups"),pointId?api<Point>("points/"+pointId):Promise.resolve(null)]).then(([r,l,p])=>{if(live){setRows(r.items);setTotal(r.total);setLookups(l);setPoint(p);}}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[pointId,page]);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const f=new FormData(event.currentTarget);if(!await confirmAction("บันทึกจุดชำระเงิน?"))return;setBusy(true);
  try{const data={code:f.get("code"),name:f.get("name"),description:f.get("description"),department:f.get("department"),location:f.get("location"),bankAccountId:f.get("bankAccountId"),status:f.get("status"),openTime:f.get("openTime")||null,closeTime:f.get("closeTime")||null,...(point?{expectedUpdatedAt:point.updatedAt}:{})};
   const result=await api<{id:string}>("points"+(pointId?"/"+pointId:""),pointId?"PATCH":"POST",data);router.push("/admin/payment-points/"+result.id);
  }catch(e){await showError(e);}finally{setBusy(false);}
 }
 async function staff(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!point||!await confirmAction("บันทึกเจ้าหน้าที่ประจำจุด?"))return;try{await api("points/"+point.id+"/staff","POST",{userIds:new FormData(event.currentTarget).getAll("userIds"),expectedUpdatedAt:point.updatedAt});setPoint(await api<Point>("points/"+point.id));await Swal.fire("บันทึกแล้ว","","success");}catch(e){await showError(e);}}
 return <section><h1>จุดชำระเงิน</h1><p><Link href="/admin/payment-points">รายการจุด</Link> · <Link href="/admin/payment-points/new">เพิ่มจุด</Link> · <Link href="/admin/payment-banks">บัญชีรับเงิน</Link></p>{error&&<p role="alert">{error}</p>}
 {mode==="list"?<><table><thead><tr><th>รหัส</th><th>จุดชำระเงิน</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td>{p.status}</td><td><Link href={"/admin/payment-points/"+p.id}>เปิด</Link></td></tr>)}</tbody></table>{!rows.length&&<p>ยังไม่มีรายการ</p>}<button disabled={page===1} onClick={()=>setPage(page-1)}>ก่อนหน้า</button> หน้า {page} <button disabled={page*20>=total} onClick={()=>setPage(page+1)}>ถัดไป</button></>:
 mode==="detail"&&point?<><h2>{point.name}</h2><p>{point.code} · {point.status} · {point.location}</p><p><Link href={"/admin/payment-points/"+point.id+"/edit"}>แก้ไข</Link> · <Link href={"/admin/payment-points/"+point.id+"/qr"}>พิมพ์ QR</Link></p>
 <button onClick={async()=>{if(await confirmAction("เปลี่ยน QR? QR เดิมจะใช้ไม่ได้ทันที"))try{await api("points/"+point.id+"/rotate","POST",{});await Swal.fire("เปลี่ยน QR แล้ว","","success");}catch(e){await showError(e);}}}>เปลี่ยน QR token</button>
 <form key={point.updatedAt} onSubmit={staff}><h2>เจ้าหน้าที่ประจำจุด</h2>{lookups.users.map(u=><label key={u.id}><input type="checkbox" name="userIds" value={u.id} defaultChecked={point.users.some(a=>a.userId===u.id)}/>{u.displayName}</label>)}<button>บันทึกเจ้าหน้าที่</button></form></>:
 (mode==="new"||point)&&<form className="form-stack" key={point?.updatedAt??"new"} onSubmit={submit}>
 {(["code","name","description","department","location"] as const).map((k,i)=><label key={k}>{["รหัสจุด (A-Z)","ชื่อจุด","รายละเอียด","แผนก","สถานที่"][i]}<input name={k} required={i<2} maxLength={k==="code"?40:k==="description"?500:160} defaultValue={point?.[k]??""}/></label>)}
 <label>บัญชีรับเงิน<select name="bankAccountId" required defaultValue={point?.bankAccountId}>{lookups.banks.map(b=><option key={b.id} value={b.id}>{b.code} · {b.bankName}{!b.active?" (ปิดใช้งาน)":""}</option>)}</select></label>
 <label>สถานะ<select name="status" defaultValue={point?.status??"INACTIVE"}>{["ACTIVE","INACTIVE","TEMPORARILY_CLOSED","MAINTENANCE"].map(s=><option key={s}>{s}</option>)}</select></label>
 <label>เวลาเปิด<input type="time" name="openTime" defaultValue={point?.openTime??""}/></label><label>เวลาปิด<input type="time" name="closeTime" defaultValue={point?.closeTime??""}/></label><button disabled={busy}>บันทึก</button></form>}</section>;
}
