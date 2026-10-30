// ==============================================================================
// Visual Card Editor & Playlist Management View
// See: AGENTS.md, docs/rfcs/008-audio-ingestion-zip-and-upload-concurrency.md,
// docs/rfcs/009-cors-proxy-for-rss-feeds.md, docs/rfcs/010-podcast-rss-importer-and-card-sync.md,
// docs/rfcs/011-inverted-icon-index-and-search.md
// ==============================================================================

import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { authService } from "../api/auth.js";
import { yotoApi } from "../api/client.js";
import { authContext } from "../context/index.js";
import { AuthSession, Card } from "../models/index.js";
import { dispatchToast } from "../widgets/events.js";
import { opfsService } from "../services/opfs.js";
import {
  extractAudioFromZip,
  parseAudioMetadata,
  isAudioFile,
} from "../services/audio-parser.js";
import {
  AudioUploadQueue,
  reorderPlaylist,
  UploadItem,
} from "../services/upload-queue.js";
import {
  fetchFeedXml,
  parsePodcastFeed,
  filterEpisodes,
  extractSyncMetadata,
  embedSyncMetadata,
  CardSyncMetadata,
  PodcastEpisode,
} from "../services/podcast-importer.js";
import { IconRecord } from "../services/icon-search.js";

import "../widgets/yb-button.js";
import "../widgets/yb-badge.js";
import "../widgets/yb-pixel-icon.js";
import "../widgets/yb-text-input.js";
import "../widgets/yb-number-input.js";
import "../widgets/yb-dialog.js";
import "../widgets/yb-progress-bar.js";
import "../widgets/yb-please-sign-in.js";
import "../widgets/yb-icon-picker.js";

interface WebkitEntry {
  isFile: boolean;
  isDirectory: boolean;
  file: (callback: (file: File) => void) => void;
  createReader: () => {
    readEntries: (callback: (entries: WebkitEntry[]) => void) => void;
  };
}

