import { describe, it, expect } from "bun:test";
import { ulid } from "ulid";
import {
  TimeSlotSchema,
  BookingConfigSchema,
  BookingSchema,
  BookingStoreSchema,
  BookingBlockPropsSchema,
  BlockedDateSchema,
  WeeklyScheduleSchema,
  BookingStatusSchema,
} from "../src/schemas";

describe("TimeSlotSchema", () => {
  it("should accept valid HH:MM format", () => {
    const result = TimeSlotSchema.safeParse({ start: "09:00", end: "10:00" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid time format", () => {
    const result = TimeSlotSchema.safeParse({ start: "9:00", end: "10:00" });
    expect(result.success).toBe(false);
  });

  it("should reject non-numeric time", () => {
    const result = TimeSlotSchema.safeParse({ start: "ab:cd", end: "10:00" });
    expect(result.success).toBe(false);
  });
});

describe("BlockedDateSchema", () => {
  it("should accept valid date", () => {
    const result = BlockedDateSchema.safeParse({ date: "2026-03-15" });
    expect(result.success).toBe(true);
  });

  it("should accept date with reason", () => {
    const result = BlockedDateSchema.safeParse({
      date: "2026-12-25",
      reason: "Christmas",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe("Christmas");
    }
  });

  it("should reject invalid date format", () => {
    const result = BlockedDateSchema.safeParse({ date: "15.03.2026" });
    expect(result.success).toBe(false);
  });
});

describe("WeeklyScheduleSchema", () => {
  it("should accept valid weekly schedule", () => {
    const result = WeeklyScheduleSchema.safeParse({
      "1": [{ start: "09:00", end: "17:00" }],
      "3": [
        { start: "09:00", end: "12:00" },
        { start: "13:00", end: "17:00" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid day keys", () => {
    const result = WeeklyScheduleSchema.safeParse({
      "8": [{ start: "09:00", end: "17:00" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("BookingConfigSchema", () => {
  const validConfig = {
    id: ulid(),
    label: "30-Minute Consultation",
    slotDurationMinutes: 30,
    bufferMinutes: 10,
    schedule: {
      "1": [{ start: "09:00", end: "17:00" }],
      "2": [{ start: "09:00", end: "17:00" }],
      "3": [{ start: "09:00", end: "17:00" }],
      "4": [{ start: "09:00", end: "17:00" }],
      "5": [{ start: "09:00", end: "12:00" }],
    },
    blockedDates: [{ date: "2026-12-25", reason: "Christmas" }],
    maxAdvanceDays: 30,
    timezone: "Europe/Berlin",
  };

  it("should accept a complete valid config", () => {
    const result = BookingConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("should apply defaults for optional fields", () => {
    const result = BookingConfigSchema.safeParse({
      id: ulid(),
      label: "Quick Call",
      slotDurationMinutes: 15,
      schedule: { "1": [{ start: "10:00", end: "11:00" }] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bufferMinutes).toBe(0);
      expect(result.data.maxAdvanceDays).toBe(30);
      expect(result.data.timezone).toBe("Europe/Berlin");
      expect(result.data.blockedDates).toEqual([]);
    }
  });

  it("should reject missing label", () => {
    const { label: _, ...noLabel } = validConfig;
    const result = BookingConfigSchema.safeParse(noLabel);
    expect(result.success).toBe(false);
  });

  it("should reject slot duration < 5", () => {
    const result = BookingConfigSchema.safeParse({
      ...validConfig,
      slotDurationMinutes: 3,
    });
    expect(result.success).toBe(false);
  });

  it("should reject slot duration > 480", () => {
    const result = BookingConfigSchema.safeParse({
      ...validConfig,
      slotDurationMinutes: 500,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid ULID id", () => {
    const result = BookingConfigSchema.safeParse({
      ...validConfig,
      id: "not-a-ulid",
    });
    expect(result.success).toBe(false);
  });
});

describe("BookingStatusSchema", () => {
  it("should accept valid statuses", () => {
    expect(BookingStatusSchema.safeParse("pending").success).toBe(true);
    expect(BookingStatusSchema.safeParse("confirmed").success).toBe(true);
    expect(BookingStatusSchema.safeParse("cancelled").success).toBe(true);
  });

  it("should reject invalid status", () => {
    expect(BookingStatusSchema.safeParse("deleted").success).toBe(false);
  });
});

describe("BookingSchema", () => {
  const validBooking = {
    id: ulid(),
    configId: ulid(),
    date: "2026-03-20",
    startTime: "10:00",
    endTime: "10:30",
    status: "pending" as const,
    customerName: "Max Mustermann",
    customerEmail: "max@example.com",
    notes: "First consultation",
    createdAt: new Date().toISOString(),
  };

  it("should accept a valid booking", () => {
    const result = BookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it("should default status to pending", () => {
    const { status: _, ...noStatus } = validBooking;
    const result = BookingSchema.safeParse(noStatus);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("pending");
    }
  });

  it("should reject invalid email", () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      customerEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty customer name", () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      customerName: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid date format", () => {
    const result = BookingSchema.safeParse({
      ...validBooking,
      date: "20.03.2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("BookingStoreSchema", () => {
  it("should accept valid store", () => {
    const result = BookingStoreSchema.safeParse({
      configId: ulid(),
      bookings: [],
    });
    expect(result.success).toBe(true);
  });

  it("should default bookings to empty array", () => {
    const result = BookingStoreSchema.safeParse({
      configId: ulid(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bookings).toEqual([]);
    }
  });
});

describe("BookingBlockPropsSchema", () => {
  it("should accept valid block props", () => {
    const result = BookingBlockPropsSchema.safeParse({
      configId: ulid(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.heading).toBe("Book an Appointment");
      expect(result.data.description).toBe("");
    }
  });

  it("should accept custom heading", () => {
    const result = BookingBlockPropsSchema.safeParse({
      configId: ulid(),
      heading: "Schedule a Meeting",
      description: "Pick your preferred time",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.heading).toBe("Schedule a Meeting");
    }
  });
});
