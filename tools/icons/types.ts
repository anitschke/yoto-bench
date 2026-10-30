// ==============================================================================
// Icon Provider Interfaces & Data Contracts
// See: docs/rfcs/011-inverted-icon-index-and-search.md
// ==============================================================================

export interface RawIconItem {
  id: string; // Unique ID within provider (e.g. 'noto_u1f431')
  provider: string; // Provider key (e.g. 'noto-emoji', 'yoto', 'yotoicons')
  title: string; // Display title (e.g. 'Cat Face')
  tags: string[]; // Associated keywords, categories, and aliases
  imageBytes: Uint8Array | Buffer; // Raw image bytes (PNG, SVG)
  mediaId?: string;
  displayIconId?: string;
}

export interface IconsSyncResult<TMetadata = unknown> {
  icons: RawIconItem[]; // Newly added or modified icons
  metadata: TMetadata; // Updated opaque state for this provider
}

export interface IconProvider<TMetadata = unknown> {
  /** Unique provider identifier (e.g. 'noto-emoji', 'yoto') */
  readonly name: string;

  /**
   * Fetch newly published or updated icons since previous sync run.
   * @param existingMetadata Previous state from tools/icons/{provider}.json (or undefined on full rebuild)
   */
  fetchIcons(existingMetadata?: TMetadata): Promise<IconsSyncResult<TMetadata>>;
}
