import { z } from "zod";

/**
 * A single time slot representing an available booking window.
 */
export const TimeSlotSchema = z.object({
  /** Start time as "HH:MM" (24h format) */
  start: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  /** End time as "HH:MM" (24h format) */
  end: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

/**
 * Day-of-week availability schedule.
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export const WeeklyScheduleSchema = z.record(
  z.enum(["0", "1", "2", "3", "4", "5", "6"]),
  z.array(TimeSlotSchema)
);

export type WeeklySchedule = z.infer<typeof WeeklyScheduleSchema>;

/**
 * A date that is blocked from booking (e.g. holidays, personal days).
 */
export const BlockedDateSchema = z.object({
  /** ISO date string "YYYY-MM-DD" */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  /** Optional reason for the block */
  reason: z.string().optional(),
});

export type BlockedDate = z.infer<typeof BlockedDateSchema>;

/**
 * Configuration for a booking provider / calendar.
 */
export const BookingConfigSchema = z.object({
  /** ULID identifier */
  id: z.string().ulid(),
  /** Display label (e.g. "30-Minute Consultation") */
  label: z.string().min(1),
  /** Slot duration in minutes */
  slotDurationMinutes: z.number().int().min(5).max(480),
  /** Buffer time between slots in minutes */
  bufferMinutes: z.number().int().min(0).max(120).default(0),
  /** Weekly availability schedule */
  schedule: WeeklyScheduleSchema,
  /** Specific dates to block */
  blockedDates: z.array(BlockedDateSchema).default([]),
  /** Maximum days in advance a booking can be made */
  maxAdvanceDays: z.number().int().min(1).max(365).default(30),
  /** Timezone identifier (e.g. "Europe/Berlin") */
  timezone: z.string().min(1).default("Europe/Berlin"),
});

export type BookingConfig = z.infer<typeof BookingConfigSchema>;

/** Status of a booking */
export const BookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
]);

export type BookingStatus = z.infer<typeof BookingStatusSchema>;

/**
 * A single booking / appointment.
 */
export const BookingSchema = z.object({
  /** ULID identifier */
  id: z.string().ulid(),
  /** Reference to the BookingConfig this belongs to */
  configId: z.string().ulid(),
  /** Date of booking "YYYY-MM-DD" */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  /** Start time "HH:MM" */
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  /** End time "HH:MM" */
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  /** Status of the booking */
  status: BookingStatusSchema.default("pending"),
  /** Customer name */
  customerName: z.string().min(1),
  /** Customer email */
  customerEmail: z.string().email(),
  /** Optional notes */
  notes: z.string().optional(),
  /** ISO timestamp when booking was created */
  createdAt: z.string().datetime(),
});

export type Booking = z.infer<typeof BookingSchema>;

/**
 * The booking store file shape: holds all bookings for a config.
 */
export const BookingStoreSchema = z.object({
  /** The config ID this store belongs to */
  configId: z.string().ulid(),
  /** All bookings */
  bookings: z.array(BookingSchema).default([]),
});

export type BookingStore = z.infer<typeof BookingStoreSchema>;

/**
 * Props for the OpBooking block component (stored in block.props).
 */
export const BookingBlockPropsSchema = z.object({
  /** Reference to a BookingConfig ID */
  configId: z.string().ulid(),
  /** Heading text */
  heading: z.string().default("Book an Appointment"),
  /** Description text */
  description: z.string().default(""),
});

export type BookingBlockProps = z.infer<typeof BookingBlockPropsSchema>;
