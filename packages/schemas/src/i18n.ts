import { z } from "zod";

/**
 * Creates a localized version of a schema.
 * Supports both simple localized strings and objects.
 */
export function localized<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    en: schema,
    // Add other common locales or make it a record
    de: schema.optional(),
  }).catchall(schema.optional());
}

/**
 * A localized string is a record of locale -> string
 */
export const LocalizedStringSchema = localized(z.string());
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

export const GermanErrorMessages = {
  required: "Dieses Feld ist erforderlich",
  invalid_slug: "Ungültiger Slug (nur Kleinbuchstaben, Zahlen und Bindestriche)",
  invalid_url: "Ungültige URL",
  invalid_datetime: "Ungültiges Datumsformat",
  too_short: (min: number) => `Muss mindestens ${min} Zeichen lang sein`,
  too_long: (max: number) => `Darf höchstens ${max} Zeichen lang sein`,
};

export const GermanZodErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "url") {
        return { message: GermanErrorMessages.invalid_url };
      }
      if (issue.validation === "datetime") {
        return { message: GermanErrorMessages.invalid_datetime };
      }
      if (issue.validation === "regex") {
        // We can check if it's our slug regex
        if (issue.path.includes("slug")) {
          return { message: GermanErrorMessages.invalid_slug };
        }
      }
      break;
    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        if (issue.minimum === 1) return { message: GermanErrorMessages.required };
        return { message: GermanErrorMessages.too_short(issue.minimum as number) };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === "string") {
        return { message: GermanErrorMessages.too_long(issue.maximum as number) };
      }
      break;
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined") {
        return { message: GermanErrorMessages.required };
      }
      break;
  }
  return { message: ctx.defaultError };
};
