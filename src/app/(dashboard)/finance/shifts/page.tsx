import {pageContext} from "@/core/auth/page";import {requirePermission} from "@/core/auth/authorization";import {Shifts} from "@/modules/payment/components/shifts";
export default async function Page(){const ctx=await pageContext();requirePermission(ctx,"payment.dashboard.read");return <Shifts permissions={ctx.permissions}/>;}
