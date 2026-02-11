import { type ZodType } from "zod";
import { join } from "path";

export class FileIOError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FileIOError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly issues: unknown[]
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Read a JSON file and validate it against a Zod schema.
 */
export async function readJSON<T>(
  filePath: string,
  schema: ZodType<T, any, any>
): Promise<T> {
  const file = Bun.file(filePath);
  const exists = await file.exists();

  if (!exists) {
    throw new FileIOError(`File not found: ${filePath}`, filePath);
  }

  let raw: unknown;
  try {
    raw = await file.json();
  } catch (err) {
    throw new FileIOError(`Failed to parse JSON: ${filePath}`, filePath, err);
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError(
      `Validation failed for ${filePath}: ${result.error.message}`,
      filePath,
      result.error.issues
    );
  }

  return result.data;
}

/**
 * Validate data against a Zod schema and write it as formatted JSON.
 */
export async function writeJSON<T>(
  filePath: string,
  data: T,
  schema: ZodType<T, any, any>
): Promise<void> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      `Validation failed before write: ${result.error.message}`,
      filePath,
      result.error.issues
    );
  }

  const json = JSON.stringify(result.data, null, 2) + "\n";

  try {
    await Bun.write(filePath, json);
  } catch (err) {
    throw new FileIOError(`Failed to write file: ${filePath}`, filePath, err);
  }
}

/**
 * Check if a file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  return Bun.file(filePath).exists();
}

/**
 * Delete a file if it exists.
 */
export async function deleteFile(filePath: string): Promise<void> {
  const { unlink } = await import("fs/promises");
  try {
    await unlink(filePath);
  } catch (err: any) {
    if (err.code !== "ENOENT") {
      throw new FileIOError(
        `Failed to delete file: ${filePath}`,
        filePath,
        err
      );
    }
  }
}

/**
 * List JSON files in a directory.
 */
export async function listJSONFiles(dirPath: string): Promise<string[]> {
  const { readdir } = await import("fs/promises");
  try {
    const entries = await readdir(dirPath);
    return entries
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(dirPath, f));
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw new FileIOError(
      `Failed to list directory: ${dirPath}`,
      dirPath,
      err
    );
  }
}
