// ==============================================================================
// Official Yoto Display Icon Provider
// See: AGENTS.md, docs/rfcs/011-inverted-icon-index-and-search.md, docs/rfcs/013-yoto-official-icon-provider.md
// ==============================================================================

import { IconProvider, IconsSyncResult, RawIconItem } from "./types.js";

export interface YotoMetadata {
  knownIconIds: string[];
}

interface YotoDisplayIconApiItem {
  displayIconId: string;
  title?: string;
  tags?: string[];
  mediaId?: string;
  icon16x16?: string;
}

export class YotoOfficialProvider implements IconProvider<YotoMetadata> {
  readonly name = "yoto";

  async fetchIcons(
    existingMetadata?: YotoMetadata,
  ): Promise<IconsSyncResult<YotoMetadata>> {
    const knownIds = new Set(existingMetadata?.knownIconIds || []);
    const newIcons: RawIconItem[] = [];

    try {
      const resp = await fetch(
        "https://api.yotoplay.com/media/displayIcons/user/yoto",
        {
          headers: { "User-Agent": "yoto-bench-icon-sync" },
          signal: AbortSignal.timeout(6000),
        },
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          displayIcons?: YotoDisplayIconApiItem[];
        };
        const items = data.displayIcons || [];

        for (const item of items) {
          if (!item.displayIconId || knownIds.has(item.displayIconId)) {
            continue;
          }

          if (item.icon16x16) {
            try {
              const imgResp = await fetch(item.icon16x16, {
                signal: AbortSignal.timeout(5000),
              });
              if (imgResp.ok) {
                const buffer = new Uint8Array(await imgResp.arrayBuffer());
                newIcons.push({
                  id: item.displayIconId,
                  provider: this.name,
                  title: item.title || item.displayIconId,
                  tags: item.tags || [],
                  imageBytes: buffer,
                  mediaId: item.mediaId,
                  displayIconId: item.displayIconId,
                });
                knownIds.add(item.displayIconId);
              }
            } catch {
              // Skip single icon download failure
            }
          }
        }
      }
    } catch {
      // Offline or network error during sync/rebuild; gracefully proceed
    }

    return {
      icons: newIcons,
      metadata: {
        knownIconIds: Array.from(knownIds),
      },
    };
  }
}
