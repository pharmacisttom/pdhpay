import {pageContext} from "@/core/auth/page";import {requirePermission} from "@/core/auth/authorization";import {Dashboard} from "@/modules/payment/components/dashboard";
export default async function Page(){const ctx=await pageContext();requirePermission(ctx,"payment.dashboard.read");return <Dashboard canReadTransactions={ctx.permissions.includes("payment.transaction.read")}/>;}
