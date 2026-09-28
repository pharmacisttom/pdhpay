"use client";
import {useEffect,useState} from "react";
import {api,confirmAction,showError} from "./api";
type Bank={id:string;code:string;bankName:string;accountName:string;accountNumber:string;active:boolean};
export function Banks(){const [rows,setRows]=useState<Bank[]>([]),[selected,setSelected]=useState<Bank|null>(null),[error,setError]=useState("");
useEffect(()=>{api<Bank[]>("banks").then(setRows).catch(e=>setError(e.message));},[]);
return <section><h1>บัญชีรับเงิน</h1>{error&&<p role="alert">{error}</p>}<ul>{rows.map(b=><li key={b.id}><button onClick={()=>setSelected(b)}>{b.code} · {b.bankName} · {b.active?"เปิด":"ปิด"}</button></li>)}</ul><button onClick={()=>setSelected(null)}>เพิ่มบัญชี</button><form key={selected?.id??"new"} className="form-stack" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(!await confirmAction("บันทึกบัญชีรับเงิน?"))return;try{await api("banks"+(selected?"/"+selected.id:""),selected?"PATCH":"POST",{code:f.get("code"),bankName:f.get("bankName"),accountName:f.get("accountName"),accountNumber:f.get("accountNumber"),active:f.get("active")==="on"});setRows(await api<Bank[]>("banks"));setSelected(null);}catch(error){await showError(error);}}}>
{(["code","bankName","accountName","accountNumber"] as const).map((k,i)=><label key={k}>{["รหัสบัญชี","ธนาคาร","ชื่อบัญชี","เลขที่บัญชี"][i]}<input name={k} required defaultValue={selected?.[k]??""}/></label>)}<label><input type="checkbox" name="active" defaultChecked={selected?.active}/>เปิดใช้งาน</label><button>บันทึก</button></form></section>;}
