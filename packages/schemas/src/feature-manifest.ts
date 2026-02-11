import { z } from "zod";

/**
 * Schema for a block component exposed by a feature.
 * Describes the block so the Component Picker can display it.
 */
export const FeatureBlockSchema = z.object({
  /** Block type identifier (e.g. "contact-form", "booking-calendar") */
  type: z.string().min(1),
  /** Human-readable label for the Component Picker */
  label: z.string().min(1),
  /** Optional description shown in the Component Picker */
  description: z.string().optional(),
  /** Optional icon identifier (e.g. "mdi:form" or a URL) */
  icon: z.string().optional(),
  /** Optional category for grouping in the Component Picker */
  category: z.string().optional(),
  /** Default props when a new block of this type is created */
  defaultProps: z.record(z.unknown()).optional(),
});

export type FeatureBlock = z.infer<typeof FeatureBlockSchema>;

/**
 * Schema for an editor panel contributed by a feature.
 */
export const FeatureEditorPanelSchema = z.object({
  /** Unique panel identifier */
  id: z.string().min(1),
  /** Label shown in the editor sidebar */
  label: z.string().min(1),
  /** Path to the Vue component (resolved from feature package) */
  component: z.string().min(1),
  /** Optional icon */
  icon: z.string().optional(),
});

export type FeatureEditorPanel = z.infer<typeof FeatureEditorPanelSchema>;

/**
 * Schema for the openpress.feature.json manifest file.
 *
 * Each feature package places this file at its root to declare
 * what it contributes to the OpenPress runtime.
 */
export const FeatureManifestSchema = z.object({
  /** Feature identifier (matches npm package name, e.g. "@openpress/feature-contact-form") */
  name: z.string().min(1),
  /** Human-readable display name */
  label: z.string().min(1),
  /** Version (semver) */
  version: z.string().optional(),
  /** Short description */
  description: z.string().optional(),
  /** Block components this feature contributes */
  blocks: z.array(FeatureBlockSchema).default([]),
  /** Editor panels this feature contributes */
  editorPanels: z.array(FeatureEditorPanelSchema).default([]),
  /** Additional editor routes (e.g. "/_edit/bookings") */
  editorRoutes: z
    .array(
      z.object({
        path: z.string().min(1),
        label: z.string().min(1),
        component: z.string().min(1),
        icon: z.string().optional(),
      })
    )
    .default([]),
});

export type FeatureManifest = z.infer<typeof FeatureManifestSchema>;
