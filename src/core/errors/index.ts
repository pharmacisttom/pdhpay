export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function denied(): never {
  throw new AppError("FORBIDDEN", 403, "You do not have permission.");
}
export function missing(): never {
  throw new AppError("NOT_FOUND", 404, "Resource not found.");
}
