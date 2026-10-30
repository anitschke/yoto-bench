// ==============================================================================
// OPFS (Origin Private File System) Staging Service
// See: docs/rfcs/008-audio-ingestion-zip-and-upload-concurrency.md
//      AGENTS.md Section 2 (Storage & Persistence Policies)
// ==============================================================================

export class OpfsStagingService {
  private baseDir = "yoto_bench_staging";
  private fallbackStore = new Map<string, Map<string, Blob>>();

  private isOpfsSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.storage?.getDirectory === "function"
    );
  }

  private async getSessionDir(
    sessionKey: string,
    create = true,
  ): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isOpfsSupported()) return null;
    try {
      const root = await navigator.storage.getDirectory();
      const base = await root.getDirectoryHandle(this.baseDir, { create });
      return await base.getDirectoryHandle(sessionKey, { create });
    } catch {
      return null;
    }
  }

  /**
   * Writes an audio stream, Blob, or Uint8Array to OPFS disk storage under the specified session key.
   */
  public async saveFile(
    sessionKey: string,
    fileName: string,
    data: Blob | Uint8Array,
  ): Promise<void> {
    const dir = await this.getSessionDir(sessionKey, true);
    if (dir) {
      const fileHandle = await dir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      if (data instanceof Blob) {
        await writable.write(data);
      } else {
        await writable.write(data.buffer);
      }
      await writable.close();
      return;
    }

    // In-memory fallback if OPFS is unavailable in current runtime
    let sessionMap = this.fallbackStore.get(sessionKey);
    if (!sessionMap) {
      sessionMap = new Map<string, Blob>();
      this.fallbackStore.set(sessionKey, sessionMap);
    }
    const blob = data instanceof Blob ? data : new Blob([data]);
    sessionMap.set(fileName, blob);
  }

  /**
   * Retrieves an audio file from OPFS storage as a standard Blob/File.
   */
  public async getFile(
    sessionKey: string,
    fileName: string,
  ): Promise<Blob | null> {
    const dir = await this.getSessionDir(sessionKey, false);
    if (dir) {
      try {
        const fileHandle = await dir.getFileHandle(fileName, { create: false });
        return await fileHandle.getFile();
      } catch {
        return null;
      }
    }

    const sessionMap = this.fallbackStore.get(sessionKey);
    return sessionMap?.get(fileName) || null;
  }

  /**
   * Lists all filenames staged under the specified session key.
   */
  public async listFiles(sessionKey: string): Promise<string[]> {
    const dir = await this.getSessionDir(sessionKey, false);
    if (dir) {
      const files: string[] = [];
      // TypeScript iteration over FileSystemDirectoryHandle async iterable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const [name, handle] of (dir as any).entries()) {
        if (handle.kind === "file") {
          files.push(name);
        }
      }
      return files.sort();
    }

    const sessionMap = this.fallbackStore.get(sessionKey);
    return sessionMap ? Array.from(sessionMap.keys()).sort() : [];
  }

  /**
   * Cleans up all temporary files for a completed or aborted ingestion session.
   */
  public async cleanSession(sessionKey: string): Promise<void> {
    this.fallbackStore.delete(sessionKey);
    if (!this.isOpfsSupported()) return;

    try {
      const root = await navigator.storage.getDirectory();
      const base = await root.getDirectoryHandle(this.baseDir, {
        create: false,
      });
      await base.removeEntry(sessionKey, { recursive: true });
    } catch {
      // Directory may not exist or already removed
    }
  }

  /**
   * Clears the entire staging directory.
   */
  public async clearAll(): Promise<void> {
    this.fallbackStore.clear();
    if (!this.isOpfsSupported()) return;

    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry(this.baseDir, { recursive: true });
    } catch {
      // Base directory may not exist
    }
  }
}

export const opfsStaging = new OpfsStagingService();
export const opfsService = opfsStaging;
