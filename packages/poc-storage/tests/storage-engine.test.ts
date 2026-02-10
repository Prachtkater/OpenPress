import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { ulid } from "ulid";
import { StorageEngine } from "../src/storage-engine";
import { ValidationError, FileIOError } from "../src/file-io";
import type { Page } from "@openpress/schemas";

function makePage(overrides?: Partial<Page>): Page {
  const now = new Date().toISOString();
  return {
    id: ulid(),
    slug: "test-page",
    title: "Test Page",
    meta: { description: "A test page" },
    sections: [
      {
        id: ulid(),
        type: "hero",
        slots: {
          default: [
            {
              id: ulid(),
              type: "rich-text",
              props: { content: "<p>Hello World</p>" },
            },
          ],
        },
      },
    ],
    updatedAt: now,
    createdAt: now,
    ...overrides,
  };
}

describe("StorageEngine", () => {
  let tmpDir: string;
  let engine: StorageEngine;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "openpress-poc-"));
    engine = new StorageEngine({
      contentDir: join(tmpDir, "content"),
      repoRoot: tmpDir,
    });
    await engine.init();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("Pages CRUD", () => {
    it("should write and read a page", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      const read = await engine.readPage("test-page");
      expect(read).toEqual(page);
    });

    it("should list pages", async () => {
      const page1 = makePage({ slug: "page-1", title: "Page 1" });
      const page2 = makePage({ slug: "page-2", title: "Page 2" });
      await engine.writePage("page-1", page1);
      await engine.writePage("page-2", page2);

      const list = await engine.listPages();
      expect(list).toHaveLength(2);
      expect(list.map((p) => p.slug).sort()).toEqual(["page-1", "page-2"]);
    });

    it("should delete a page", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      expect(await engine.pageExists("test-page")).toBe(true);

      await engine.deletePage("test-page");
      expect(await engine.pageExists("test-page")).toBe(false);
    });

    it("should throw FileIOError for non-existent page", async () => {
      expect(engine.readPage("nonexistent")).rejects.toBeInstanceOf(
        FileIOError
      );
    });
  });

  describe("Schema Validation", () => {
    it("should reject page with missing title", async () => {
      const page = makePage({ title: "" });
      expect(engine.writePage("bad", page)).rejects.toBeInstanceOf(
        ValidationError
      );
    });

    it("should reject page with invalid slug", async () => {
      const page = makePage({ slug: "INVALID SLUG!" });
      expect(engine.writePage("bad", page)).rejects.toBeInstanceOf(
        ValidationError
      );
    });

    it("should reject page with invalid ULID id", async () => {
      const page = makePage({ id: "not-a-ulid" });
      expect(engine.writePage("bad", page)).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });

  describe("Git Operations", () => {
    it("should commit changes", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      const result = await engine.commit("Add test page");

      expect(result.hash).toMatch(/^[a-f0-9]{40}$/);
      expect(result.message).toBe("Add test page");
    });

    it("should retrieve commit history", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      await engine.commit("First commit");

      const updated = { ...page, title: "Updated Title" };
      await engine.writePage("test-page", updated);
      await engine.commit("Update title");

      const history = await engine.getHistory("test-page");
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].message).toBe("Update title");
      expect(history[1].message).toBe("First commit");
    });

    it("should detect uncommitted changes", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      expect(await engine.hasChanges()).toBe(true);

      await engine.commit("Commit changes");
      expect(await engine.hasChanges()).toBe(false);
    });
  });

  describe("Site Config", () => {
    it("should write and read site config", async () => {
      const config = {
        name: "Test Site",
        locale: "de-DE",
        theme: "tailwind-plus",
        meta: { title: "Test", description: "Test site" },
      };
      await engine.writeSiteConfig(config);
      const read = await engine.readSiteConfig();
      expect(read.name).toBe("Test Site");
    });
  });

  describe("Navigation", () => {
    it("should write and read navigation", async () => {
      const nav = {
        main: [
          {
            label: "Home",
            href: "/",
            target: "_self" as const,
            children: [],
          },
          {
            label: "About",
            href: "/about",
            target: "_self" as const,
            children: [],
          },
        ],
        footer: [],
      };
      await engine.writeNavigation(nav);
      const read = await engine.readNavigation();
      expect(read.main).toHaveLength(2);
      expect(read.main[0].label).toBe("Home");
    });
  });

  describe("Performance", () => {
    it("should read a page in < 100ms", async () => {
      const page = makePage();
      await engine.writePage("perf-test", page);

      const start = performance.now();
      await engine.readPage("perf-test");
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
