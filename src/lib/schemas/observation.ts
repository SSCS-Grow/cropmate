import { z } from "zod";

const Status = z.enum(["active", "hidden", "flagged"]).default("active");

export const ObservationCreate = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional().default(""),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  pest_id: z.string().uuid().nullable().optional(),
  disease_id: z.string().uuid().nullable().optional(),
  garden_id: z.string().uuid().nullable().optional(),
  photo_url: z.string().url().optional(),
  taken_at: z.string().datetime().optional(),
  status: Status.optional(), // (server sætter default)
});

export const ObservationUpdate = ObservationCreate.partial();
export type ObservationCreateInput = z.infer<typeof ObservationCreate>;
export type ObservationUpdateInput = z.infer<typeof ObservationUpdate>;
