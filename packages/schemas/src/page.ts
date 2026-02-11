import { z } from "zod";
import { SectionSchema } from "./section";
import { LocalizedStringSchema } from "./i18n";

export const PageMetaSchema = z.object({
  description: LocalizedStringSchema.optional(),
  ogImage: z.string().optional(),
});

export type PageMeta = z.infer<typeof PageMetaSchema>;

export const PageSchema = z.object({
  id: z.string().ulid(),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: LocalizedStringSchema,
  meta: PageMetaSchema,
  sections: z.array(SectionSchema),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type Page = z.infer<typeof PageSchema>;

/** Lightweight page listing without full section data */
export const PageListItemSchema = z.object({
  slug: z.string(),
  title: LocalizedStringSchema,
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type PageListItem = z.infer<typeof PageListItemSchema>;
