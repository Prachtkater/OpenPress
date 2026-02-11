import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { ulid } from "ulid";
import { BookingStorage, BookingFileIOError } from "../src/booking-storage";
import type { BookingConfig, Booking } from "../src/schemas";

function makeConfig(overrides?: Partial<BookingConfig>): BookingConfig {
  return {
    id: ulid(),
    label: "30-Minute Consultation",
    slotDurationMinutes: 30,
    bufferMinutes: 0,
    schedule: {
      "1": [{ start: "09:00", end: "17:00" }],
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
    date: "2026-03-16",
    startTime: "10:00",
    endTime: "10:30",
    status: "pending",
    customerName: "Max Mustermann",
    customerEmail: "max@example.com",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("BookingStorage", () => {
  let tmpDir: string;
  let storage: BookingStorage;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "openpress-booking-"));
    storage = new BookingStorage({
      bookingDir: join(tmpDir, "bookings"),
    });
    await storage.init();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("Config CRUD", () => {
    it("should write and read a booking config", async () => {
      const config = makeConfig();
      await storage.writeConfig(config);
      const read = await storage.readConfig(config.id);
      expect(read.id).toBe(config.id);
      expect(read.label).toBe(config.label);
      expect(read.slotDurationMinutes).toBe(30);
    });

    it("should list configs", async () => {
      const config1 = makeConfig({ label: "Config 1" });
      const config2 = makeConfig({ label: "Config 2" });
      await storage.writeConfig(config1);
      await storage.writeConfig(config2);

      const configs = await storage.listConfigs();
      expect(configs).toHaveLength(2);
      const labels = configs.map((c) => c.label).sort();
      expect(labels).toEqual(["Config 1", "Config 2"]);
    });

    it("should delete a config", async () => {
      const config = makeConfig();
      await storage.writeConfig(config);
      expect(await storage.configExists(config.id)).toBe(true);

      await storage.deleteConfig(config.id);
      expect(await storage.configExists(config.id)).toBe(false);
    });

    it("should throw for non-existent config", async () => {
      expect(storage.readConfig("01JNONEXISTENT00000000000")).rejects.toBeInstanceOf(
        BookingFileIOError
      );
    });

    it("should check config existence", async () => {
      const config = makeConfig();
      expect(await storage.configExists(config.id)).toBe(false);
      await storage.writeConfig(config);
      expect(await storage.configExists(config.id)).toBe(true);
    });
  });

  describe("Booking CRUD", () => {
    it("should return empty store for new config", async () => {
      const configId = ulid();
      const store = await storage.readBookingStore(configId);
      expect(store.configId).toBe(configId);
      expect(store.bookings).toEqual([]);
    });

    it("should add a booking", async () => {
      const config = makeConfig();
      await storage.writeConfig(config);

      const booking = makeBooking(config.id);
      await storage.addBooking(booking);

      const store = await storage.readBookingStore(config.id);
      expect(store.bookings).toHaveLength(1);
      expect(store.bookings[0].id).toBe(booking.id);
      expect(store.bookings[0].customerName).toBe("Max Mustermann");
    });

    it("should add multiple bookings", async () => {
      const config = makeConfig();
      await storage.writeConfig(config);

      const booking1 = makeBooking(config.id, { startTime: "10:00", endTime: "10:30" });
      const booking2 = makeBooking(config.id, { startTime: "11:00", endTime: "11:30" });
      await storage.addBooking(booking1);
      await storage.addBooking(booking2);

      const store = await storage.readBookingStore(config.id);
      expect(store.bookings).toHaveLength(2);
    });

    it("should update booking status", async () => {
      const config = makeConfig();
      await storage.writeConfig(config);

      const booking = makeBooking(config.id, { status: "pending" });
      await storage.addBooking(booking);

      const updated = await storage.updateBooking(config.id, booking.id, {
        status: "confirmed",
      });
      expect(updated.status).toBe("confirmed");

      // Verify persisted
      const store = await storage.readBookingStore(config.id);
      expect(store.bookings[0].status).toBe("confirmed");
    });

    it("should update booking notes", async () => {
      const config = makeConfig();
      const booking = makeBooking(config.id);
      await storage.addBooking(booking);

      const updated = await storage.updateBooking(config.id, booking.id, {
        notes: "Updated notes",
      });
      expect(updated.notes).toBe("Updated notes");
    });

    it("should throw when updating non-existent booking", async () => {
      const configId = ulid();
      expect(
        storage.updateBooking(configId, ulid(), { status: "confirmed" })
      ).rejects.toBeInstanceOf(BookingFileIOError);
    });

    it("should get bookings for a specific date", async () => {
      const config = makeConfig();
      const b1 = makeBooking(config.id, { date: "2026-03-16" });
      const b2 = makeBooking(config.id, { date: "2026-03-17" });
      const b3 = makeBooking(config.id, { date: "2026-03-16" });

      await storage.addBooking(b1);
      await storage.addBooking(b2);
      await storage.addBooking(b3);

      const forDate = await storage.getBookingsForDate(config.id, "2026-03-16");
      expect(forDate).toHaveLength(2);
    });

    it("should get all bookings for a config", async () => {
      const config = makeConfig();
      await storage.addBooking(makeBooking(config.id));
      await storage.addBooking(makeBooking(config.id));
      await storage.addBooking(makeBooking(config.id));

      const all = await storage.getAllBookings(config.id);
      expect(all).toHaveLength(3);
    });
  });
});
