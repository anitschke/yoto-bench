// ==============================================================================
// Incremental Icon Provider Synchronization Pipeline
// See: AGENTS.md, docs/rfcs/011-inverted-icon-index-and-search.md
// ==============================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { IconProvider } from "./icons/types.js";
import { NotoEmojiProvider } from "./icons/noto-emoji-provider.js";
import { YotoOfficialProvider } from "./icons/yoto-official-provider.js";
import {
  IconCatalogData,
  buildInvertedIndex,
} from "../src/services/icon-search.js";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DATA_FILE = path.join(ROOT_DIR, "src/data/icons.json");
const ASSETS_DIR = path.join(ROOT_DIR, "public/assets/icons");
const TOOLS_ICONS_DIR = path.join(ROOT_DIR, "tools/icons");

const providers: IconProvider[] = [
  new NotoEmojiProvider(),
  new YotoOfficialProvider(),
];

async function normalizeImage(
  rawBytes: Uint8Array | Buffer,
): Promise<Buffer> {
  return await sharp(rawBytes)
    .resize(16, 16, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

export async function runSync(): Promise<void> {
  console.log("Starting incremental icon synchronization...");

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Load existing catalog
  let catalog: IconCatalogData = { version: 1, icons: [], index: {} };
  if (fs.existsSync(DATA_FILE)) {
    try {
      catalog = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8"),
      ) as IconCatalogData;
    } catch {
      catalog = { version: 1, icons: [], index: {} };
    }
  }

  let totalNewIcons = 0;

  for (const provider of providers) {
    const stateFile = path.join(TOOLS_ICONS_DIR, `${provider.name}.json`);
    let existingMetadata: unknown = undefined;
    if (fs.existsSync(stateFile)) {
      try {
        existingMetadata = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      } catch {
        existingMetadata = undefined;
      }
    }

    console.log(`Checking provider: ${provider.name}...`);
    const result = await provider.fetchIcons(existingMetadata);

    if (result.icons.length > 0) {
      console.log(
        `Discovered ${result.icons.length} new icons from ${provider.name}. Processing...`,
      );

      for (const raw of result.icons) {
        try {
          const normalized = await normalizeImage(raw.imageBytes);
          const hash = crypto
            .createHash("sha256")
            .update(normalized)
            .digest("hex");
          const filename = `${hash}.png`;
          const destPath = path.join(ASSETS_DIR, filename);

          if (!fs.existsSync(destPath)) {
            fs.writeFileSync(destPath, normalized);
          }

          catalog.icons.push({
            id: raw.id,
            provider: raw.provider,
            title: raw.title,
            path: `assets/icons/${filename}`,
            tags: raw.tags,
            mediaId: raw.mediaId,
            displayIconId: raw.displayIconId,
          });
          totalNewIcons++;
        } catch (err) {
          console.warn(`Failed to process icon ${raw.id}:`, err);
        }
      }
    } else {
      console.log(`No new icons found for ${provider.name}.`);
    }

    // Save updated provider state
    fs.writeFileSync(stateFile, JSON.stringify(result.metadata, null, 2));
  }

  if (totalNewIcons > 0 || Object.keys(catalog.index).length === 0) {
    console.log("Updating inverted search index...");
    catalog.index = buildInvertedIndex(catalog.icons);

    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(catalog, null, 2) + "\n");
    console.log(
      `Sync complete. Added ${totalNewIcons} icons. Total: ${catalog.icons.length}`,
    );
  } else {
    console.log("Sync complete. Catalog is already up-to-date.");
  }
}

if (process.argv[1] && process.argv[1].endsWith("sync-icons.ts")) {
  runSync().catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
}
