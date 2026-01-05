import { z } from "zod";

export const RegisterServerSchema = z.object({
  cores: z.number().int().min(1),
  max_workers: z.number().int().min(1),
});

export const AckCommandSchema = z.object({
  commandId: z.string().uuid(),
  status: z.enum(["acked", "completed", "failed"]),
});

export const StartWorkerSchema = z.object({
  clientId: z.string().uuid(),
});

export const StopWorkerSchema = z.object({
  workerId: z.string().uuid(),
});