@customElement("yb-card-view")
export class YbCardView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .card-editor {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      padding: 2rem;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--yb-spacing-sm, 0.5rem);
      flex-wrap: wrap;
    }

    h2 {
      margin: 0;
      font-size: var(--yb-font-size-2xl, 1.5rem);
    }

    .card-meta-bar {
      display: flex;
      gap: var(--yb-spacing-md, 1rem);
      margin-top: 0.25rem;
      align-items: center;
    }

    .drop-zone {
      border: 2px dashed var(--yb-color-border, #cbd5e1);
      border-radius: var(--yb-radius-md, 10px);
      padding: 2rem 1.5rem;
      text-align: center;
      background: var(--yb-color-surface-subtle, #f8fafc);
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 1.5rem;
    }

    .drop-zone:hover,
    .drop-zone.dragover {
      border-color: var(--yb-color-primary, #ff5500);
      background: rgba(255, 85, 0, 0.04);
    }

    .drop-zone-text {
      font-weight: 500;
      color: var(--yb-color-text, #1e293b);
    }

    .drop-zone-hint {
      font-size: var(--yb-font-size-xs, 0.75rem);
      color: var(--yb-color-text-secondary, #64748b);
      margin-top: 0.25rem;
    }

    .upload-progress-card {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 8px);
      background: var(--yb-color-surface, #ffffff);
    }

    .track-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .track-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 10px);
      background: var(--yb-color-surface-subtle, #f8f9fa);
      transition: background 0.15s ease;
    }

    .track-item:hover {
      background: #ffffff;
    }

    .track-number {
      font-weight: 600;
      min-width: 24px;
      color: var(--yb-color-text-secondary, #64748b);
      text-align: center;
    }

    .track-icon-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: var(--yb-radius-sm, 4px);
      display: flex;
      align-items: center;
    }

    .track-icon-btn:hover {
      opacity: 0.8;
    }

    .track-title-input {
      flex: 1;
      font-weight: 500;
      font-size: var(--yb-font-size-md, 1rem);
      border: 1px solid transparent;
      padding: 0.25rem 0.5rem;
      border-radius: var(--yb-radius-sm, 4px);
      background: transparent;
    }

    .track-title-input:hover,
    .track-title-input:focus {
      background: #ffffff;
      border-color: var(--yb-color-border, #cbd5e1);
      outline: none;
    }

    .track-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--yb-color-text-muted, #718096);
    }

    .hidden-file-input {
      display: none;
    }

    .podcast-form {
      display: flex;
      flex-direction: column;
      gap: var(--yb-spacing-md, 1rem);
    }

    .podcast-episodes-preview {
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 6px);
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .podcast-ep-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.25rem 0.5rem;
      font-size: var(--yb-font-size-sm, 0.875rem);
      border-radius: var(--yb-radius-sm, 4px);
    }

    .podcast-ep-row:nth-child(even) {
      background: var(--yb-color-surface-subtle, #f8fafc);
    }
  `;

  @consume({ context: authContext, subscribe: true })
  @state()
  authSession: AuthSession | null = null;

  @property({ type: String }) cardId = "";
  @state() private card: Card | null = null;
  @state() private loading = true;
  @state() private isSaving = false;
  @state() private isSyncingPodcast = false;
  @state() private isDraggingOver = false;

  // Upload Queue Progress
  @state() private isUploading = false;
  @state() private uploadProgressPercent = 0;
  @state() private uploadProgressText = "";

  // Icon Picker
  @state() private iconPickerOpen = false;
  @state() private activeChapterIndex: number | null = null;

  // Podcast Dialog
  @state() private podcastDialogOpen = false;
  @state() private podcastFeedUrl = "";
  @state() private podcastLimit = 10;
  @state() private podcastMinDuration = 120;
  @state() private podcastRawXml = "";
  @state() private podcastPreviewEpisodes: PodcastEpisode[] = [];
  @state() private isPreviewingPodcast = false;

  private isFetching = false;

  override willUpdate(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has("cardId") ||
      changedProperties.has("authSession")
    ) {
      if (this.authSession && authService.isAuthenticated() && this.cardId) {
        void this.loadCard();
      } else {
        this.card = null;
        this.loading = false;
      }
    }
  }

  private async loadCard() {
    if (!this.cardId || !authService.isAuthenticated()) return;
    if (this.isFetching) return;
    this.isFetching = true;
    this.loading = true;
    try {
      this.card = await yotoApi.getCard(this.cardId);
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to load card details.",
        errorDetail: err,
      });
    } finally {
      this.loading = false;
      this.isFetching = false;
    }
  }

  // --- Track Editing & Reordering ---

  private handleTitleChange(index: number, newTitle: string) {
    if (!this.card?.content?.chapters) return;
    const chapters = [...this.card.content.chapters];
    const chapter = chapters[index];
    if (chapter) {
      chapter.title = newTitle;
      if (chapter.tracks && chapter.tracks[0]) {
        chapter.tracks[0].title = newTitle;
      }
      this.card = {
        ...this.card,
        content: {
          ...this.card.content,
          chapters,
        },
      };
    }
  }

  private handleMoveTrack(fromIndex: number, toIndex: number) {
    if (!this.card?.content?.chapters) return;
    const chapters = [...this.card.content.chapters];
    const [moved] = chapters.splice(fromIndex, 1);
    if (moved) {
      chapters.splice(toIndex, 0, moved);
    }
    this.card = {
      ...this.card,
      content: {
        ...this.card.content,
        chapters: reorderPlaylist(chapters),
      },
    };
  }

  private handleDeleteTrack(index: number) {
    if (!this.card?.content?.chapters) return;
    const chapters = this.card.content.chapters.filter((_, i) => i !== index);
    this.card = {
      ...this.card,
      content: {
        ...this.card.content,
        chapters: reorderPlaylist(chapters),
      },
    };
  }

  // --- Icon Assignment ---

  private openIconPickerForTrack(index: number) {
    this.activeChapterIndex = index;
    this.iconPickerOpen = true;
  }

  private handleIconSelected(e: CustomEvent<{ icon: IconRecord }>) {
    if (this.activeChapterIndex === null || !this.card?.content?.chapters)
      return;
    const icon = e.detail.icon;
    const chapters = [...this.card.content.chapters];
    const chapter = chapters[this.activeChapterIndex];
    if (chapter) {
      const displayObj = {
        icon16x16: icon.path,
        icon: icon.displayIconId || icon.id,
      };
      chapter.display = displayObj;
      if (chapter.tracks && chapter.tracks[0]) {
        chapter.tracks[0].display = displayObj;
      }
      this.card = {
        ...this.card,
        content: {
          ...this.card.content,
          chapters,
        },
      };
    }
    this.activeChapterIndex = null;
  }

  // --- Audio Upload Pipeline ---

  private handleDropZoneClick() {
    const input =
      this.shadowRoot?.querySelector<HTMLInputElement>(".hidden-file-input");
    input?.click();
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDraggingOver = true;
  }

  private handleDragLeave() {
    this.isDraggingOver = false;
  }

  private async handleDrop(e: DragEvent) {
    e.preventDefault();
    this.isDraggingOver = false;
    const items = e.dataTransfer?.items;
    if (!items || items.length === 0) return;

    const files: File[] = [];
    const entries: WebkitEntry[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && "webkitGetAsEntry" in item) {
        const entry = (
          item as unknown as { webkitGetAsEntry: () => WebkitEntry | null }
        ).webkitGetAsEntry();
        if (entry) entries.push(entry);
      } else if (
        item &&
        typeof (item as DataTransferItem).getAsFile === "function"
      ) {
        const file = (item as DataTransferItem).getAsFile();
        if (file) files.push(file);
      }
    }

    if (entries.length > 0) {
      const resolved = await this.resolveEntries(entries);
      files.push(...resolved);
    }

    if (files.length > 0) {
      await this.processIncomingFiles(files);
    }
  }

  private async resolveEntries(entries: WebkitEntry[]): Promise<File[]> {
    const files: File[] = [];
    for (const entry of entries) {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => entry.file(resolve));
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const subEntries = await new Promise<WebkitEntry[]>((resolve) =>
          reader.readEntries(resolve),
        );
        const subFiles = await this.resolveEntries(subEntries);
        files.push(...subFiles);
      }
    }
    return files;
  }

  private async handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files ? Array.from(target.files) : [];
    if (files.length > 0) {
      await this.processIncomingFiles(files);
    }
    target.value = "";
  }

  private async processIncomingFiles(files: File[]) {
    if (!this.card) return;
    this.isUploading = true;
    this.uploadProgressPercent = 5;
    this.uploadProgressText = "Staging audio files...";

    const audioItems: { blob: Blob; filename: string }[] = [];

    try {
      for (const file of files) {
        if (file.name.toLowerCase().endsWith(".zip")) {
          this.uploadProgressText = `Extracting ${file.name}...`;
          const extracted = await extractAudioFromZip(file, (pct: number) => {
            this.uploadProgressPercent = pct;
          });
          audioItems.push(
            ...extracted.map((e) => ({ filename: e.name, blob: e.blob })),
          );
        } else if (isAudioFile(file.name)) {
          audioItems.push({ blob: file, filename: file.name });
        }
      }

      if (audioItems.length === 0) {
        dispatchToast(this, {
          type: "warning",
          message: "No supported audio files (MP3/M4A) found.",
        });
        this.isUploading = false;
        return;
      }

      this.uploadProgressText = "Reading audio tags & metadata...";
      const trackPayloads = [];

      for (let i = 0; i < audioItems.length; i++) {
        const item = audioItems[i]!;
        // Stage in OPFS
        await opfsService.saveFile(this.card.cardId, item.filename, item.blob);
        const meta = await parseAudioMetadata(item.blob, item.filename);

        trackPayloads.push({
          blob: item.blob,
          filename: item.filename,
          title: meta.title,
          trackNumber: meta.trackNumber || i + 1,
          diskNumber: meta.diskNumber,
          duration: meta.duration,
        });
      }

      // Sort naturally by disc and track
      trackPayloads.sort((a, b) => {
        if (a.diskNumber && b.diskNumber && a.diskNumber !== b.diskNumber) {
          return a.diskNumber - b.diskNumber;
        }
        return a.trackNumber - b.trackNumber;
      });

      // Queue upload with controlled concurrency
      const filesToProcess = trackPayloads.map((t) => ({
        name: t.filename,
        blob: t.blob,
        metadata: {
          title: t.title,
          trackNumber: t.trackNumber,
          diskNumber: t.diskNumber,
          duration: t.duration,
        },
      }));

      const queue = new AudioUploadQueue(3);
      const newChapters = await queue.processQueue(
        filesToProcess,
        (items: UploadItem[]) => {
          const completed = items.filter(
            (it) => it.status === "complete",
          ).length;
          const total = items.length;
          this.uploadProgressPercent = Math.round((completed / total) * 100);
          this.uploadProgressText = `Uploading & transcoding ${completed}/${total} tracks...`;
        },
      );

      // Clean session OPFS
      await opfsService.cleanSession(this.card.cardId);

      // Append new tracks and re-key
      const existingChapters = this.card.content?.chapters || [];
      const mergedChapters = reorderPlaylist([
        ...existingChapters,
        ...newChapters,
      ]);

      this.card = {
        ...this.card,
        content: {
          ...this.card.content,
          chapters: mergedChapters,
        },
      };

      dispatchToast(this, {
        type: "success",
        message: `Successfully added ${newChapters.length} tracks! Remember to save changes.`,
      });
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to upload audio files.",
        errorDetail: err,
      });
    } finally {
      this.isUploading = false;
    }
  }

  // --- Podcast RSS Import & Sync ---

  private async previewPodcastFeed() {
    if (!this.podcastFeedUrl && !this.podcastRawXml) return;
    this.isPreviewingPodcast = true;
    try {
      let xml = this.podcastRawXml;
      if (!xml && this.podcastFeedUrl) {
        xml = await fetchFeedXml(this.podcastFeedUrl);
      }
      const feed = parsePodcastFeed(xml);
      const filtered = filterEpisodes(feed.episodes, {
        limit: this.podcastLimit,
        minDurationSeconds: this.podcastMinDuration,
      });
      this.podcastPreviewEpisodes = filtered;
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message:
          "Failed to load podcast feed. You can try pasting the raw XML.",
        errorDetail: err,
      });
    } finally {
      this.isPreviewingPodcast = false;
    }
  }

  private async importPodcastEpisodes() {
    if (!this.card || this.podcastPreviewEpisodes.length === 0) return;
    this.isUploading = true;
    this.podcastDialogOpen = false;

    try {
      const audioPayloads = [];
      const total = this.podcastPreviewEpisodes.length;

      for (let i = 0; i < total; i++) {
        const ep = this.podcastPreviewEpisodes[i]!;
        this.uploadProgressText = `Fetching episode ${i + 1}/${total}: ${ep.title}...`;
        this.uploadProgressPercent = Math.round(((i + 1) / total) * 30);

        const resp = await fetch(ep.enclosureUrl);
        if (!resp.ok) continue;
        const blob = await resp.blob();

        const filename = `${ep.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp3`;
        await opfsService.saveFile(this.card.cardId, filename, blob);

        audioPayloads.push({
          blob,
          filename,
          title: ep.title,
          trackNumber: i + 1,
          duration: ep.duration,
        });
      }

      const filesToProcess = audioPayloads.map((a) => ({
        name: a.filename,
        blob: a.blob,
        metadata: {
          title: a.title,
          trackNumber: a.trackNumber,
          duration: a.duration,
        },
      }));

      const queue = new AudioUploadQueue(3);
      const newChapters = await queue.processQueue(
        filesToProcess,
        (items: UploadItem[]) => {
          const completed = items.filter(
            (it) => it.status === "complete",
          ).length;
          const count = items.length;
          this.uploadProgressPercent =
            30 + Math.round((completed / count) * 70);
          this.uploadProgressText = `Uploading & transcoding ${completed}/${count} episodes...`;
        },
      );

      await opfsService.cleanSession(this.card.cardId);

      const existingChapters = this.card.content?.chapters || [];
      const mergedChapters = reorderPlaylist([
        ...existingChapters,
        ...newChapters,
      ]);

      // Embed sync metadata into card description
      const syncMeta: CardSyncMetadata = {
        version: 1,
        sourceType: "podcast-rss",
        feedUrl: this.podcastFeedUrl,
        filter: {
          limit: this.podcastLimit,
          minDurationSeconds: this.podcastMinDuration,
        },
        lastSynced: new Date().toISOString(),
      };

      const updatedDescription = embedSyncMetadata(
        this.card.metadata?.description,
        syncMeta,
      );

      this.card = {
        ...this.card,
        metadata: {
          ...this.card.metadata,
          description: updatedDescription,
        },
        content: {
          ...this.card.content,
          chapters: mergedChapters,
        },
      };

      dispatchToast(this, {
        type: "success",
        message: `Imported ${newChapters.length} episodes. Sync block embedded!`,
      });
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to import podcast episodes.",
        errorDetail: err,
      });
    } finally {
      this.isUploading = false;
    }
  }

  private async syncNewPodcastEpisodes() {
    if (!this.card) return;
    const syncMeta = extractSyncMetadata(this.card.metadata?.description);
    if (!syncMeta) return;

    this.isSyncingPodcast = true;
    try {
      const xml = await fetchFeedXml(syncMeta.feedUrl);
      const feed = parsePodcastFeed(xml);
      const filtered = filterEpisodes(feed.episodes, {
        limit: syncMeta.filter?.limit || 10,
        minDurationSeconds: syncMeta.filter?.minDurationSeconds || 120,
      });

      // Existing titles set
      const existingTitles = new Set(
        (this.card.content?.chapters || []).map((c) =>
          c.title.toLowerCase().trim(),
        ),
      );

      const newEpisodes = filtered.filter(
        (ep) => !existingTitles.has(ep.title.toLowerCase().trim()),
      );

      if (newEpisodes.length === 0) {
        dispatchToast(this, {
          type: "info",
          message: "Podcast is already up to date! No new episodes found.",
        });
        return;
      }

      this.podcastPreviewEpisodes = newEpisodes;
      await this.importPodcastEpisodes();
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to sync podcast episodes.",
        errorDetail: err,
      });
    } finally {
      this.isSyncingPodcast = false;
    }
  }

  // --- Save Card ---

  private async saveCardChanges() {
    if (!this.card) return;
    this.isSaving = true;
    try {
      await yotoApi.updateCard(this.card);
      dispatchToast(this, {
        type: "success",
        message: "Card playlist saved successfully to Yoto!",
      });
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to save card changes.",
        errorDetail: err,
      });
    } finally {
      this.isSaving = false;
    }
  }

  override render() {
    const isAuthed = !!this.authSession && authService.isAuthenticated();
    if (!isAuthed) {
      return html`
        <yb-please-sign-in
          heading="Please Sign In"
          description="Sign in with your Yoto account to view and edit this card."
        ></yb-please-sign-in>
      `;
    }

    if (this.loading) {
      return html`<div class="empty-state"><p>Loading card...</p></div>`;
    }

    if (!this.card) {
      return html`<div class="empty-state"><p>Card not found.</p></div>`;
    }

    const chapters = this.card.content?.chapters || [];
    const syncMeta = extractSyncMetadata(this.card.metadata?.description);

    return html`
      <div class="card-editor">
        <div class="header-row">
          <div>
            <h2>${this.card.title}</h2>
            <div class="card-meta-bar">
              <small style="color: var(--yb-color-text-muted, #718096);"
                >ID: ${this.card.cardId}</small
              >
              ${
                syncMeta
                  ? html`
                      <yb-badge variant="neutral">
                        Podcast Sync Active
                      </yb-badge>
                    `
                  : null
              }
            </div>
          </div>

          <div class="header-actions">
            ${
              syncMeta
                ? html`
                    <yb-button
                      variant="secondary"
                      ?loading=${this.isSyncingPodcast}
                      @click=${this.syncNewPodcastEpisodes}
                    >
                      🔄 Sync New Episodes
                    </yb-button>
                  `
                : null
            }

            <yb-button
              variant="secondary"
              @click=${() => {
                this.podcastDialogOpen = true;
              }}
            >
              🎙️ Import Podcast
            </yb-button>

            <yb-button
              variant="primary"
              ?loading=${this.isSaving}
              @click=${this.saveCardChanges}
            >
              Save Card
            </yb-button>

            <yb-button
              variant="subtle"
              @click=${() => {
                window.history.pushState(null, "", "/");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            >
              ← Back to Library
            </yb-button>
          </div>
        </div>

        <!-- Drag & Drop Audio Zone -->
        <div
          class="drop-zone ${this.isDraggingOver ? "dragover" : ""}"
          @click=${this.handleDropZoneClick}
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          <div class="drop-zone-text">
            📁 Drag & drop audio files, folders, or ZIP archives here
          </div>
          <div class="drop-zone-hint">
            Supports MP3 and M4A. Audio will be staged in OPFS and uploaded with
            Web Crypto SHA-256 deduplication.
          </div>
          <input
            type="file"
            class="hidden-file-input"
            multiple
            accept="audio/mp3,audio/mpeg,audio/m4a,application/zip"
            @change=${this.handleFileInput}
          />
        </div>

        <!-- Upload Progress Indicator -->
        ${
          this.isUploading
            ? html`
                <div class="upload-progress-card">
                  <yb-progress-bar
                    .value=${this.uploadProgressPercent}
                    .label=${this.uploadProgressText}
                  ></yb-progress-bar>
                </div>
              `
            : null
        }

        <h3>Tracks (${chapters.length})</h3>

        ${
          chapters.length === 0
            ? html`
                <div class="empty-state">
                  <p>
                    No tracks in this playlist yet. Drop some audio files above!
                  </p>
                </div>
              `
            : html`
                <div class="track-list">
                  ${chapters.map(
                    (chap, index) => html`
                      <div class="track-item">
                        <span class="track-number">${index + 1}</span>

                        <button
                          type="button"
                          class="track-icon-btn"
                          title="Change icon"
                          @click=${() => this.openIconPickerForTrack(index)}
                        >
                          <yb-pixel-icon
                            src=${chap.display?.icon16x16 || ""}
                            alt=${chap.title}
                            size="md"
                          ></yb-pixel-icon>
                        </button>

                        <input
                          type="text"
                          class="track-title-input"
                          .value=${chap.title}
                          @change=${(e: Event) =>
                            this.handleTitleChange(
                              index,
                              (e.target as HTMLInputElement).value,
                            )}
                        />

                        ${
                          chap.duration
                            ? html`<small style="color: #64748b;"
                                >${Math.floor(chap.duration)}s</small
                              >`
                            : ""
                        }

                        <div class="track-actions">
                          <yb-button
                            variant="subtle"
                            size="small"
                            ?disabled=${index === 0}
                            @click=${() => this.handleMoveTrack(index, index - 1)}
                          >
                            ↑
                          </yb-button>
                          <yb-button
                            variant="subtle"
                            size="small"
                            ?disabled=${index === chapters.length - 1}
                            @click=${() => this.handleMoveTrack(index, index + 1)}
                          >
                            ↓
                          </yb-button>
                          <yb-button
                            variant="danger"
                            size="small"
                            @click=${() => this.handleDeleteTrack(index)}
                          >
                            ✕
                          </yb-button>
                        </div>
                      </div>
                    `,
                  )}
                </div>
              `
        }
      </div>

      <!-- Icon Picker Modal -->
      <yb-icon-picker
        ?open=${this.iconPickerOpen}
        @yb-icon-selected=${this.handleIconSelected}
        @yb-dialog-close=${() => {
          this.iconPickerOpen = false;
          this.activeChapterIndex = null;
        }}
      ></yb-icon-picker>

      <!-- Import Podcast Dialog -->
      <yb-dialog
        ?open=${this.podcastDialogOpen}
        @yb-dialog-close=${() => {
          this.podcastDialogOpen = false;
        }}
      >
        <span slot="header">Import Podcast RSS Feed</span>

        <div class="podcast-form">
          <yb-text-input
            label="Podcast RSS Feed URL"
            placeholder="https://feeds.example.com/podcast.xml"
            .value=${this.podcastFeedUrl}
            @input=${(e: Event) => {
              const detail = (e as CustomEvent<{ value: string }>).detail;
              const target = e.target as HTMLInputElement | { value: string };
              this.podcastFeedUrl =
                detail?.value !== undefined
                  ? detail.value
                  : (target?.value ?? "");
            }}
            @yb-input=${(e: CustomEvent<{ value: string }>) => {
              if (e.detail?.value !== undefined) {
                this.podcastFeedUrl = e.detail.value;
              }
            }}
          ></yb-text-input>

          <div style="display: flex; gap: 1rem;">
            <yb-number-input
              label="Episode Limit"
              .value=${this.podcastLimit}
              .min=${1}
              .max=${50}
              @change=${(e: CustomEvent<{ value: number }>) => {
                if (e.detail?.value !== undefined) {
                  this.podcastLimit = e.detail.value;
                }
              }}
              @yb-input=${(e: CustomEvent<{ value: number }>) => {
                if (e.detail?.value !== undefined) {
                  this.podcastLimit = e.detail.value;
                }
              }}
            ></yb-number-input>

            <yb-number-input
              label="Min Duration (s)"
              .value=${this.podcastMinDuration}
              .min=${0}
              @change=${(e: CustomEvent<{ value: number }>) => {
                if (e.detail?.value !== undefined) {
                  this.podcastMinDuration = e.detail.value;
                }
              }}
              @yb-input=${(e: CustomEvent<{ value: number }>) => {
                if (e.detail?.value !== undefined) {
                  this.podcastMinDuration = e.detail.value;
                }
              }}
            ></yb-number-input>
          </div>

          <yb-button
            variant="secondary"
            ?loading=${this.isPreviewingPodcast}
            @click=${this.previewPodcastFeed}
          >
            Fetch & Preview Episodes
          </yb-button>

          ${
            this.podcastPreviewEpisodes.length > 0
              ? html`
                  <div class="podcast-episodes-preview">
                    ${this.podcastPreviewEpisodes.map(
                      (ep) => html`
                        <div class="podcast-ep-row">
                          <span>${ep.title}</span>
                          <small style="color: #64748b;">
                            ${ep.duration ? `${Math.floor(ep.duration / 60)}m` : ""}
                          </small>
                        </div>
                      `,
                    )}
                  </div>
                `
              : null
          }

          <details style="font-size: 0.85rem; color: #64748b;">
            <summary style="cursor: pointer;">
              CORS Fallback: Paste Raw RSS XML
            </summary>
            <textarea
              style="width: 100%; height: 100px; margin-top: 0.5rem; font-family: monospace;"
              placeholder="Paste raw &lt;rss&gt; XML text here if feed is blocked by CORS..."
              .value=${this.podcastRawXml}
              @input=${(e: Event) => {
                this.podcastRawXml = (e.target as HTMLTextAreaElement).value;
              }}
            ></textarea>
          </details>
        </div>

        <div slot="footer">
          <yb-button
            variant="subtle"
            @click=${() => {
              this.podcastDialogOpen = false;
            }}
          >
            Cancel
          </yb-button>
          <yb-button
            variant="primary"
            ?disabled=${this.podcastPreviewEpisodes.length === 0}
            @click=${this.importPodcastEpisodes}
          >
            Import ${this.podcastPreviewEpisodes.length} Episodes
          </yb-button>
        </div>
      </yb-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-card-view": YbCardView;
  }
}
