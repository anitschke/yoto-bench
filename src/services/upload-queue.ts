import { yotoApi } from "../api/client.js";
import { Chapter, Track } from "../models/index.js";
import { computeBase64UrlSha256 } from "./hashing.js";
import { AudioTrackMetadata } from "./audio-parser.js";

// ==============================================================================
// Controlled Upload Concurrency Queue (Max 3-4 Streams)
// See: docs/rfcs/008-audio-ingestion-zip-and-upload-concurrency.md
// ==============================================================================

export interface UploadItem {
  id: string;
  name: string;
  blob: Blob;
  metadata?: AudioTrackMetadata;
  iconId?: string;
  status:
    "pending" | "hashing" | "uploading" | "transcoding" | "complete" | "error";
  progress: number; // 0 - 100
  error?: string;
  resultTrack?: Track;
}

export type QueueProgressCallback = (items: UploadItem[]) => void;

export class UploadQueue {
  private concurrency: number;
  private items: UploadItem[] = [];
  private onProgress?: QueueProgressCallback;

  constructor(concurrency = 3) {
    this.concurrency = Math.max(1, Math.min(4, concurrency));
  }

  /**
   * Enqueues and processes audio files through the hashing, S3 upload, and transcode pipeline.
   */
  public async processQueue(
    files: {
      name: string;
      blob: Blob;
      metadata?: AudioTrackMetadata;
      iconId?: string;
    }[],
    onProgress?: QueueProgressCallback,
  ): Promise<Chapter[]> {
    this.onProgress = onProgress;
    this.items = files.map((f, i) => ({
      id: `item-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      blob: f.blob,
      metadata: f.metadata,
      iconId: f.iconId,
      status: "pending",
      progress: 0,
    }));

    this.notify();

    // Process pool with controlled concurrency
    let activeIndex = 0;
    const total = this.items.length;
    const workerPromises: Promise<void>[] = [];

    const worker = async () => {
      while (activeIndex < total) {
        const index = activeIndex++;
        const item = this.items[index];
        if (!item) continue;
        try {
          await this.processItem(item);
        } catch (err) {
          item.status = "error";
          item.error = err instanceof Error ? err.message : String(err);
          this.notify();
        }
      }
    };

    const workerCount = Math.min(this.concurrency, total);
    for (let w = 0; w < workerCount; w++) {
      workerPromises.push(worker());
    }

    await Promise.all(workerPromises);

    // Collect all successful tracks and build chapters
    const chapters: Chapter[] = [];
    for (const item of this.items) {
      if (item.resultTrack) {
        const title = item.metadata?.title || item.name;
        const icon16x16 = item.iconId || "";
        const chapter: Chapter = {
          key: "",
          title,
          duration: item.resultTrack.duration,
          tracks: [item.resultTrack],
          display: icon16x16 ? { icon16x16 } : undefined,
        };
        chapters.push(chapter);
      }
    }

    return chapters;
  }

  private async processItem(item: UploadItem): Promise<void> {
    // 1. Web Crypto SHA-256 Hash
    item.status = "hashing";
    item.progress = 10;
    this.notify();

    const hash = await computeBase64UrlSha256(item.blob);

    // 2. Deduplication check via GET /media/transcode/audio/uploadUrl
    item.status = "uploading";
    item.progress = 25;
    this.notify();

    const uploadResponse = await yotoApi.getUploadUrl(hash, item.name);
    const uploadId = uploadResponse.upload?.uploadId;
    const uploadUrl = uploadResponse.upload?.uploadUrl;

    if (!uploadId) {
      throw new Error(`No upload ID returned for ${item.name}`);
    }

    // 3. Direct presigned S3 PUT (if not deduplicated)
    if (uploadUrl) {
      await yotoApi.uploadFileToS3(
        uploadUrl,
        item.blob,
        "audio/mp3",
        (percent) => {
          // Scale upload progress from 25% to 75%
          item.progress = 25 + Math.round(percent * 0.5);
          this.notify();
        },
      );
    } else {
      // Deduplicated audio: upload skipped!
      item.progress = 75;
      this.notify();
    }

    // 4. Transcode Polling
    item.status = "transcoding";
    item.progress = 80;
    this.notify();

    const transData = await yotoApi.pollTranscode(uploadId);
    const transcodedSha256 = transData.transcodedSha256;

    if (!transcodedSha256) {
      throw new Error(`Transcode completed without hash for ${item.name}`);
    }

    const duration =
      transData.transcodedInfo?.duration || item.metadata?.duration || 0;
    const fileSize = transData.transcodedInfo?.fileSize || item.blob.size;
    const format = transData.transcodedInfo?.format || "opus";
    const title = item.metadata?.title || item.name;
    const icon16x16 = item.iconId || "";

    item.resultTrack = {
      key: "",
      title,
      trackUrl: `yoto:#${transcodedSha256}`,
      duration,
      fileSize,
      format,
      type: "audio",
      display: icon16x16 ? { icon16x16 } : undefined,
    };

    item.status = "complete";
    item.progress = 100;
    this.notify();
  }

  private notify() {
    if (this.onProgress) {
      this.onProgress([...this.items]);
    }
  }
}

/**
 * Renumbers keys and overlay labels across all chapters and nested tracks for consistency.
 * Conforms to yotocli's ReorderPlaylist algorithm (pkg/yoto/models.go).
 */
export function reorderPlaylist(chapters: Chapter[]): Chapter[] {
  return chapters.map((chap, i) => {
    const key = String(i + 1).padStart(2, "0");
    const overlayLabel = String(i + 1);

    const updatedTracks: Track[] = (chap.tracks || []).map((track) => ({
      ...track,
      key,
      overlayLabel,
      display: track.display || chap.display,
    }));

    return {
      ...chap,
      key,
      overlayLabel,
      tracks: updatedTracks,
    };
  });
}

export { UploadQueue as AudioUploadQueue };
