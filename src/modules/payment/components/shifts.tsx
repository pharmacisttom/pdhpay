"use client";
import {useEffect,useState} from "react";
import Swal from "sweetalert2";
import {api,confirmAction,showError} from "./api";
type Shift={id:string;shiftName:string;status:string;version:number;openedAt:string;transactionCount:number;declaredAmount:string;verifiedAmount:string;receiptAmount:string;differenceAmount:string;point:{name:string}};
export function Shifts({permissions}:{permissions:string[]}){
 const [rows,setRows]=useState<Shift[]>([]),[points,setPoints]=useState<{id:string;name:string}[]>([]),[error,setError]=useState("");
 useEffect(()=>{Promise.all([api<Shift[]>("shifts"),api<{points:{id:string;name:string}[]}>("filter-options")]).then(([r,p])=>{setRows(r);setPoints(p.points);}).catch(e=>setError(e.message));},[]);
 async function change(row:Shift,action:string){try{
 const preview=await api<Shift>("shifts/"+row.id);
 if(!(await Swal.fire({title:action==="reopen"?"เปิดกะอีกครั้ง?":action==="lock"?"ล็อกกะ?":"ปิดกะ?",text:"รายการ "+preview.transactionCount+" · แจ้ง "+preview.declaredAmount+" · ยืนยัน "+preview.verifiedAmount+" · ใบเสร็จ "+preview.receiptAmount+" · ส่วนต่าง "+preview.differenceAmount,showCancelButton:true,confirmButtonText:"ยืนยัน",cancelButtonText:"ยกเลิก"})).isConfirmed)return;
 await api("shifts/"+row.id+"/"+action,"POST",{version:row.version});setRows(await api<Shift[]>("shifts"));}catch(e){await showError(e);}}
 return <section><h1>กะรับชำระเงิน</h1>{error&&<p role="alert">{error}</p>}
 {permissions.includes("payment.shift.open")&&<form className="payment-filters" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(!await confirmAction("เปิดกะรับชำระเงิน?"))return;try{await api("shifts/open","POST",{paymentPointId:f.get("point"),shiftName:f.get("name")});setRows(await api<Shift[]>("shifts"));}catch(error){await showError(error);}}}><label>จุด<select required name="point">{points.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>ชื่อกะ<input name="name" required maxLength={120}/></label><button>เปิดกะ</button></form>}
 <p>แสดง 100 กะล่าสุด ยอดกะเปิดดูได้จากปุ่มสรุปก่อนปิดกะ</p><div className="table-scroll"><table><thead><tr>{["กะ","จุด","เริ่ม","สถานะ","จำนวน","ยอดแจ้ง","ยอดยืนยัน","ยอดใบเสร็จ","ส่วนต่าง","จัดการ"].map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.shiftName}</td><td>{r.point.name}</td><td>{new Date(r.openedAt).toLocaleString("th-TH")}</td><td>{r.status}</td><td>{r.transactionCount}</td><td>{r.declaredAmount}</td><td>{r.verifiedAmount}</td><td>{r.receiptAmount}</td><td>{r.differenceAmount}</td><td>{r.status==="OPEN"&&permissions.includes("payment.shift.close")&&<button onClick={()=>void change(r,"close")}>สรุป / ปิดกะ</button>}{r.status==="CLOSED"&&permissions.includes("payment.shift.close")&&<button onClick={()=>void change(r,"lock")}>ล็อก</button>}{r.status!=="OPEN"&&permissions.includes("payment.shift.reopen")&&<button onClick={()=>void change(r,"reopen")}>เปิดอีกครั้ง</button>}</td></tr>)}</tbody></table></div></section>;
}
