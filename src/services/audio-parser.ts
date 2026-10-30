import { BlobReader, BlobWriter, ZipReader } from "@zip.js/zip.js";

// ==============================================================================
// Audio Parsing & Streaming ZIP Extraction Engine
// See: docs/rfcs/008-audio-ingestion-zip-and-upload-concurrency.md
// ==============================================================================

export interface AudioTrackMetadata {
  title: string;
  artist?: string;
  album?: string;
  trackNumber?: number;
  diskNumber?: number;
  duration?: number; // In seconds
  format?: string;
}

export interface ExtractedAudioFile {
  name: string;
  blob: Blob;
  metadata?: AudioTrackMetadata;
}

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "m4a",
  "aac",
  "wav",
  "ogg",
  "flac",
  "opus",
]);

/**
 * Returns whether a filename has a supported audio extension.
 */
export function isAudioFile(filename: string): boolean {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  return AUDIO_EXTENSIONS.has(ext);
}

/**
 * Returns whether a filename is a ZIP archive.
 */
export function isZipFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".zip");
}

/**
 * Strips track numbers and file extensions from a filename to form a clean title.
 * e.g. "01 - Good Morning.mp3" -> "Good Morning"
 */
export function cleanTitleFromFilename(filename: string): string {
  let name = filename.replace(/^.*[\\/]/, ""); // strip directories
  name = name.replace(/\.[^/.]+$/, ""); // strip extension
  name = name.replace(/^(\d+[\s._-]+)+/, ""); // strip leading numbers like "01 - " or "01."
  name = name.trim();
  return name || filename;
}

/**
 * Streams and decompresses an uploaded or dropped ZIP archive without memory blowouts.
 */
export async function extractZipArchive(
  zipBlob: Blob,
  onProgress?: (percent: number, currentFile: string) => void,
): Promise<{ name: string; blob: Blob }[]> {
  const zipReader = new ZipReader(new BlobReader(zipBlob));
  const entries = await zipReader.getEntries();
  const results: { name: string; blob: Blob }[] = [];

  const audioEntries = entries.filter((entry) => {
    if (entry.directory) return false;
    const filename = entry.filename;
    if (filename.includes("__MACOSX/") || filename.endsWith(".DS_Store")) {
      return false;
    }
    return isAudioFile(filename);
  });

  const total = audioEntries.length;
  for (let i = 0; i < total; i++) {
    const entry = audioEntries[i];
    if (!entry) continue;
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100), entry.filename);
    }
    if ("getData" in entry && typeof entry.getData === "function") {
      const writer = new BlobWriter();
      const blob = await (
        entry as unknown as { getData: (w: BlobWriter) => Promise<Blob> }
      ).getData(writer);
      results.push({ name: entry.filename, blob });
    }
  }

  await zipReader.close();
  return results;
}

interface ParsedMetadataResult {
  format: { duration?: number; container?: string };
  common: {
    title?: string;
    artist?: string;
    album?: string;
    track: { no: number | null };
    disk: { no: number | null };
  };
}

interface MmbExports {
  parseBlob?: (b: Blob) => Promise<ParsedMetadataResult>;
  default?: {
    parseBlob?: (b: Blob) => Promise<ParsedMetadataResult>;
  };
}

/**
 * Extracts ID3 / audio metadata directly from a Blob or File.
 */
export async function parseAudioMetadata(
  blob: Blob,
  filename: string,
): Promise<AudioTrackMetadata> {
  const fallbackTitle = cleanTitleFromFilename(filename);

  try {
    const mmb = (await import("music-metadata-browser").catch(
      () => null,
    )) as MmbExports | null;
    const parseFn = mmb?.parseBlob || mmb?.default?.parseBlob;
    if (typeof parseFn !== "function") {
      throw new Error("music-metadata parseBlob is not available");
    }
    const metadata = await parseFn(blob);
    const duration = metadata.format.duration
      ? Math.round(metadata.format.duration)
      : undefined;

    return {
      title: metadata.common.title?.trim() || fallbackTitle,
      artist: metadata.common.artist?.trim(),
      album: metadata.common.album?.trim(),
      trackNumber: metadata.common.track.no || undefined,
      diskNumber: metadata.common.disk.no || undefined,
      duration,
      format: metadata.format.container || "audio",
    };
  } catch {
    // If metadata parsing fails (e.g. malformed or unsupported tags), fall back gracefully
    return {
      title: fallbackTitle,
      format: "audio",
    };
  }
}

/**
 * Sorts audio tracks in natural playback order: disk number, track number, then filename.
 */
export function sortAudioTracks<
  T extends { name: string; metadata?: AudioTrackMetadata },
>(tracks: T[]): T[] {
  return [...tracks].sort((a, b) => {
    const diskA = a.metadata?.diskNumber ?? 1;
    const diskB = b.metadata?.diskNumber ?? 1;
    if (diskA !== diskB) return diskA - diskB;

    const trackA = a.metadata?.trackNumber;
    const trackB = b.metadata?.trackNumber;
    if (trackA !== undefined && trackB !== undefined && trackA !== trackB) {
      return trackA - trackB;
    }

    // Fall back to natural collation of filename
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export const extractAudioFromZip = extractZipArchive;
