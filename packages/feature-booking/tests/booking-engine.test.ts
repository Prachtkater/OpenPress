import { describe, it, expect } from "bun:test";
import { ulid } from "ulid";
import { BookingEngine } from "../src/booking-engine";
import type { BookingConfig, Booking } from "../src/schemas";

function makeConfig(overrides?: Partial<BookingConfig>): BookingConfig {
  return {
    id: ulid(),
    label: "30-Minute Consultation",
    slotDurationMinutes: 30,
    bufferMinutes: 0,
    schedule: {
      // Monday-Friday 09:00-17:00
      "1": [{ start: "09:00", end: "17:00" }],
      "2": [{ start: "09:00", end: "17:00" }],
      "3": [{ start: "09:00", end: "17:00" }],
      "4": [{ start: "09:00", end: "17:00" }],
      "5": [{ start: "09:00", end: "17:00" }],
    },
    blockedDates: [],
    maxAdvanceDays: 30,
    timezone: "Europe/Berlin",
    ...overrides,
  };
}

function makeBooking(
  configId: string,
  overrides?: Partial<Booking>
): Booking {
  return {
    id: ulid(),
    configId,
    date: "2026-03-16", // Monday
    startTime: "10:00",
    endTime: "10:30",
    status: "confirmed",
    customerName: "Test User",
    customerEmail: "test@example.com",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Find a future Monday within maxAdvanceDays range
function getNextMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); // next Monday
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("BookingEngine", () => {
  describe("getAvailableSlots", () => {
    it("should generate slots for a weekday with availability", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const slots = engine.getAvailableSlots(monday, []);
      // 09:00-17:00 with 30-min slots = 16 slots
      expect(slots).toHaveLength(16);
      expect(slots[0].start).toBe("09:00");
      expect(slots[0].end).toBe("09:30");
      expect(slots[15].start).toBe("16:30");
      expect(slots[15].end).toBe("17:00");
    });

    it("should return no slots for a weekend day", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);
      // Find a future Sunday
      const d = new Date();
      d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
      const sunday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const slots = engine.getAvailableSlots(sunday, []);
      expect(slots).toHaveLength(0);
    });

    it("should return no slots for a blocked date", () => {
      const monday = getNextMonday();
      const config = makeConfig({
        blockedDates: [{ date: monday, reason: "Holiday" }],
      });
      const engine = new BookingEngine(config);

      const slots = engine.getAvailableSlots(monday, []);
      expect(slots).toHaveLength(0);
    });

    it("should exclude slots that conflict with existing bookings", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const existingBooking = makeBooking(config.id, {
        date: monday,
        startTime: "10:00",
        endTime: "10:30",
        status: "confirmed",
      });

      const slots = engine.getAvailableSlots(monday, [existingBooking]);
      // 16 total - 1 booked = 15
      expect(slots).toHaveLength(15);
      expect(slots.find((s) => s.start === "10:00")).toBeUndefined();
    });

    it("should NOT exclude slots conflicting with cancelled bookings", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const cancelledBooking = makeBooking(config.id, {
        date: monday,
        startTime: "10:00",
        endTime: "10:30",
        status: "cancelled",
      });

      const slots = engine.getAvailableSlots(monday, [cancelledBooking]);
      expect(slots).toHaveLength(16);
      expect(slots.find((s) => s.start === "10:00")).toBeDefined();
    });

    it("should respect buffer time between slots", () => {
      const config = makeConfig({
        slotDurationMinutes: 30,
        bufferMinutes: 15,
        schedule: {
          "1": [{ start: "09:00", end: "11:00" }],
        },
      });
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      // With 30min slots + 15min buffer = 45min steps
      // 09:00-09:30, 09:45-10:15, 10:30-11:00 = 3 slots
      const slots = engine.getAvailableSlots(monday, []);
      expect(slots).toHaveLength(3);
      expect(slots[0].start).toBe("09:00");
      expect(slots[1].start).toBe("09:45");
      expect(slots[2].start).toBe("10:30");
    });

    it("should handle multiple availability windows per day", () => {
      const config = makeConfig({
        slotDurationMinutes: 60,
        schedule: {
          "1": [
            { start: "09:00", end: "12:00" },
            { start: "14:00", end: "17:00" },
          ],
        },
      });
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const slots = engine.getAvailableSlots(monday, []);
      // Morning: 09-10, 10-11, 11-12 = 3
      // Afternoon: 14-15, 15-16, 16-17 = 3
      expect(slots).toHaveLength(6);
    });

    it("should return no slots for past dates", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);

      const slots = engine.getAvailableSlots("2020-01-06", []);
      expect(slots).toHaveLength(0);
    });

    it("should return no slots for dates beyond maxAdvanceDays", () => {
      const config = makeConfig({ maxAdvanceDays: 7 });
      const engine = new BookingEngine(config);

      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 60);
      const dateStr = `${farFuture.getFullYear()}-${String(farFuture.getMonth() + 1).padStart(2, "0")}-${String(farFuture.getDate()).padStart(2, "0")}`;

      const slots = engine.getAvailableSlots(dateStr, []);
      expect(slots).toHaveLength(0);
    });

    it("should respect buffer when checking conflicts with existing bookings", () => {
      const config = makeConfig({
        slotDurationMinutes: 30,
        bufferMinutes: 15,
        schedule: {
          "1": [{ start: "09:00", end: "12:00" }],
        },
      });
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      // Existing booking at 09:45-10:15
      const existing = makeBooking(config.id, {
        date: monday,
        startTime: "09:45",
        endTime: "10:15",
        status: "confirmed",
      });

      const slots = engine.getAvailableSlots(monday, [existing]);
      // 09:00 slot (09:00-09:30 + 15min buffer = until 09:45) conflicts with booking start at 09:45
      // 09:45 slot is the booked one
      // So available: only those that don't overlap buffer windows
      const startTimes = slots.map((s) => s.start);
      expect(startTimes).not.toContain("09:45");
    });
  });

  describe("getAvailableSlotsForRange", () => {
    it("should aggregate slots across multiple dates", () => {
      const monday = getNextMonday();
      const d = new Date(monday + "T00:00:00");
      d.setDate(d.getDate() + 1); // Tuesday
      const tuesday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const config = makeConfig({
        schedule: {
          "1": [{ start: "09:00", end: "10:00" }],
          "2": [{ start: "09:00", end: "10:00" }],
        },
        slotDurationMinutes: 30,
      });
      const engine = new BookingEngine(config);

      const slots = engine.getAvailableSlotsForRange(monday, tuesday, []);
      // 2 slots per day * 2 days = 4
      expect(slots).toHaveLength(4);
      expect(slots[0].date).toBe(monday);
      expect(slots[2].date).toBe(tuesday);
    });
  });

  describe("validateBooking", () => {
    it("should return null for a valid booking", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const error = engine.validateBooking(
        {
          configId: config.id,
          date: monday,
          startTime: "10:00",
          endTime: "10:30",
          customerName: "Test",
          customerEmail: "test@example.com",
        },
        []
      );
      expect(error).toBeNull();
    });

    it("should reject booking on blocked date", () => {
      const monday = getNextMonday();
      const config = makeConfig({
        blockedDates: [{ date: monday }],
      });
      const engine = new BookingEngine(config);

      const error = engine.validateBooking(
        {
          configId: config.id,
          date: monday,
          startTime: "10:00",
          endTime: "10:30",
          customerName: "Test",
          customerEmail: "test@example.com",
        },
        []
      );
      expect(error).toContain("blocked");
    });

    it("should reject booking outside availability window", () => {
      const config = makeConfig({
        schedule: {
          "1": [{ start: "09:00", end: "12:00" }],
        },
      });
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const error = engine.validateBooking(
        {
          configId: config.id,
          date: monday,
          startTime: "14:00",
          endTime: "14:30",
          customerName: "Test",
          customerEmail: "test@example.com",
        },
        []
      );
      expect(error).toContain("outside availability");
    });

    it("should reject booking with wrong duration", () => {
      const config = makeConfig({ slotDurationMinutes: 30 });
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const error = engine.validateBooking(
        {
          configId: config.id,
          date: monday,
          startTime: "10:00",
          endTime: "11:00", // 60 min instead of 30
          customerName: "Test",
          customerEmail: "test@example.com",
        },
        []
      );
      expect(error).toContain("duration");
    });

    it("should reject booking that conflicts with existing", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const existing = makeBooking(config.id, {
        date: monday,
        startTime: "10:00",
        endTime: "10:30",
        status: "confirmed",
      });

      const error = engine.validateBooking(
        {
          configId: config.id,
          date: monday,
          startTime: "10:00",
          endTime: "10:30",
          customerName: "Another User",
          customerEmail: "other@example.com",
        },
        [existing]
      );
      expect(error).toContain("conflicts");
    });

    it("should allow booking in slot freed by cancellation", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);
      const monday = getNextMonday();

      const cancelled = makeBooking(config.id, {
        date: monday,
        startTime: "10:00",
        endTime: "10:30",
        status: "cancelled",
      });

      const error = engine.validateBooking(
        {
          configId: config.id,
          date: monday,
          startTime: "10:00",
          endTime: "10:30",
          customerName: "New User",
          customerEmail: "new@example.com",
        },
        [cancelled]
      );
      expect(error).toBeNull();
    });

    it("should reject booking on day with no schedule", () => {
      const config = makeConfig({
        schedule: {
          "1": [{ start: "09:00", end: "17:00" }],
          // Only Monday has availability
        },
      });
      const engine = new BookingEngine(config);

      // Find a future Wednesday
      const d = new Date();
      const daysToWed = (3 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + daysToWed);
      const wednesday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const error = engine.validateBooking(
        {
          configId: config.id,
          date: wednesday,
          startTime: "10:00",
          endTime: "10:30",
          customerName: "Test",
          customerEmail: "test@example.com",
        },
        []
      );
      expect(error).toContain("No availability");
    });

    it("should reject booking for past date", () => {
      const config = makeConfig();
      const engine = new BookingEngine(config);

      const error = engine.validateBooking(
        {
          configId: config.id,
          date: "2020-01-06", // Past Monday
          startTime: "10:00",
          endTime: "10:30",
          customerName: "Test",
          customerEmail: "test@example.com",
        },
        []
      );
      expect(error).toContain("outside the allowed booking range");
    });
  });
});
