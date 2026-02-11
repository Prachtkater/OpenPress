import { z } from "zod";

export interface NavItem {
  label: string;
  href: string;
  target: "_self" | "_blank";
  children: NavItem[];
}

export const NavItemSchema: z.ZodType<NavItem, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.object({
    label: z.string().min(1).max(100),
    href: z.string().min(1),
    target: z.enum(["_self", "_blank"]).default("_self"),
    children: z.array(NavItemSchema).default([]),
  })
) as z.ZodType<NavItem, z.ZodTypeDef, unknown>;

export const NavigationSchema = z.object({
  main: z.array(NavItemSchema),
  footer: z.array(NavItemSchema).default([]),
});

export type Navigation = z.output<typeof NavigationSchema>;
