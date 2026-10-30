// ==============================================================================
// Pixel Icon Picker Modal Component
// See: AGENTS.md, src/widgets/AGENTS.md, docs/rfcs/005-widgets-and-component-library.md, docs/rfcs/011-inverted-icon-index-and-search.md
// ==============================================================================

import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  IconSearchEngine,
  IconRecord,
  IconCatalogData,
} from "../services/icon-search.js";
import { yotoApi } from "../api/client.js";
import "./yb-dialog.js";
import "./yb-button.js";
import "./yb-text-input.js";
import "./yb-pixel-icon.js";
import "./yb-badge.js";

export interface IconSelectedDetail {
  icon: IconRecord;
}

@customElement("yb-icon-picker")
export class YbIconPicker extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .picker-container {
      display: flex;
      flex-direction: column;
      gap: var(--yb-spacing-md, 1rem);
      max-height: 70vh;
      min-height: 400px;
    }

    .toolbar {
      display: flex;
      flex-direction: column;
      gap: var(--yb-spacing-sm, 0.5rem);
    }

    .filter-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--yb-spacing-sm, 0.5rem);
      flex-wrap: wrap;
    }

    .provider-tabs {
      display: flex;
      gap: var(--yb-spacing-xs, 0.25rem);
    }

    .provider-tab {
      background: var(--yb-color-surface-hover, #f0f0f0);
      border: 1px solid var(--yb-color-border, #d1d5db);
      border-radius: var(--yb-radius-sm, 4px);
      padding: 0.25rem 0.5rem;
      font-size: var(--yb-font-size-xs, 0.75rem);
      cursor: pointer;
      color: var(--yb-color-text-secondary, #6b7280);
      transition: all 0.15s ease;
    }

    .provider-tab.active {
      background: var(--yb-color-primary, #ff5500);
      border-color: var(--yb-color-primary, #ff5500);
      color: #ffffff;
      font-weight: bold;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
      gap: var(--yb-spacing-xs, 0.25rem);
      overflow-y: auto;
      max-height: 380px;
      padding: var(--yb-spacing-xs, 0.25rem);
      background: var(--yb-color-surface-dark, #18181b);
      border-radius: var(--yb-radius-md, 6px);
      border: 1px solid var(--yb-color-border, #3f3f46);
    }

    .icon-item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: var(--yb-radius-sm, 4px);
      background: transparent;
      border: 2px solid transparent;
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
    }

    .icon-item:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .icon-item.selected {
      border-color: var(--yb-color-primary, #ff5500);
      background: rgba(255, 85, 0, 0.15);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--yb-spacing-xl, 2rem);
      color: var(--yb-color-text-secondary, #9ca3af);
      gap: var(--yb-spacing-sm, 0.5rem);
    }

    .load-more-row {
      display: flex;
      justify-content: center;
      padding: var(--yb-spacing-xs, 0.25rem);
    }

    .hidden-file-input {
      display: none;
    }
  `;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  selectedIconId?: string;

  @state()
  private searchQuery = "";

  @state()
  private activeProvider = "all";

  @state()
  private searchEngine?: IconSearchEngine;

  @state()
  private visibleLimit = 120;

  @state()
  private loading = false;

  @state()
  private customIcons: IconRecord[] = [];

  protected override async firstUpdated(): Promise<void> {
    await this.loadCatalog();
  }

  protected override updated(changedProps: PropertyValues): void {
    if (changedProps.has("open") && this.open && !this.searchEngine) {
      void this.loadCatalog();
    }
  }

  private async loadCatalog(): Promise<void> {
    if (this.searchEngine) return;
    this.loading = true;
    try {
      // Dynamic import to split chunk
      const catalogModule = (await import("../data/icons.json")) as {
        default: IconCatalogData;
      };
      const catalog = catalogModule.default || catalogModule;
      this.searchEngine = new IconSearchEngine(catalog);
    } catch (err) {
      console.warn("Failed to load icon catalog:", err);
      // Fallback empty catalog
      this.searchEngine = new IconSearchEngine({
        version: 1,
        icons: [],
        index: {},
      });
    } finally {
      this.loading = false;
    }
  }

  private handleSearchInput(e: CustomEvent<{ value: string }>): void {
    this.searchQuery = e.detail.value;
    this.visibleLimit = 120; // reset pagination on search
  }

  private handleProviderSelect(provider: string): void {
    this.activeProvider = provider;
    this.visibleLimit = 120;
  }

  private handleIconClick(icon: IconRecord): void {
    const resolvedPath =
      icon.path.startsWith("/") ||
      icon.path.startsWith("http://") ||
      icon.path.startsWith("https://") ||
      icon.path.startsWith("blob:") ||
      icon.path.startsWith("data:")
        ? icon.path
        : `/${icon.path}`;
    const normalizedIcon: IconRecord = {
      ...icon,
      path: resolvedPath,
    };
    this.selectedIconId = icon.id;
    this.dispatchEvent(
      new CustomEvent<IconSelectedDetail>("yb-icon-selected", {
        detail: { icon: normalizedIcon },
        bubbles: true,
        composed: true,
      }),
    );
    this.open = false;
  }

  private handleClose(): void {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("yb-dialog-close", { bubbles: true, composed: true }),
    );
  }

  private handleUploadButtonClick(): void {
    const input =
      this.shadowRoot?.querySelector<HTMLInputElement>(".hidden-file-input");
    input?.click();
  }

  private async handleFileUpload(e: Event): Promise<HTMLInputElement | void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.loading = true;
    try {
      // Resize to 16x16 via canvas
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, 16, 16);
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      if (!blob) throw new Error("Canvas to blob conversion failed");

      // Upload to Yoto
      const iconId = await yotoApi.uploadIcon(blob);
      const customIcon: IconRecord = {
        id: iconId,
        provider: "custom",
        title: file.name.replace(/\.[^/.]+$/, ""),
        path: URL.createObjectURL(blob),
        tags: ["custom", "uploaded"],
        mediaId: iconId,
        displayIconId: iconId,
      };

      this.customIcons = [customIcon, ...this.customIcons];
      this.handleIconClick(customIcon);
    } catch (err) {
      console.error("Custom icon upload failed:", err);
    } finally {
      this.loading = false;
      target.value = "";
    }
  }

  private loadMore(): void {
    this.visibleLimit += 120;
  }

  override render() {
    let icons: IconRecord[] = [];

    if (this.activeProvider === "custom") {
      icons = this.customIcons;
    } else if (this.searchEngine) {
      icons = this.searchEngine.search(this.searchQuery, {
        provider:
          this.activeProvider === "all" ? undefined : this.activeProvider,
        limit: this.visibleLimit + 50,
      });

      if (this.activeProvider === "all" && this.customIcons.length > 0) {
        icons = [...this.customIcons, ...icons];
      }
    }

    const visibleIcons = icons.slice(0, this.visibleLimit);
    const hasMore = icons.length > this.visibleLimit;

    return html`
      <yb-dialog ?open=${this.open} @yb-dialog-close=${this.handleClose}>
        <span slot="header">Choose Display Icon</span>

        <div class="picker-container">
          <div class="toolbar">
            <yb-text-input
              placeholder="Search icons (e.g. cat, star, music)..."
              .value=${this.searchQuery}
              @yb-input=${this.handleSearchInput}
            ></yb-text-input>

            <div class="filter-row">
              <div class="provider-tabs">
                <button
                  type="button"
                  class="provider-tab ${this.activeProvider === "all" ? "active" : ""}"
                  @click=${() => this.handleProviderSelect("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  class="provider-tab ${this.activeProvider === "noto-emoji" ? "active" : ""}"
                  @click=${() => this.handleProviderSelect("noto-emoji")}
                >
                  Noto Emoji
                </button>
                <button
                  type="button"
                  class="provider-tab ${this.activeProvider === "yoto" ? "active" : ""}"
                  @click=${() => this.handleProviderSelect("yoto")}
                >
                  Official Yoto
                </button>
                <button
                  type="button"
                  class="provider-tab ${this.activeProvider === "custom" ? "active" : ""}"
                  @click=${() => this.handleProviderSelect("custom")}
                >
                  Custom
                </button>
              </div>

              <yb-button
                variant="secondary"
                size="small"
                @click=${this.handleUploadButtonClick}
              >
                Upload PNG
              </yb-button>
              <input
                type="file"
                class="hidden-file-input"
                accept="image/png,image/jpeg,image/webp"
                @change=${this.handleFileUpload}
              />
            </div>
          </div>

          <div
            class="icon-grid"
            role="listbox"
            aria-label="Available pixel icons"
          >
            ${
              visibleIcons.length === 0
                ? html`
                    <div class="empty-state">
                      ${
                        this.loading
                          ? html`<span>Loading icon catalog...</span>`
                          : html`<span>No matching icons found</span>`
                      }
                    </div>
                  `
                : visibleIcons.map(
                    (icon) => html`
                      <button
                        type="button"
                        role="option"
                        aria-selected=${this.selectedIconId === icon.id}
                        title="${icon.title}${icon.tags?.length ? ` (${icon.tags.slice(0, 3).join(", ")})` : ""}"
                        class="icon-item ${this.selectedIconId === icon.id ? "selected" : ""}"
                        @click=${() => this.handleIconClick(icon)}
                      >
                        <yb-pixel-icon
                          src=${icon.path}
                          alt=${icon.title}
                          size="md"
                        ></yb-pixel-icon>
                      </button>
                    `,
                  )
            }
          </div>

          ${
            hasMore
              ? html`
                  <div class="load-more-row">
                    <yb-button
                      variant="subtle"
                      size="small"
                      @click=${this.loadMore}
                    >
                      Load More Icons
                    </yb-button>
                  </div>
                `
              : null
          }
        </div>

        <div slot="footer">
          <yb-button variant="subtle" @click=${this.handleClose}
            >Cancel</yb-button
          >
        </div>
      </yb-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-icon-picker": YbIconPicker;
  }
}
