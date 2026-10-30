// ==============================================================================
// Client-Side Inverted Icon Index Search Engine
// See: docs/rfcs/011-inverted-icon-index-and-search.md
// ==============================================================================

export interface IconRecord {
  id: string;
  provider: string; // 'yoto' | 'noto-emoji' | 'custom'
  title: string;
  path: string; // Relative asset path, e.g. 'icons/a1b2c3d4.png' or full URL
  tags: string[];
  mediaId?: string;
  displayIconId?: string;
}

export interface IconCatalogData {
  version: number;
  icons: IconRecord[];
  index: Record<string, number[]>;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "of",
  "in",
  "for",
  "with",
  "on",
  "at",
  "to",
  "is",
]);

/**
 * Normalizes text: lowercases, strips diacritics, removes punctuation,
 * and splits into distinct whole-word search tokens.
 */
export function tokenizeText(text: string): string[] {
  if (!text) return [];

  // 1. Lowercase and strip accents/diacritics (e.g. café -> cafe)
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 2. Split on hyphens, underscores, slashes, spaces, and punctuation
  const words = normalized.split(/[^a-z0-9]+/);

  // 3. Filter out empty tokens and stop-words
  return words.filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

/**
 * Builds an inverted index mapping search tokens to array indices of icons.
 */
export function buildInvertedIndex(
  icons: IconRecord[],
): Record<string, number[]> {
  const index: Record<string, number[]> = {};

  icons.forEach((icon, idx) => {
    const tokens = new Set<string>();

    // Tokenize title (higher relevance)
    for (const t of tokenizeText(icon.title)) {
      tokens.add(t);
    }

    // Tokenize tags and category identifiers
    for (const tag of icon.tags || []) {
      for (const t of tokenizeText(tag)) {
        tokens.add(t);
      }
    }

    tokens.forEach((token) => {
      if (!index[token]) {
        index[token] = [];
      }
      index[token].push(idx);
    });
  });

  return index;
}

export class IconSearchEngine {
  private catalog: IconCatalogData;

  constructor(catalog?: IconCatalogData) {
    this.catalog = catalog || { version: 1, icons: [], index: {} };
  }

  public setCatalog(catalog: IconCatalogData): void {
    this.catalog = catalog;
  }

  public getIcons(): IconRecord[] {
    return this.catalog.icons;
  }

  /**
   * Adds newly fetched icon records to the in-memory catalog and incrementally
   * updates the inverted search index without rebuilding the entire index.
   */
  public addIcons(newIcons: IconRecord[]): void {
    const existingIds = new Set(this.catalog.icons.map((i) => i.id));
    const toAdd = newIcons.filter((i) => !existingIds.has(i.id));
    if (toAdd.length === 0) return;

    for (const icon of toAdd) {
      const idx = this.catalog.icons.length;
      this.catalog.icons.push(icon);

      const tokens = new Set<string>();
      for (const t of tokenizeText(icon.title)) {
        tokens.add(t);
      }
      for (const tag of icon.tags || []) {
        for (const t of tokenizeText(tag)) {
          tokens.add(t);
        }
      }
      tokens.forEach((token) => {
        if (!this.catalog.index[token]) {
          this.catalog.index[token] = [];
        }
        this.catalog.index[token].push(idx);
      });
    }
  }

  /**
   * Searches the catalog using multi-word queries with AND intersection,
   * prefix matching, and title-relevance ranking.
   */
  public search(
    query: string,
    options?: {
      provider?: string;
      limit?: number;
    },
  ): IconRecord[] {
    const rawTokens = tokenizeText(query);
    const limit = options?.limit ?? 100;
    const provider = options?.provider;

    // Filter helper
    const matchesProvider = (icon: IconRecord) =>
      !provider || provider === "all" || icon.provider === provider;

    // If query is empty, return initial page of icons
    if (rawTokens.length === 0) {
      const results: IconRecord[] = [];
      for (const icon of this.catalog.icons) {
        if (matchesProvider(icon)) {
          results.push(icon);
          if (results.length >= limit) break;
        }
      }
      return results;
    }

    // Lookup candidate indices for each query token (exact or prefix match)
    const tokenMatches: number[][] = rawTokens.map((token) => {
      const matchingIndices = new Set<number>();
      for (const [indexedToken, indices] of Object.entries(
        this.catalog.index,
      )) {
        if (indexedToken.startsWith(token)) {
          for (const idx of indices) {
            matchingIndices.add(idx);
          }
        }
      }
      return Array.from(matchingIndices);
    });

    // 1. Multi-word AND intersection
    let candidateIndices = tokenMatches[0] || [];
    for (let i = 1; i < tokenMatches.length; i++) {
      const currentSet = new Set(tokenMatches[i]);
      candidateIndices = candidateIndices.filter((idx) => currentSet.has(idx));
    }

    // 2. Graceful OR fallback if intersection yielded zero results
    if (candidateIndices.length === 0) {
      const counts = new Map<number, number>();
      for (const list of tokenMatches) {
        for (const idx of list) {
          counts.set(idx, (counts.get(idx) || 0) + 1);
        }
      }
      candidateIndices = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by hit frequency
        .map(([idx]) => idx);
    }

    // 3. Relevance ranking (title matches ranked above tag matches)
    const scored = candidateIndices
      .map((idx) => {
        const icon = this.catalog.icons[idx];
        if (!icon || !matchesProvider(icon)) return null;

        let score = 0;
        const titleTokens = tokenizeText(icon.title);

        const tagTokens = (icon.tags || []).flatMap((tag) => tokenizeText(tag));

        for (const q of rawTokens) {
          if (titleTokens.some((t) => t === q)) {
            score += 10; // Exact title match
          } else if (titleTokens.some((t) => t.startsWith(q))) {
            score += 5; // Title prefix match
          } else if (tagTokens.some((t) => t === q)) {
            score += 2; // Exact tag match
          } else if (tagTokens.some((t) => t.startsWith(q))) {
            score += 1; // Tag prefix match
          }
        }

        return { icon, score };
      })
      .filter(
        (item): item is { icon: IconRecord; score: number } => item !== null,
      );

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.icon);
  }
}
