import {pageContext} from "@/core/auth/page";import {requirePermission} from "@/core/auth/authorization";import {Banks} from "@/modules/payment/components/banks";
export default async function Page(){requirePermission(await pageContext(),"payment.admin.manage");return <Banks/>;}
