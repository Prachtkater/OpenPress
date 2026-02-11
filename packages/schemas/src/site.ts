import { z } from "zod";

export const SiteConfigSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().optional(),
  locale: z.string().default("de-DE"),
  theme: z.string().default("tailwind-plus"),
  meta: z.object({
    title: z.string().max(255).optional(),
    description: z.string().max(1000).optional(),
    ogImage: z.string().url().optional(),
  }),
});

export type SiteConfig = z.output<typeof SiteConfigSchema>;
