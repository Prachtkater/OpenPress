export interface CommitResult {
  hash: string;
  message: string;
}

export interface CommitLogEntry {
  hash: string;
  message: string;
  date: string;
  author: string;
}

/**
 * Git operations using child_process for Node.js/Nitro compatibility.
 * (Bun.spawn is not available inside Nitro server runtime.)
 */
export class GitOps {
  constructor(private readonly repoPath: string) {}

  private async exec(args: string[]): Promise<string> {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);

    try {
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.repoPath,
        maxBuffer: 10 * 1024 * 1024,
      });
      return stdout.trim();
    } catch (err: any) {
      const stderr = err.stderr?.trim();
      const stdout = err.stdout?.trim();
      const details = stderr || stdout || err.message;
      const code = err.code ?? 1;
      throw new Error(`git ${args[0]} failed (${code}): ${details}`);
    }
  }

  /** Stage specific files */
  async add(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    await this.exec(["add", ...paths]);
  }

  /** Stage all changes in a directory */
  async addAll(dirPath?: string): Promise<void> {
    const args = dirPath ? ["add", "-A", dirPath] : ["add", "-A"];
    await this.exec(args);
  }

  /** Create a commit with the given message */
  async commit(message: string): Promise<CommitResult> {
    await this.exec(["commit", "-m", message]);
    const hash = await this.exec(["rev-parse", "HEAD"]);
    return { hash, message };
  }

  /** Check if there are staged, unstaged, or untracked changes */
  async hasChanges(): Promise<boolean> {
    const status = await this.exec(["status", "--porcelain"]);
    return status.length > 0;
  }

  /** Get commit history, optionally filtered by path */
  async log(
    path?: string,
    limit: number = 20
  ): Promise<CommitLogEntry[]> {
    const args = [
      "log",
      `--max-count=${limit}`,
      "--format=%H|%s|%aI|%an",
    ];
    if (path) args.push("--", path);

    const output = await this.exec(args);
    if (!output) return [];

    return output.split("\n").map((line) => {
      const [hash, message, date, author] = line.split("|");
      return { hash, message, date, author };
    });
  }

  /** Rollback to a specific commit */
  async rollback(hash: string, path?: string): Promise<void> {
    if (path) {
      // Restore a specific path from a specific commit
      await this.exec(["checkout", hash, "--", path]);
    } else {
      // Hard reset to a specific commit
      await this.exec(["reset", "--hard", hash]);
    }
  }

  /** Initialize a new git repo if not already initialized */
  async init(): Promise<void> {
    try {
      await this.exec(["rev-parse", "--git-dir"]);
    } catch {
      await this.exec(["init"]);
    }
  }
}
