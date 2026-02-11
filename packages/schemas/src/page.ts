import { z } from "zod";
import { SectionSchema } from "./section";
import { LocalizedStringSchema } from "./i18n";

/** Slug pattern: lowercase alphanumeric, hyphens allowed (not leading) */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export const PageMetaSchema = z.object({
  description: LocalizedStringSchema.optional(),
  ogImage: z.string().optional(),
});

export type PageMeta = z.output<typeof PageMetaSchema>;

export const PageSchema = z.object({
  id: z.string().ulid(),
  slug: z.string().regex(SLUG_PATTERN),
  title: LocalizedStringSchema,
  meta: PageMetaSchema,
  sections: z.array(SectionSchema),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type Page = z.output<typeof PageSchema>;

/** Lightweight page listing without full section data */
export const PageListItemSchema = z.object({
  slug: z.string(),
  title: LocalizedStringSchema,
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type PageListItem = z.output<typeof PageListItemSchema>;

/** Input schema for creating a new page (server generates id, timestamps, etc.) */
export const CreatePageInputSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN),
  title: LocalizedStringSchema,
  meta: PageMetaSchema.optional(),
  sections: z.array(SectionSchema).optional(),
});

export type CreatePageInput = z.output<typeof CreatePageInputSchema>;
