// ==============================================================================
// Icon Catalog Rebuild Script
// See: AGENTS.md, docs/rfcs/011-inverted-icon-index-and-search.md
// ==============================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { IconProvider, RawIconItem } from "./icons/types.js";
import { NotoEmojiProvider } from "./icons/noto-emoji-provider.js";
import { YotoOfficialProvider } from "./icons/yoto-official-provider.js";
import {
  IconRecord,
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

export async function runRebuild(targetProvider?: string): Promise<void> {
  console.log(
    targetProvider
      ? `Starting targeted icon rebuild for: ${targetProvider}`
      : "Starting full icon catalog rebuild...",
  );

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Load existing catalog if present
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

  // Target provider filter
  const activeProviders = targetProvider
    ? providers.filter((p) => p.name === targetProvider)
    : providers;

  if (targetProvider) {
    // Evict targeted provider icons
    catalog.icons = catalog.icons.filter((i) => i.provider !== targetProvider);
    const stateFile = path.join(TOOLS_ICONS_DIR, `${targetProvider}.json`);
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
  } else {
    catalog.icons = [];
  }

  // Re-fetch icons with undefined metadata
  for (const provider of activeProviders) {
    console.log(`Fetching icons from provider: ${provider.name}...`);
    const result = await provider.fetchIcons(undefined);

    console.log(
      `Normalizing and writing ${result.icons.length} icons for ${provider.name}...`,
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
      } catch (err) {
        console.warn(`Failed to process icon ${raw.id}:`, err);
      }
    }

    // Save provider state
    const stateFile = path.join(TOOLS_ICONS_DIR, `${provider.name}.json`);
    fs.writeFileSync(stateFile, JSON.stringify(result.metadata, null, 2));
  }

  // Rebuild inverted index
  console.log("Rebuilding inverted search index...");
  catalog.index = buildInvertedIndex(catalog.icons);

  // Clean orphan assets
  console.log("Checking for orphan PNG assets...");
  const activeHashes = new Set(
    catalog.icons.map((i) => path.basename(i.path)),
  );
  const existingFiles = fs.readdirSync(ASSETS_DIR);
  let prunedCount = 0;
  for (const file of existingFiles) {
    if (file.endsWith(".png") && !activeHashes.has(file)) {
      fs.unlinkSync(path.join(ASSETS_DIR, file));
      prunedCount++;
    }
  }
  if (prunedCount > 0) {
    console.log(`Pruned ${prunedCount} orphan icon assets.`);
  }

  // Save catalog
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(catalog));
  console.log(
    `Rebuild complete. Total icons: ${catalog.icons.length}. Catalog written to ${DATA_FILE}`,
  );
}

// Allow CLI invocation
const args = process.argv.slice(2);
let target: string | undefined;
for (const arg of args) {
  if (arg.startsWith("--provider=")) {
    target = arg.split("=")[1];
  }
}

if (process.argv[1] && process.argv[1].endsWith("rebuild-icons.ts")) {
  runRebuild(target).catch((err) => {
    console.error("Rebuild failed:", err);
    process.exit(1);
  });
}
