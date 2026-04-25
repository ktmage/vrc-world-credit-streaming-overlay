import { z } from "zod";

export const WorldIdSchema = z
  .string()
  .regex(/^wrld_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
export type WorldId = z.infer<typeof WorldIdSchema>;

export const WorldInfoSchema = z.object({
  id: WorldIdSchema,
  name: z.string(),
  authorName: z.string(),
  imageUrl: z.string(),
  description: z.string(),
});
export type WorldInfo = z.infer<typeof WorldInfoSchema>;
