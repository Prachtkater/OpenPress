import { z } from "zod";
import { SlotSchema } from "./block";

/** A section contains named slots, each holding blocks */
export const SectionSchema = z.object({
  id: z.string().ulid(),
  type: z.string().min(1),
  slots: z.record(SlotSchema),
});

export type Section = z.output<typeof SectionSchema>;
