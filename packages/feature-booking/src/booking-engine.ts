import {
  type BookingConfig,
  type Booking,
  type TimeSlot,
  BookingSchema,
} from "./schemas";

export interface AvailableSlot {
  date: string;
  start: string;
  end: string;
}

/**
 * Pure scheduling logic — no I/O, no side effects.
 * Takes config + existing bookings, returns availability & validates new bookings.
 */
export class BookingEngine {
  constructor(private readonly config: BookingConfig) {}

  /**
   * Generate all available time slots for a given date,
   * excluding already-booked slots and respecting buffer times.
   */
  getAvailableSlots(date: string, existingBookings: Booking[]): AvailableSlot[] {
    const dayOfWeek = this.getDayOfWeek(date);
    const dayKey = String(dayOfWeek) as "0" | "1" | "2" | "3" | "4" | "5" | "6";

    // Check if this day has any schedule
    const windows = this.config.schedule[dayKey];
    if (!windows || windows.length === 0) return [];

    // Check if the date is blocked
    if (this.isDateBlocked(date)) return [];

    // Check if the date is within the allowed advance range
    if (!this.isDateInRange(date)) return [];

    // Get active bookings for this date
    const activeBookings = existingBookings.filter(
      (b) => b.date === date && b.status !== "cancelled"
    );

    const slots: AvailableSlot[] = [];

    for (const window of windows) {
      const windowSlots = this.generateSlotsForWindow(window);
      for (const slot of windowSlots) {
        if (!this.isSlotConflicting(slot, activeBookings)) {
          slots.push({ date, start: slot.start, end: slot.end });
        }
      }
    }

    return slots;
  }

  /**
   * Get available slots for a range of dates.
   */
  getAvailableSlotsForRange(
    startDate: string,
    endDate: string,
    existingBookings: Booking[]
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const current = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    while (current <= end) {
      const dateStr = this.formatDate(current);
      slots.push(...this.getAvailableSlots(dateStr, existingBookings));
      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  /**
   * Validate a new booking against the config and existing bookings.
   * Returns null if valid, or an error message string.
   */
  validateBooking(
    booking: Omit<Booking, "id" | "createdAt" | "status">,
    existingBookings: Booking[]
  ): string | null {
    // Validate date is in range
    if (!this.isDateInRange(booking.date)) {
      return `Date ${booking.date} is outside the allowed booking range`;
    }

    // Validate date is not blocked
    if (this.isDateBlocked(booking.date)) {
      return `Date ${booking.date} is blocked`;
    }

    // Validate day of week has schedule
    const dayOfWeek = this.getDayOfWeek(booking.date);
    const dayKey = String(dayOfWeek) as "0" | "1" | "2" | "3" | "4" | "5" | "6";
    const windows = this.config.schedule[dayKey];
    if (!windows || windows.length === 0) {
      return `No availability on this day of the week`;
    }

    // Validate slot fits within a window
    const slotFitsWindow = windows.some(
      (w) =>
        this.timeToMinutes(booking.startTime) >= this.timeToMinutes(w.start) &&
        this.timeToMinutes(booking.endTime) <= this.timeToMinutes(w.end)
    );
    if (!slotFitsWindow) {
      return `Time slot ${booking.startTime}-${booking.endTime} is outside availability windows`;
    }

    // Validate slot duration matches config
    const duration =
      this.timeToMinutes(booking.endTime) -
      this.timeToMinutes(booking.startTime);
    if (duration !== this.config.slotDurationMinutes) {
      return `Slot duration must be ${this.config.slotDurationMinutes} minutes, got ${duration}`;
    }

    // Validate no conflicts with existing bookings (including buffer)
    const activeBookings = existingBookings.filter(
      (b) => b.date === booking.date && b.status !== "cancelled"
    );
    const candidateSlot: TimeSlot = {
      start: booking.startTime,
      end: booking.endTime,
    };
    if (this.isSlotConflicting(candidateSlot, activeBookings)) {
      return `Time slot conflicts with an existing booking`;
    }

    return null;
  }

  // --- Private helpers ---

  private generateSlotsForWindow(window: TimeSlot): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const windowStart = this.timeToMinutes(window.start);
    const windowEnd = this.timeToMinutes(window.end);
    const step = this.config.slotDurationMinutes + this.config.bufferMinutes;

    let cursor = windowStart;
    while (cursor + this.config.slotDurationMinutes <= windowEnd) {
      slots.push({
        start: this.minutesToTime(cursor),
        end: this.minutesToTime(cursor + this.config.slotDurationMinutes),
      });
      cursor += step;
    }

    return slots;
  }

  private isSlotConflicting(slot: TimeSlot, bookings: Booking[]): boolean {
    const slotStart = this.timeToMinutes(slot.start);
    const slotEnd = this.timeToMinutes(slot.end) + this.config.bufferMinutes;

    return bookings.some((b) => {
      const bStart = this.timeToMinutes(b.startTime);
      const bEnd = this.timeToMinutes(b.endTime) + this.config.bufferMinutes;
      return slotStart < bEnd && slotEnd > bStart;
    });
  }

  private isDateBlocked(date: string): boolean {
    return this.config.blockedDates.some((bd) => bd.date === date);
  }

  private isDateInRange(date: string): boolean {
    const target = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (target < today) return false;

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + this.config.maxAdvanceDays);
    return target <= maxDate;
  }

  private getDayOfWeek(date: string): number {
    return new Date(date + "T00:00:00").getDay();
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    return `${h}:${m}`;
  }
}
