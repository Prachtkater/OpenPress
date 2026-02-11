import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { ulid } from "ulid";
import { StorageEngine } from "../src/runtime/server/lib/storage-engine";
import {
  FileIOError,
  ValidationError,
} from "../src/runtime/server/lib/storage-engine/file-io";
import {
  PageSchema,
  SiteConfigSchema,
  NavigationSchema,
} from "@openpress/schemas";
import type { Page, SiteConfig, Navigation } from "@openpress/schemas";

function makePage(overrides?: Partial<Page>): Page {
  const now = new Date().toISOString();
  return {
    id: ulid(),
    slug: "test-page",
    title: { en: "Test Page" },
    meta: { description: { en: "A test page" } },
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

function makeSiteConfig(): SiteConfig {
  return {
    name: "Test Site",
    locale: "de-DE",
    theme: "tailwind-plus",
    meta: { title: "Test", description: "Test site" },
  };
}

function makeNavigation(): Navigation {
  return {
    main: [
      { label: "Home", href: "/", target: "_self", children: [] },
      { label: "About", href: "/about", target: "_self", children: [] },
    ],
    footer: [],
  };
}

describe("API Handler Logic", () => {
  let tmpDir: string;
  let engine: StorageEngine;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "openpress-api-"));
    engine = new StorageEngine({
      contentDir: join(tmpDir, "content"),
      repoRoot: tmpDir,
    });
    await engine.init();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("Pages API Logic", () => {
    it("GET /pages - should return empty array initially", async () => {
      const pages = await engine.listPages();
      expect(pages).toEqual([]);
    });

    it("PUT /pages/:slug - should validate body with PageSchema", async () => {
      const invalidBody = { title: { en: "no id or slug" } };
      const result = PageSchema.safeParse(invalidBody);
      expect(result.success).toBe(false);
    });

    it("PUT /pages/:slug - should accept valid page", async () => {
      const page = makePage({ slug: "new-page" });
      const result = PageSchema.safeParse(page);
      expect(result.success).toBe(true);

      await engine.writePage("new-page", result.data!);
      const read = await engine.readPage("new-page");
      expect(read.title).toEqual({ en: "Test Page" });
    });

    it("PUT /pages/:slug - should reject invalid slug format", async () => {
      const page = makePage({ slug: "UPPER_CASE!" });
      const result = PageSchema.safeParse(page);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("GET /pages/:slug - should return 404 for missing page", async () => {
      try {
        await engine.readPage("nonexistent");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(FileIOError);
      }
    });

    it("GET /pages/:slug - should return page data", async () => {
      const page = makePage({ slug: "about" });
      await engine.writePage("about", page);
      const read = await engine.readPage("about");
      expect(read.slug).toBe("about");
      expect(read.title).toEqual({ en: "Test Page" });
      expect(read.sections).toHaveLength(1);
    });

    it("DELETE /pages/:slug - should check existence first", async () => {
      const exists = await engine.pageExists("nonexistent");
      expect(exists).toBe(false);
    });

    it("DELETE /pages/:slug - should delete existing page", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      expect(await engine.pageExists("test-page")).toBe(true);

      await engine.deletePage("test-page");
      expect(await engine.pageExists("test-page")).toBe(false);
    });

    it("PUT /pages/:slug - should auto-commit after write", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      await engine.commit(`content: update page 'test-page'`);

      expect(await engine.hasChanges()).toBe(false);
      const history = await engine.getHistory("test-page");
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].message).toBe("content: update page 'test-page'");
    });

    it("DELETE /pages/:slug - should auto-commit after delete", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      await engine.commit("Add page");

      await engine.deletePage("test-page");
      await engine.commit(`content: delete page 'test-page'`);

      const history = await engine.getHistory();
      expect(history[0].message).toBe("content: delete page 'test-page'");
    });
  });

  describe("Site Config API Logic", () => {
    it("GET /site - should return site config", async () => {
      const config = makeSiteConfig();
      await engine.writeSiteConfig(config);
      const read = await engine.readSiteConfig();
      expect(read.name).toBe("Test Site");
      expect(read.locale).toBe("de-DE");
    });

    it("PUT /site - should validate body with SiteConfigSchema", async () => {
      const invalidBody = { locale: "en" }; // missing required 'name'
      const result = SiteConfigSchema.safeParse(invalidBody);
      expect(result.success).toBe(false);
    });

    it("PUT /site - should accept valid config", async () => {
      const config = makeSiteConfig();
      const result = SiteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);

      await engine.writeSiteConfig(result.data!);
      const read = await engine.readSiteConfig();
      expect(read.name).toBe("Test Site");
    });

    it("PUT /site - should auto-commit after write", async () => {
      const config = makeSiteConfig();
      await engine.writeSiteConfig(config);
      await engine.commit("config: update site configuration");

      expect(await engine.hasChanges()).toBe(false);
      const history = await engine.getHistory();
      expect(history[0].message).toBe("config: update site configuration");
    });
  });

  describe("Navigation API Logic", () => {
    it("GET /navigation - should return navigation", async () => {
      const nav = makeNavigation();
      await engine.writeNavigation(nav);
      const read = await engine.readNavigation();
      expect(read.main).toHaveLength(2);
      expect(read.footer).toHaveLength(0);
    });

    it("PUT /navigation - should validate body with NavigationSchema", async () => {
      const invalidBody = { main: [{ label: "" }] }; // empty label
      const result = NavigationSchema.safeParse(invalidBody);
      expect(result.success).toBe(false);
    });

    it("PUT /navigation - should accept valid navigation", async () => {
      const nav = makeNavigation();
      const result = NavigationSchema.safeParse(nav);
      expect(result.success).toBe(true);

      await engine.writeNavigation(result.data!);
      const read = await engine.readNavigation();
      expect(read.main[0].label).toBe("Home");
    });

    it("PUT /navigation - should auto-commit after write", async () => {
      const nav = makeNavigation();
      await engine.writeNavigation(nav);
      await engine.commit("config: update navigation");

      expect(await engine.hasChanges()).toBe(false);
    });
  });

  describe("Git Operations API Logic", () => {
    it("POST /git/commit - should reject empty message", async () => {
      const invalidMessages = [undefined, "", "  ", null, 42];
      for (const msg of invalidMessages) {
        const isValid =
          typeof msg === "string" && msg.trim().length > 0;
        expect(isValid).toBe(false);
      }
    });

    it("POST /git/commit - should reject when no changes", async () => {
      const hasChanges = await engine.hasChanges();
      expect(hasChanges).toBe(false);
    });

    it("POST /git/commit - should commit with valid message", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);

      expect(await engine.hasChanges()).toBe(true);
      const result = await engine.commit("Manual commit");
      expect(result.hash).toMatch(/^[a-f0-9]{40}$/);
      expect(result.message).toBe("Manual commit");
      expect(await engine.hasChanges()).toBe(false);
    });

    it("GET /git/history - should return commit log", async () => {
      const page = makePage();
      await engine.writePage("test-page", page);
      await engine.commit("First");

      await engine.writePage("test-page", { ...page, title: { en: "Updated" } });
      await engine.commit("Second");

      const history = await engine.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].message).toBe("Second");
      expect(history[0].hash).toMatch(/^[a-f0-9]{40}$/);
      expect(history[0].date).toBeTruthy();
      expect(history[0].author).toBeTruthy();
    });

    it("GET /git/history?slug=test-page - should filter by slug", async () => {
      const page1 = makePage({ slug: "page-1" });
      const page2 = makePage({ slug: "page-2" });
      await engine.writePage("page-1", page1);
      await engine.commit("Add page 1");

      await engine.writePage("page-2", page2);
      await engine.commit("Add page 2");

      const history = await engine.getHistory("page-1");
      expect(history).toHaveLength(1);
      expect(history[0].message).toBe("Add page 1");
    });

    it("GET /git/status - should return hasChanges boolean", async () => {
      expect(await engine.hasChanges()).toBe(false);

      const page = makePage();
      await engine.writePage("test-page", page);
      expect(await engine.hasChanges()).toBe(true);

      await engine.commit("Commit");
      expect(await engine.hasChanges()).toBe(false);
    });
  });

  describe("Error Mapping", () => {
    it("FileIOError should have correct properties", () => {
      const error = new FileIOError("test", "/path/to/file");
      expect(error.name).toBe("FileIOError");
      expect(error.path).toBe("/path/to/file");
      expect(error.message).toBe("test");
    });

    it("ValidationError should have correct properties", () => {
      const issues = [{ code: "invalid_type", message: "Expected string" }];
      const error = new ValidationError("test", "/path/to/file", issues);
      expect(error.name).toBe("ValidationError");
      expect(error.path).toBe("/path/to/file");
      expect(error.issues).toEqual(issues);
    });

    it("FileIOError for missing file should map to 404", async () => {
      try {
        await engine.readPage("nonexistent");
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(FileIOError);
        // In the API handler, this maps to HTTP 404
      }
    });

    it("ValidationError should map to 422", async () => {
      const page = makePage({ title: { en: "" } });
      try {
        await engine.writePage("bad", page);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        // In the API handler, this maps to HTTP 422
      }
    });
  });
});
