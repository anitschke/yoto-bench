// ==============================================================================
// Podcast RSS Ingestion & Synchronization Engine
// See: AGENTS.md, docs/rfcs/009-cors-proxy-for-rss-feeds.md, docs/rfcs/010-podcast-rss-importer-and-card-sync.md
// ==============================================================================

import { getActiveCorsProxyUrl } from "../config.js";

export interface PodcastEpisode {
  title: string;
  description?: string;
  pubDate?: string;
  duration?: number; // in seconds
  enclosureUrl: string;
  explicit?: boolean;
}

export interface ParsedPodcastFeed {
  title: string;
  description?: string;
  imageUrl?: string;
  episodes: PodcastEpisode[];
}

export interface EpisodeFilterOptions {
  limit?: number;
  order?: "newest" | "oldest";
  minDurationSeconds?: number;
  excludeExplicit?: boolean;
}

export interface CardSyncMetadata {
  version: number;
  sourceType: "podcast-rss";
  feedUrl: string;
  filter: {
    limit?: number;
    order?: "newest" | "oldest";
    minDurationSeconds?: number;
  };
  lastSynced?: string;
}

const SYNC_BLOCK_REGEX = /<!--\s*yoto-bench:sync\s*\n([\s\S]*?)\n-->/;

/**
 * Parses duration string (seconds or HH:MM:SS or MM:SS) into numeric seconds.
 */
export function parseDurationToSeconds(
  durationStr?: string | null,
): number | undefined {
  if (!durationStr) return undefined;
  const trimmed = durationStr.trim();
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  const parts = trimmed.split(":").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]!) && !isNaN(parts[1]!)) {
    return parts[0]! * 60 + parts[1]!;
  }
  if (
    parts.length === 3 &&
    !isNaN(parts[0]!) &&
    !isNaN(parts[1]!) &&
    !isNaN(parts[2]!)
  ) {
    return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  }
  return undefined;
}

/**
 * Fetches RSS feed XML using the multi-tiered CORS strategy (RFC 009):
 * 1. Tier 1: Direct fetch with short timeout.
 * 2. Tier 2: Public CORS proxy (corsproxy.io).
 * 3. Throws on failure to allow caller to trigger Tier 3 interactive fallback.
 */
export async function fetchFeedXml(
  feedUrl: string,
  customProxyUrl?: string,
): Promise<string> {
  // Tier 1: Direct fetch
  try {
    const directResp = await fetch(feedUrl, {
      signal: AbortSignal.timeout(4000),
    });
    if (directResp.ok) {
      return await directResp.text();
    }
  } catch {
    // Direct fetch failed (likely CORS or timeout); fall through to Tier 2
  }

  // Tier 2: CORS Proxy
  const proxyBase = customProxyUrl || getActiveCorsProxyUrl();
  const proxyTarget = `${proxyBase}${encodeURIComponent(feedUrl)}`;

  const proxyResp = await fetch(proxyTarget, {
    signal: AbortSignal.timeout(8000),
  });

  if (!proxyResp.ok) {
    throw new Error(
      `Failed to fetch RSS feed via proxy (${proxyResp.status}: ${proxyResp.statusText})`,
    );
  }

  return await proxyResp.text();
}

/**
 * Parses raw podcast RSS XML string into normalized data structure using browser DOMParser.
 */
export function parsePodcastFeed(xmlText: string): ParsedPodcastFeed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(`Invalid XML format: ${parserError.textContent}`);
  }

  const channel = doc.querySelector("channel");
  if (!channel) {
    throw new Error("Invalid RSS feed: missing <channel> element");
  }

  const title =
    channel.querySelector("title")?.textContent?.trim() || "Untitled Podcast";
  const description = channel.querySelector("description")?.textContent?.trim();

  // Cover image: either <itunes:image href="..."> or <image><url>...</url></image>
  let imageUrl: string | undefined = undefined;
  const itunesImage = channel.getElementsByTagName("itunes:image")[0];
  if (itunesImage && itunesImage.getAttribute("href")) {
    imageUrl = itunesImage.getAttribute("href") || undefined;
  } else {
    const imgUrlEl = channel.querySelector("image > url");
    if (imgUrlEl && imgUrlEl.textContent) {
      imageUrl = imgUrlEl.textContent.trim();
    }
  }

  // Items / Episodes
  const items = Array.from(channel.querySelectorAll("item"));
  const episodes: PodcastEpisode[] = [];

  for (const item of items) {
    const enclosure = item.querySelector("enclosure");
    const enclosureUrl = enclosure?.getAttribute("url");
    if (!enclosureUrl) continue;

    const epTitle =
      item.querySelector("title")?.textContent?.trim() || "Untitled Episode";
    const epDesc = item.querySelector("description")?.textContent?.trim();
    const pubDate = item.querySelector("pubDate")?.textContent?.trim();

    // Duration: <itunes:duration>
    const durationEl = item.getElementsByTagName("itunes:duration")[0];
    const duration = parseDurationToSeconds(durationEl?.textContent);

    // Explicit: <itunes:explicit>
    const explicitEl = item.getElementsByTagName("itunes:explicit")[0];
    const explicitText = explicitEl?.textContent?.toLowerCase().trim();
    const explicit = explicitText === "yes" || explicitText === "true";

    episodes.push({
      title: epTitle,
      description: epDesc,
      pubDate,
      duration,
      enclosureUrl,
      explicit,
    });
  }

  return {
    title,
    description,
    imageUrl,
    episodes,
  };
}

/**
 * Filters and sorts parsed podcast episodes based on user criteria.
 */
export function filterEpisodes(
  episodes: PodcastEpisode[],
  options: EpisodeFilterOptions = {},
): PodcastEpisode[] {
  let filtered = [...episodes];

  // Exclude explicit if requested
  if (options.excludeExplicit) {
    filtered = filtered.filter((ep) => !ep.explicit);
  }

  // Minimum duration filter (e.g. drop promos < 120s)
  if (
    options.minDurationSeconds !== undefined &&
    options.minDurationSeconds > 0
  ) {
    filtered = filtered.filter(
      (ep) =>
        ep.duration === undefined || ep.duration >= options.minDurationSeconds!,
    );
  }

  // Sort order: default newest first
  if (options.order === "oldest") {
    filtered.sort((a, b) => {
      const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return timeA - timeB;
    });
  } else {
    // Newest first
    filtered.sort((a, b) => {
      const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return timeB - timeA;
    });
  }

  // Limit count
  if (options.limit !== undefined && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Extracts embedded sync configuration metadata from a card description.
 */
export function extractSyncMetadata(
  description?: string,
): CardSyncMetadata | null {
  if (!description) return null;

  const match = description.match(SYNC_BLOCK_REGEX);
  if (!match || !match[1]) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed && parsed.sourceType === "podcast-rss" && parsed.feedUrl) {
      return parsed as CardSyncMetadata;
    }
  } catch {
    // Invalid JSON inside sync block, treat as null
  }

  return null;
}

/**
 * Serializes sync metadata into card description, preserving existing non-sync text.
 */
export function embedSyncMetadata(
  description: string | undefined,
  metadata: CardSyncMetadata,
): string {
  const cleanDescription = stripSyncMetadata(description);
  const block = `<!-- yoto-bench:sync\n${JSON.stringify(metadata, null, 2)}\n-->`;

  if (!cleanDescription) {
    return block;
  }

  return `${cleanDescription}\n\n${block}`;
}

/**
 * Strips the sync block from the card description for clean user presentation.
 */
export function stripSyncMetadata(description?: string): string {
  if (!description) return "";
  return description.replace(SYNC_BLOCK_REGEX, "").trim();
}
