import { join } from "path";
import { mkdir } from "fs/promises";
import {
  PageSchema,
  SiteConfigSchema,
  NavigationSchema,
  PageListItemSchema,
  type Page,
  type PageListItem,
  type SiteConfig,
  type Navigation,
} from "@openpress/schemas";
import {
  readJSON,
  writeJSON,
  deleteFile,
  listJSONFiles,
  fileExists,
} from "./file-io";
import { GitOps, type CommitResult, type CommitLogEntry } from "./git";

export interface StorageEngineOptions {
  /** Root directory for content files. Default: ./content */
  contentDir: string;
  /** Root of the git repository. Default: process.cwd() */
  repoRoot?: string;
}

export class StorageEngine {
  private readonly contentDir: string;
  private readonly pagesDir: string;
  private readonly git: GitOps;

  constructor(options: StorageEngineOptions) {
    this.contentDir = options.contentDir;
    this.pagesDir = join(this.contentDir, "pages");
    this.git = new GitOps(options.repoRoot ?? process.cwd());
  }

  /** Ensure content directories exist */
  async init(): Promise<void> {
    await mkdir(this.pagesDir, { recursive: true });
    await this.git.init();
  }

  // --- Pages ---

  async readPage(slug: string): Promise<Page> {
    const filePath = this.pagePath(slug);
    return readJSON(filePath, PageSchema);
  }

  async writePage(slug: string, page: Page): Promise<void> {
    const filePath = this.pagePath(slug);
    await writeJSON(filePath, page, PageSchema);
  }

  async deletePage(slug: string): Promise<void> {
    const filePath = this.pagePath(slug);
    await deleteFile(filePath);
  }

  async listPages(): Promise<PageListItem[]> {
    const files = await listJSONFiles(this.pagesDir);
    const pages: PageListItem[] = [];

    for (const file of files) {
      const page = await readJSON(file, PageSchema);
      pages.push(
        PageListItemSchema.parse({
          slug: page.slug,
          title: page.title,
          updatedAt: page.updatedAt,
          createdAt: page.createdAt,
        })
      );
    }

    return pages;
  }

  async pageExists(slug: string): Promise<boolean> {
    return fileExists(this.pagePath(slug));
  }

  // --- Site Config ---

  async readSiteConfig(): Promise<SiteConfig> {
    return readJSON(this.siteConfigPath(), SiteConfigSchema);
  }

  async writeSiteConfig(config: SiteConfig): Promise<void> {
    await writeJSON(this.siteConfigPath(), config, SiteConfigSchema);
  }

  // --- Navigation ---

  async readNavigation(): Promise<Navigation> {
    return readJSON(this.navigationPath(), NavigationSchema);
  }

  async writeNavigation(nav: Navigation): Promise<void> {
    await writeJSON(this.navigationPath(), nav, NavigationSchema);
  }

  // --- Git ---

  async commit(message: string): Promise<CommitResult> {
    await this.git.addAll(this.contentDir);
    return this.git.commit(message);
  }

  async getHistory(slug?: string): Promise<CommitLogEntry[]> {
    const path = slug ? this.pagePath(slug) : this.contentDir;
    return this.git.log(path);
  }

  async hasChanges(): Promise<boolean> {
    return this.git.hasChanges();
  }

  // --- Helpers ---

  private pagePath(slug: string): string {
    return join(this.pagesDir, `${slug}.json`);
  }

  private siteConfigPath(): string {
    return join(this.contentDir, "site.json");
  }

  private navigationPath(): string {
    return join(this.contentDir, "navigation.json");
  }
}
