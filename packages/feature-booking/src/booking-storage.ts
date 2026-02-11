import { join } from "path";
import { mkdir } from "fs/promises";
import { type ZodType, type ZodTypeDef } from "zod";
import {
  type BookingConfig,
  type Booking,
  type BookingStore,
  BookingConfigSchema,
  BookingStoreSchema,
  BookingSchema,
} from "./schemas";

// --- File I/O (mirrors poc-storage/file-io pattern) ---

class BookingFileIOError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "BookingFileIOError";
  }
}

class BookingValidationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly issues: unknown[]
  ) {
    super(message);
    this.name = "BookingValidationError";
  }
}

async function readJSON<T>(filePath: string, schema: ZodType<T, ZodTypeDef, unknown>): Promise<T> {
  const file = Bun.file(filePath);
  const exists = await file.exists();

  if (!exists) {
    throw new BookingFileIOError(`File not found: ${filePath}`, filePath);
  }

  let raw: unknown;
  try {
    raw = await file.json();
  } catch (err) {
    throw new BookingFileIOError(
      `Failed to parse JSON: ${filePath}`,
      filePath,
      err
    );
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new BookingValidationError(
      `Validation failed for ${filePath}: ${result.error.message}`,
      filePath,
      result.error.issues
    );
  }

  return result.data;
}

async function writeJSON<T>(
  filePath: string,
  data: T,
  schema: ZodType<T, ZodTypeDef, unknown>
): Promise<void> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new BookingValidationError(
      `Validation failed before write: ${result.error.message}`,
      filePath,
      result.error.issues
    );
  }

  const json = JSON.stringify(result.data, null, 2) + "\n";

  try {
    await Bun.write(filePath, json);
  } catch (err) {
    throw new BookingFileIOError(
      `Failed to write file: ${filePath}`,
      filePath,
      err
    );
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  return Bun.file(filePath).exists();
}

async function listJSONFiles(dirPath: string): Promise<string[]> {
  const { readdir } = await import("fs/promises");
  try {
    const entries = await readdir(dirPath);
    return entries
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(dirPath, f));
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return [];
    throw new BookingFileIOError(
      `Failed to list directory: ${dirPath}`,
      dirPath,
      err
    );
  }
}

// --- Booking Storage ---

export interface BookingStorageOptions {
  /** Root directory for booking data. Default: ./content/bookings */
  bookingDir: string;
}

/**
 * Git-backed JSON storage for booking configs and bookings.
 * Follows the same pattern as StorageEngine from poc-storage.
 */
export class BookingStorage {
  private readonly bookingDir: string;
  private readonly configsDir: string;
  private readonly bookingsDir: string;

  constructor(options: BookingStorageOptions) {
    this.bookingDir = options.bookingDir;
    this.configsDir = join(this.bookingDir, "configs");
    this.bookingsDir = join(this.bookingDir, "bookings");
  }

  /** Ensure directories exist */
  async init(): Promise<void> {
    await mkdir(this.configsDir, { recursive: true });
    await mkdir(this.bookingsDir, { recursive: true });
  }

  // --- Booking Configs ---

  async readConfig(configId: string): Promise<BookingConfig> {
    return readJSON(this.configPath(configId), BookingConfigSchema);
  }

  async writeConfig(config: BookingConfig): Promise<void> {
    await writeJSON(this.configPath(config.id), config, BookingConfigSchema);
  }

  async deleteConfig(configId: string): Promise<void> {
    const { unlink } = await import("fs/promises");
    try {
      await unlink(this.configPath(configId));
    } catch (err: unknown) {
      if (!(err instanceof Error && "code" in err && err.code === "ENOENT")) {
        throw new BookingFileIOError(
          `Failed to delete config: ${configId}`,
          this.configPath(configId),
          err
        );
      }
    }
  }

  async listConfigs(): Promise<BookingConfig[]> {
    const files = await listJSONFiles(this.configsDir);
    const configs: BookingConfig[] = [];
    for (const file of files) {
      configs.push(await readJSON(file, BookingConfigSchema));
    }
    return configs;
  }

  async configExists(configId: string): Promise<boolean> {
    return fileExists(this.configPath(configId));
  }

  // --- Bookings ---

  async readBookingStore(configId: string): Promise<BookingStore> {
    const path = this.storePath(configId);
    if (!(await fileExists(path))) {
      return { configId, bookings: [] };
    }
    return readJSON(path, BookingStoreSchema);
  }

  async writeBookingStore(store: BookingStore): Promise<void> {
    await writeJSON(this.storePath(store.configId), store, BookingStoreSchema);
  }

  async addBooking(booking: Booking): Promise<void> {
    const store = await this.readBookingStore(booking.configId);
    store.bookings.push(booking);
    await this.writeBookingStore(store);
  }

  async updateBooking(
    configId: string,
    bookingId: string,
    update: Partial<Pick<Booking, "status" | "notes">>
  ): Promise<Booking> {
    const store = await this.readBookingStore(configId);
    const index = store.bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) {
      throw new BookingFileIOError(
        `Booking not found: ${bookingId}`,
        this.storePath(configId)
      );
    }

    const updated = { ...store.bookings[index], ...update };
    const validated = BookingSchema.parse(updated);
    store.bookings[index] = validated;

    await this.writeBookingStore(store);
    return validated;
  }

  async getBookingsForDate(
    configId: string,
    date: string
  ): Promise<Booking[]> {
    const store = await this.readBookingStore(configId);
    return store.bookings.filter((b) => b.date === date);
  }

  async getAllBookings(configId: string): Promise<Booking[]> {
    const store = await this.readBookingStore(configId);
    return store.bookings;
  }

  // --- Helpers ---

  private configPath(configId: string): string {
    return join(this.configsDir, `${configId}.json`);
  }

  private storePath(configId: string): string {
    return join(this.bookingsDir, `${configId}.json`);
  }
}

export { BookingFileIOError, BookingValidationError };
