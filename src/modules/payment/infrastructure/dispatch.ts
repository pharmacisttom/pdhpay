import { z } from "zod";
import { handle, body } from "@/core/api/handler";
import { context } from "@/core/auth/session";
import { requirePermission } from "@/core/auth/authorization";
import { db } from "@/core/database/client";
import { AppError } from "@/core/errors";
import {
  pointInput,
  pointUpdate,
  staffInput,
  bankInput,
  id,
} from "../validators";
import {
  savePoint,
  getPoint,
  assignStaff,
  rotateToken,
  saveBank,
} from "../services/points";
import { filters, listPayments, summary } from "../queries/transactions";
import { paymentStream } from "./stream";
import { paymentDetail, reviewPayment, slipResponse } from "../services/review";
import { reviewInput } from "../validators";
import { GoogleDriveStorageService } from "./google-drive";
import {
  openShift,
  changeShift,
  listShifts,
  previewShift,
} from "../services/shifts";
import { shiftInput, versionInput } from "../validators";
import { pointScope } from "../services/points";
import { googleSheetsStatus, syncReceiptedPayments, saveSheetsConfig, sheetsConfigSchema } from "./google-sheets";
import { processSlipOcr } from "../services/ocr";
import { exportReport, reportFilters } from "../services/reports";
import { driveStatus, testDriveConnection, saveDriveConfig, driveConfigSchema } from "../services/drive-admin";
import { listDepartments, saveDepartment, departmentInput } from "../services/departments";
import { listAdminUsers, updateUserRoles, userRoleUpdateInput } from "../services/users-admin";
import { getReceiptMeterData } from "../services/receipt-meter";
export async function dispatch(request: Request, segments: string[]) {
  return handle(request, async (requestId) => {
    const ctx = await context();
    const [resource, key, action] = segments;
    if (resource === "drive" && key === "status" && request.method === "GET")
      return driveStatus(ctx);
    if (resource === "drive" && key === "config" && request.method === "POST") {
      const input = await body(request, driveConfigSchema);
      return saveDriveConfig(ctx, input, requestId);
    }
    if (resource === "drive" && key === "test" && request.method === "POST") {
      await body(request, z.object({}).strict());
      return testDriveConnection(ctx, requestId);
    }
    if (resource === "meter" && request.method === "GET") {
      const url = new URL(request.url);
      const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()), 10);
      const rate = parseFloat(url.searchParams.get("rate") || "1.0");
      return getReceiptMeterData(ctx, { year, ratePerReceipt: rate });
    }
    if (resource === "reports" && key === "export" && request.method === "GET")
      return exportReport(
        ctx,
        reportFilters.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        ),
        requestId,
      );
    if (resource === "sheets" && key === "status" && request.method === "GET")
      return googleSheetsStatus(ctx);
    if (resource === "sheets" && key === "config" && request.method === "POST") {
      const input = await body(request, sheetsConfigSchema);
      return saveSheetsConfig(ctx, input, requestId);
    }
    if (resource === "sheets" && key === "sync" && request.method === "POST") {
      await body(request, z.object({}).strict());
      return syncReceiptedPayments(ctx, requestId);
    }
    if (resource === "shifts" && key === "open" && request.method === "POST")
      return openShift(ctx, await body(request, shiftInput), requestId);
    if (resource === "filter-options" && request.method === "GET") {
      requirePermission(ctx, "payment.dashboard.read");
      return {
        points: await db().paymentPoint.findMany({
          where: ctx.permissions.includes("payment.report.read")
            ? { organizationId: ctx.organizationId }
            : pointScope(ctx),
          select: { id: true, name: true },
          take: 500,
          orderBy: { name: "asc" },
        }),
        officers: await db().user.findMany({
          where: { organizationId: ctx.organizationId, status: "ACTIVE" },
          select: { id: true, displayName: true },
          take: 500,
        }),
        shifts: await db().paymentShift.findMany({
          where: { organizationId: ctx.organizationId, point: pointScope(ctx) },
          select: { id: true, shiftName: true, shiftDate: true },
          orderBy: { openedAt: "desc" },
          take: 100,
        }),
      };
    }
    if (request.method === "GET" && !key) {
      if (resource === "stream") return paymentStream(ctx, request.signal);
      if (resource === "transactions")
        return listPayments(
          ctx,
          filters.parse(Object.fromEntries(new URL(request.url).searchParams)),
        );
      if (resource === "summary")
        return summary(
          ctx,
          filters.parse(Object.fromEntries(new URL(request.url).searchParams)),
        );
    }
    if (segments.length > 3)
      throw new AppError("NOT_FOUND", 404, "ไม่พบรายการ");
    if (key) id.parse(key);
    if (resource === "shifts") {
      if (request.method === "GET")
        return key ? previewShift(ctx, key) : listShifts(ctx);
      if (request.method === "POST" && key && action)
        return changeShift(
          ctx,
          key,
          action,
          (await body(request, versionInput)).version,
          requestId,
        );
    }
    if (resource === "transactions" && key) {
      if (request.method === "GET" && !action)
        return paymentDetail(ctx, key, requestId);
      if (request.method === "POST" && action)
        return reviewPayment(
          ctx,
          key,
          action,
          await body(request, reviewInput),
          requestId,
        );
    }
    if (resource === "slips" && key && request.method === "GET")
      return slipResponse(ctx, key, new GoogleDriveStorageService(), requestId);
    if (
      resource === "slips" &&
      key &&
      action === "ocr" &&
      request.method === "POST"
    ) {
      await body(request, z.object({}).strict());
      return processSlipOcr(ctx, key, requestId);
    }
    if (resource === "points") {
      if (request.method === "GET") {
        requirePermission(ctx, "payment.point.read");
        if (key) return getPoint(ctx, key);
        const p = z
          .object({
            page: z.coerce.number().int().min(1).max(10000).default(1),
            q: z.string().max(100).default(""),
          })
          .strict()
          .parse(Object.fromEntries(new URL(request.url).searchParams));
        const where = {
          organizationId: ctx.organizationId,
          name: { contains: p.q },
        };
        return {
          items: await db().paymentPoint.findMany({
            where,
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              updatedAt: true,
            },
            orderBy: { code: "asc" },
            skip: (p.page - 1) * 20,
            take: 20,
          }),
          total: await db().paymentPoint.count({ where }),
          page: p.page,
        };
      }
      if (request.method === "POST" && !key)
        return savePoint(
          ctx,
          await body(request, pointInput),
          undefined,
          requestId,
        );
      if (request.method === "PATCH" && key && !action)
        return savePoint(ctx, await body(request, pointUpdate), key, requestId);
      if (request.method === "POST" && key && action === "staff")
        return assignStaff(
          ctx,
          key,
          await body(request, staffInput),
          requestId,
        );
      if (request.method === "POST" && key && action === "rotate") {
        await body(request, z.object({}).strict());
        return rotateToken(ctx, key, requestId);
      }
    }
    if (resource === "banks") {
      requirePermission(ctx, "payment.admin.manage");
      if (request.method === "GET")
        return db().bankAccount.findMany({
          where: { organizationId: ctx.organizationId },
          take: 200,
          orderBy: { code: "asc" },
        });
      if (request.method === "POST" && !key)
        return saveBank(
          ctx,
          await body(request, bankInput),
          undefined,
          requestId,
        );
      if (request.method === "PATCH" && key)
        return saveBank(ctx, await body(request, bankInput), key, requestId);
    }
    if (resource === "lookups" && request.method === "GET") {
      requirePermission(ctx, "payment.point.read");
      return {
        banks: await db().bankAccount.findMany({
          where: { organizationId: ctx.organizationId },
          select: { id: true, bankName: true, code: true, active: true },
          take: 200,
        }),
        users: ctx.permissions.includes("payment.point.assign_staff")
          ? await db().user.findMany({
              where: { organizationId: ctx.organizationId, status: "ACTIVE" },
              select: { id: true, displayName: true },
              take: 500,
            })
          : [],
      };
    }
    if (resource === "departments") {
      if (request.method === "GET") return listDepartments(ctx);
      if (request.method === "POST" && !key)
        return saveDepartment(
          ctx,
          await body(request, departmentInput),
          undefined,
          requestId,
        );
      if (request.method === "PATCH" && key)
        return saveDepartment(
          ctx,
          await body(request, departmentInput),
          key,
          requestId,
        );
    }
    if (resource === "users") {
      if (request.method === "GET" && !key) return listAdminUsers(ctx);
      if (request.method === "POST" && key && action === "roles") {
        const input = await body(request, userRoleUpdateInput);
        return updateUserRoles(ctx, key, input.roleIds, requestId);
      }
    }
    throw new AppError("NOT_FOUND", 404, "ไม่พบรายการ");
  });
}
