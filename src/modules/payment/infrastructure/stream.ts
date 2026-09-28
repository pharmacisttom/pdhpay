import {db} from "@/core/database/client";
import type {Context} from "@/core/auth/authorization";
import {requirePermission} from "@/core/auth/authorization";
import {rateLimit} from "@/core/security/rate-limit";
export async function paymentStream(ctx:Context,signal:AbortSignal){
 requirePermission(ctx,"payment.dashboard.read");await rateLimit("payment:sse:"+ctx.sessionId,10,60);
 const encoder=new TextEncoder();let cleanup=()=>{};
 const stream=new ReadableStream<Uint8Array>({start(controller){
  let closed=false,busy=false;
  const close=()=>{if(closed)return;closed=true;clearInterval(timer);clearTimeout(lifetime);signal.removeEventListener("abort",close);controller.close();};
  const tick=async()=>{if(closed||busy)return;busy=true;try{
   const row=await db().session.findFirst({
    where:{id:ctx.sessionId,pendingTwoFactor:false,expiresAt:{gt:new Date()},idleExpiresAt:{gt:new Date()},
     user:{status:"ACTIVE",organizationId:ctx.organizationId,organization:{active:true},
      roles:{some:{role:{permissions:{some:{permission:{name:"payment.dashboard.read"}}}}}}
     }
    }
   });
   if(!row){close();return;}if(!closed)controller.enqueue(encoder.encode("event: update\ndata: {}\n\n"));
  }catch{close();}finally{busy=false;}};
  const timer=setInterval(()=>void tick(),5000),lifetime=setTimeout(close,55000);cleanup=close;signal.addEventListener("abort",close,{once:true});
  controller.enqueue(encoder.encode("retry: 3000\nevent: update\ndata: {}\n\n"));
 },cancel(){cleanup();}});
 return new Response(stream,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-store","X-Accel-Buffering":"no"}});
}
