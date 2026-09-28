export function logError(requestId: string) {
  console.error(
    JSON.stringify({ timestamp: new Date().toISOString(), level: "error", module: "api", action: "REQUEST_FAILED", message: "Request failed", requestId }),
  );
}
