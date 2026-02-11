import { z } from "zod";
import { SectionSchema } from "./section";

export const PageMetaSchema = z.object({
  description: z.string().optional(),
  ogImage: z.string().optional(),
});

export type PageMeta = z.infer<typeof PageMetaSchema>;

export const PageSchema = z.object({
  id: z.string().ulid(),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string().min(1),
  meta: PageMetaSchema,
  sections: z.array(SectionSchema),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type Page = z.infer<typeof PageSchema>;

/** Lightweight page listing without full section data */
export const PageListItemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type PageListItem = z.infer<typeof PageListItemSchema>;
