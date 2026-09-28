import { dispatch } from "@/modules/payment/infrastructure/dispatch";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function route(request:Request,{params}:{params:Promise<{path:string[]}>}){return dispatch(request,(await params).path);}
export const GET=route; export const POST=route; export const PATCH=route;
