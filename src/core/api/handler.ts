import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { randomUUID } from "node:crypto";
import { AppError } from "@/core/errors";
import { env } from "@/core/config/env";
import { logError } from "@/core/logger";
export const pagination = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().max(100).default(""),
    sort: z.enum(["createdAt", "name"]).default("createdAt"),
    action: z.string().max(80).optional(),
  })
  .strict();
export async function body<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError("INVALID_INPUT", 400, "A JSON body is required.");
  let text = "";
  let size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new AppError("INVALID_INPUT", 400, "Request is too large.");
    }
    text += decoder.decode(part.value, { stream: true });
  }
  try {
    return schema.parse(JSON.parse(text + decoder.decode()));
  } catch (error) {
    if (error instanceof ZodError) throw error;
    throw new AppError("INVALID_INPUT", 400, "Invalid JSON.");
  }
}
export function mutationGuard(request: Request, multipart = false) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    if (request.headers.get("origin") !== new URL(env().APP_URL).origin)
      throw new AppError("FORBIDDEN", 403, "Invalid request origin.");
    if (
      request.headers.get("content-type")?.split(";")[0].trim() !==
      (multipart ? "multipart/form-data" : "application/json")
    )
      throw new AppError("INVALID_INPUT", 400, "Use application/json.");
  }
}
export async function handle(request: Request, run: (requestId: string) => Promise<unknown>, options: { multipart?: boolean } = {}) {
  const requestId = randomUUID();
  try {
    mutationGuard(request, options.multipart);
    const data = await run(requestId);
    if (data instanceof Response) {
      data.headers.set("Cache-Control", "no-store");
      data.headers.set("X-Request-ID", requestId);
      return data;
    }
    return NextResponse.json(
      { success: true, data, meta: { requestId } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const conflict =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ["P2002", "P2003"].includes(String(error.code));
    const safe =
      error instanceof AppError
        ? error
        : error instanceof ZodError
          ? new AppError("INVALID_INPUT", 400, "Invalid request fields.")
          : conflict
            ? new AppError(
                "CONFLICT",
                409,
                "The change conflicts with existing records.",
              )
            : new AppError(
                "INTERNAL_ERROR",
                500,
                "Unable to complete the request.",
              );
    if (safe.status === 500) logError(requestId);
    return NextResponse.json(
      {
        success: false,
        error: { code: safe.code, message: safe.message },
        meta: { requestId },
      },
      {
        status: safe.status,
        headers: {
          "Cache-Control": "no-store",
          ...(safe.status === 429 ? { "Retry-After": "900" } : {}),
        },
      },
    );
  }
}
