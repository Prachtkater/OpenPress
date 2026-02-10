import { z } from "zod";

export const NavItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z.object({
    label: z.string().min(1),
    href: z.string().min(1),
    target: z.enum(["_self", "_blank"]).default("_self"),
    children: z.array(NavItemSchema).default([]),
  })
);

export interface NavItem {
  label: string;
  href: string;
  target: "_self" | "_blank";
  children: NavItem[];
}

export const NavigationSchema = z.object({
  main: z.array(NavItemSchema),
  footer: z.array(NavItemSchema).default([]),
});

export type Navigation = z.infer<typeof NavigationSchema>;
