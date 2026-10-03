export function logError(requestId: string, error?: unknown) {
  const detail =
    error instanceof Error
      ? { message: error.message, name: error.name, stack: error.stack }
      : { message: String(error), raw: error };

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      module: "api",
      action: "REQUEST_FAILED",
      message: detail.message || "Request failed",
      requestId,
      name: detail.name,
      stack: detail.stack,
      detail,
    }),
  );
}
