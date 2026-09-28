import { redirect } from "next/navigation";
import { context } from "./session";
import { AppError } from "@/core/errors";
export async function pageContext() {
  try {
    return await context();
  } catch (error) {
    if (error instanceof AppError && error.status === 401) redirect("/login");
    throw error;
  }
}
