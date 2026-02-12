import { z } from "zod";

/** Base schema for any content block */
export const BlockSchema = z.object({
  id: z.string().ulid(),
  type: z.string().min(1),
  props: z.record(z.unknown()),
});

export type Block = z.output<typeof BlockSchema>;

/** A slot is an ordered array of blocks */
export const SlotSchema = z.array(BlockSchema);

export type Slot = z.output<typeof SlotSchema>;
