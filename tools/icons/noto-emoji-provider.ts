// ==============================================================================
// Google Noto Emoji Icon Provider
// See: AGENTS.md, docs/rfcs/011-inverted-icon-index-and-search.md, docs/rfcs/012-noto-emoji-icon-provider.md
// ==============================================================================

import fs from "node:fs";
import path from "node:path";
import { IconProvider, IconsSyncResult, RawIconItem } from "./types.js";

export interface NotoMetadata {
  notoCommitHash: string;
  cldrCommitHash: string;
}

export class NotoEmojiProvider implements IconProvider<NotoMetadata> {
  readonly name = "noto-emoji";

  async fetchIcons(
    existingMetadata?: NotoMetadata,
  ): Promise<IconsSyncResult<NotoMetadata>> {
    // Routine sync with existing metadata: Check commit hashes
    if (existingMetadata) {
      try {
        const [notoResp, cldrResp] = await Promise.all([
          fetch(
            "https://api.github.com/repos/googlefonts/noto-emoji/commits/main",
            { headers: { "User-Agent": "yoto-bench-icon-sync" } },
          ),
          fetch("https://api.github.com/repos/unicode-org/cldr/commits/main", {
            headers: { "User-Agent": "yoto-bench-icon-sync" },
          }),
        ]);

        if (notoResp.ok && cldrResp.ok) {
          const notoData = (await notoResp.json()) as { sha?: string };
          const cldrData = (await cldrResp.json()) as { sha?: string };

          const latestNoto = notoData.sha || existingMetadata.notoCommitHash;
          const latestCldr = cldrData.sha || existingMetadata.cldrCommitHash;

          if (
            latestNoto !== existingMetadata.notoCommitHash ||
            latestCldr !== existingMetadata.cldrCommitHash
          ) {
            console.warn(
              "::warning file=tools/icons/noto-emoji-provider.ts::Upstream Noto Emoji or CLDR update detected. Run 'npm run rebuild:icons -- --provider=noto-emoji' to update.",
            );
          }
        }
      } catch {
        // Network or rate-limit issue; skip silently during offline runs
      }

      return {
        icons: [],
        metadata: existingMetadata,
      };
    }

    // Rebuild mode: Load from local seed if available
    const seedGoFile =
      "/home/anitschk/sandbox/yotocli/internal/actions/notoicons/generated_data.go";
    const seedImgDir =
      "/home/anitschk/sandbox/yotocli/internal/actions/notoicons/images";

    const icons: RawIconItem[] = [];

    if (fs.existsSync(seedGoFile) && fs.existsSync(seedImgDir)) {
      const content = fs.readFileSync(seedGoFile, "utf8");
      const regex =
        /{\s*ID:\s*"([^"]+)",\s*Filename:\s*"([^"]+)",\s*Title:\s*"([^"]+)",\s*Tags:\s*\[\]string\{([^}]*)\},\s*},/g;

      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const id = `noto_${match[1]}`;
        const filename = match[2];
        const title = match[3];
        const rawTags = match[4];
        if (!filename || !title || rawTags === undefined) continue;

        const tags = rawTags
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, ""))
          .filter(Boolean);

        const imgPath = path.join(seedImgDir, filename);
        if (fs.existsSync(imgPath)) {
          const imageBytes = fs.readFileSync(imgPath);
          icons.push({
            id,
            provider: this.name,
            title,
            tags,
            imageBytes,
          });
        }
      }
    }

    return {
      icons,
      metadata: {
        notoCommitHash: "e8d4a9f027b1e06fa5312cfb5a329d99d1469e71",
        cldrCommitHash: "7c2b1a0e5b9487fa2bb38de25c798a7a92233cf3",
      },
    };
  }
}
