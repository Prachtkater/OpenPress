import { z } from "zod";

export const SiteConfigSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
  locale: z.string().default("de-DE"),
  theme: z.string().default("tailwind-plus"),
  meta: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
  }),
});

export type SiteConfig = z.output<typeof SiteConfigSchema>;
