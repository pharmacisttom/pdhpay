import Swal from "sweetalert2";
export async function api<T>(path:string,method="GET",data?:unknown):Promise<T>{
 const response=await fetch("/api/v1/payment/"+path,{method,headers:data?{"Content-Type":"application/json"}:undefined,body:data?JSON.stringify(data):undefined,cache:"no-store"});
 const result=await response.json();
 if(!response.ok||!result.success) throw new Error((result.error?.message??"ไม่สามารถดำเนินการได้")+" · "+(result.meta?.requestId??""));
 return result.data as T;
}
export async function confirmAction(title:string){return (await Swal.fire({title,icon:"question",showCancelButton:true,confirmButtonText:"ยืนยัน",cancelButtonText:"ยกเลิก"})).isConfirmed;}
export async function showError(error:unknown){await Swal.fire({title:"ไม่สามารถดำเนินการได้",text:error instanceof Error?error.message:"กรุณาลองอีกครั้ง",icon:"error"});}
