import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = async (err: Error, c: Context) => {
  if (err instanceof AppError) {
    return c.json(
      {
        status: "error",
        message: err.message,
      },
      err.statusCode as any
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        status: "error",
        message: err.message,
      },
      err.status as any
    );
  }

  console.error("💥 Unexpected Error:", err);
  return c.json(
    {
      status: "error",
      message: "Internal Server Error",
    },
    500
  );
};
