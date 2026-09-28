"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {api} from "./api";
type Row={id:string;paymentNo:string;hn:string;patientName:string;submittedAt:string;declaredAmount:string;verifiedAmount:string|null;sourceBank:string;status:string;point:{name:string};verifier:{displayName:string}|null};
type Summary={count:number;declared:string;verified:string;groups:{status:string;count:number;declared:string}[]};
export function Dashboard({canReadTransactions=true}:{canReadTransactions?:boolean}){
 const [query,setQuery]=useState(""),[page,setPage]=useState(1),[rows,setRows]=useState<Row[]>([]),[total,setTotal]=useState(0),[stats,setStats]=useState<Summary|null>(null),[error,setError]=useState(""),[updated,setUpdated]=useState("");
 useEffect(()=>{let active=true,running=false;const refresh=async()=>{if(running)return;running=true;try{
  const suffix=query+(query?"&":"")+"page="+page;
  const [s,r]=await Promise.all([api<Summary>("summary?"+suffix),canReadTransactions?api<{items:Row[];total:number}>("transactions?"+suffix):Promise.resolve({items:[],total:0})]);
  if(active){setStats(s);setRows(r.items);setTotal(r.total);setError("");setUpdated(new Date().toLocaleTimeString("th-TH"));}
 }catch(e){if(active)setError(e instanceof Error?e.message:"ไม่สามารถโหลดข้อมูลได้");}finally{running=false;}};
 void refresh();const events=new EventSource("/api/v1/payment/stream");events.addEventListener("update",refresh);events.onerror=()=>{if(active)setError("กำลังเชื่อมต่อรายการสดใหม่…");};return()=>{active=false;events.close();};
 },[query,page,canReadTransactions]);
 return <section><h1>การเงิน · PDH Smart Payment</h1><p><Link href="/finance/shifts">กะงาน</Link> · <Link href="/finance/reports/daily">รายงานรายวัน</Link> · <Link href="/finance/reports/monthly">รายเดือน</Link></p>
 <form className="payment-filters" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget),params=new URLSearchParams();for(const [k,v]of data)if(String(v))params.set(k,String(v));setPage(1);setQuery(params.toString());}}>
 <label>ตั้งแต่<input type="date" name="from"/></label><label>ถึง<input type="date" name="to"/></label><label>เวลาเริ่ม<input type="time" name="fromTime"/></label><label>เวลาสิ้นสุด<input type="time" name="toTime"/></label><label>ค้นหา HN / เลขอ้างอิง<input name="q"/></label>
 <label>สถานะ<select name="status"><option value="">ทั้งหมด</option>{["SUBMITTED","PENDING_VERIFY","VERIFIED","RECEIPTED","AMOUNT_MISMATCH","POSSIBLE_DUPLICATE","INVALID_SLIP","REJECTED","CANCELLED"].map(s=><option key={s}>{s}</option>)}</select></label>
 <label>ธนาคาร<input name="bank"/></label><label>จุด (รหัสระบบ)<input name="point"/></label><label>เจ้าหน้าที่ (รหัสระบบ)<input name="officer"/></label><label>กะ (รหัสระบบ)<input name="shift"/></label><button>ค้นหา</button></form>
 {error&&<p role="alert">{error}</p>}<p aria-live="polite">อัปเดตล่าสุด {updated||"กำลังโหลด…"}</p>
 {stats?<><div className="payment-kpis"><article><h2>{stats.count}</h2>รายการ</article><article><h2>{stats.declared}</h2>ยอดแจ้งชำระ</article><article><h2>{stats.verified}</h2>ยอดยืนยัน</article>{stats.groups.filter(g=>!["VERIFIED","RECEIPTED"].includes(g.status)).map(g=><article key={g.status}><h2>{g.count} / {g.declared} ฿</h2>{g.status}</article>)}</div></>:<p className="skeleton">กำลังโหลดสรุป…</p>}
 {canReadTransactions&&<><div className="table-scroll"><table><thead><tr>{["เวลา","เลขอ้างอิง","HN","ผู้ป่วย","จุด","ยอดแจ้ง","ยอดยืนยัน","ธนาคาร","สถานะ","เจ้าหน้าที่"].map(s=><th key={s}>{s}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="payment-row"><td>{new Date(r.submittedAt).toLocaleString("th-TH")}</td><td><Link href={"/finance/transactions/"+r.id}>{r.paymentNo}</Link></td><td>{r.hn}</td><td>{r.patientName}</td><td>{r.point.name}</td><td>{r.declaredAmount}</td><td>{r.verifiedAmount??"—"}</td><td>{r.sourceBank}</td><td><span className="status-badge">{r.status}</span></td><td>{r.verifier?.displayName??"—"}</td></tr>)}</tbody></table></div>{!rows.length&&<p>ไม่พบรายการตามตัวกรอง</p>}<button disabled={page===1} onClick={()=>setPage(page-1)}>ก่อนหน้า</button> หน้า {page} · {total} รายการ <button disabled={page*20>=total} onClick={()=>setPage(page+1)}>ถัดไป</button></>}
 </section>;
}
