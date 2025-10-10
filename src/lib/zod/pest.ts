import { z } from "zod";

export const PestSchema = z.object({
  name: z.string().min(2),
  latin_name: z.string().optional().nullable(),
  category: z.enum(["pest","disease"]).default("pest"),
  description: z.string().optional().nullable(),
  host_plants: z.array(z.string()).default([]),
  severity: z.number().int().min(1).max(5).default(3),
});
export type PestInput = z.infer<typeof PestSchema>;
