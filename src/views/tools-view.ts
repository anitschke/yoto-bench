// ==============================================================================
// Community Tools & Resources Directory View
// See: AGENTS.md, docs/rfcs/001-project-vision-and-architecture.md
// ==============================================================================

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../widgets/yb-button.js";
import "../widgets/yb-badge.js";
import "../widgets/yb-text-input.js";

export interface CommunityTool {
  id: string;
  name: string;
  category: "labels" | "icons" | "audio" | "developer";
  categoryLabel: string;
  author: string;
  url: string;
  description: string;
  tip?: string;
  icon: string;
}

export const COMMUNITY_TOOLS: CommunityTool[] = [
  {
    id: "card-forge",
    name: "Yoto Card Forge",
    category: "labels",
    categoryLabel: "Labels & Printing",
    author: "Community",
    url: "https://yoto-card-forge.pages.dev/",
    description:
      "Generate and print beautiful, perfectly aligned card labels for standard CR80 / Avery 5163 sticker sheets.",
    tip: "Standard Yoto card dimensions are 85.6mm × 53.98mm with 3mm rounded corners.",
    icon: "🏷️",
  },
  {
    id: "avery-templates",
    name: "Avery MYO Sticker Templates",
    category: "labels",
    categoryLabel: "Labels & Printing",
    author: "Avery & Community",
    url: "https://www.avery.com/templates",
    description:
      "Printable sticker templates matching Avery pre-cut labels (such as Avery 5160, 5163, and 6572) for easy MYO card labeling.",
    tip: "Use matte waterproof vinyl sticker paper for maximum durability against little hands.",
    icon: "🖨️",
  },
  {
    id: "yoto-icons",
    name: "YotoIcons.com",
    category: "icons",
    categoryLabel: "Icons & Pixel Art",
    author: "Community (YotoIcons)",
    url: "https://yotoicons.com/",
    description:
      "The premier searchable community repository of user-created 16×16 pixel icons and display animations for Yoto cards.",
    tip: "Yoto players display icons as 16×16 pixel grids using a 16-color RGB palette.",
    icon: "🎨",
  },
  {
    id: "piskel",
    name: "Piskel Pixel Art Editor",
    category: "icons",
    categoryLabel: "Icons & Pixel Art",
    author: "Julian Descottes",
    url: "https://www.piskelapp.com/",
    description:
      "Free online sprite and pixel art editor. Set canvas size to 16×16 to draw custom chapter icons and export as PNG.",
    tip: "Stick to high contrast silhouettes and bright primary colors for the best visibility on the player's LED display.",
    icon: "✏️",
  },
  {
    id: "audacity-cutter",
    name: "AudioBook Chapter Splitter",
    category: "audio",
    categoryLabel: "Audio & Feeds",
    author: "Audacity Team",
    url: "https://www.audacityteam.org/",
    description:
      "Split long single-file audiobooks (M4B, MP3) into individual chapter tracks so kids can skip chapters using the player's orange knob.",
    tip: "Yoto cards support up to 100 chapters per card with seamless track transition.",
    icon: "✂️",
  },
  {
    id: "mp3gain",
    name: "MP3Gain Volume Normalizer",
    category: "audio",
    categoryLabel: "Audio & Feeds",
    author: "Glen Sawyer",
    url: "https://mp3gain.sourceforge.net/",
    description:
      "Losslessly analyze and adjust the volume of MP3 tracks without re-encoding to prevent jarring volume jumps between tracks.",
    tip: "Targeting 89 dB SPL produces consistent listening levels that match official Yoto cards.",
    icon: "🔊",
  },
  {
    id: "podbase",
    name: "Podbase Podcast Validator",
    category: "audio",
    categoryLabel: "Audio & Feeds",
    author: "Podbase",
    url: "https://podba.se/",
    description:
      "Validate RSS feeds for correct iTunes duration tags, audio enclosure URLs, and CORS compatibility before importing into Yoto cards.",
    tip: "Ensure your podcast RSS feed has direct .mp3 enclosures and supports byte-range requests.",
    icon: "📡",
  },
  {
    id: "yotocli",
    name: "yotocli",
    category: "developer",
    categoryLabel: "Developer & CLI",
    author: "Community Developers",
    url: "https://github.com/",
    description:
      "Command-line interface and automation scripts for power users managing Yoto cards, audio pipelines, and developer tokens.",
    tip: "Great for automating nightly podcast imports or batch processing audio libraries from terminal scripts.",
    icon: "💻",
  },
];

@customElement("yb-tools-view")
export class YbToolsView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header-bar {
      margin-bottom: 2rem;
    }

    h2 {
      margin: 0 0 0.5rem 0;
      font-size: var(--yb-font-size-2xl, 1.75rem);
      color: var(--yb-color-text, #1a202c);
    }

    .subtitle {
      font-size: var(--yb-font-size-md, 1rem);
      color: var(--yb-color-text-secondary, #4a5568);
      margin: 0;
      line-height: 1.5;
    }

    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .category-pills {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .category-pill {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #cbd5e1);
      border-radius: var(--yb-radius-full, 9999px);
      padding: 0.35rem 0.85rem;
      font-size: var(--yb-font-size-xs, 0.75rem);
      font-weight: 500;
      color: var(--yb-color-text-secondary, #4a5568);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .category-pill:hover {
      border-color: var(--yb-color-primary, #ff5500);
      color: var(--yb-color-primary, #ff5500);
    }

    .category-pill.active {
      background: var(--yb-color-primary, #ff5500);
      border-color: var(--yb-color-primary, #ff5500);
      color: #ffffff;
    }

    .search-box {
      max-width: 300px;
      width: 100%;
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .tool-card {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      transition:
        box-shadow var(--yb-transition-fast, 150ms),
        transform var(--yb-transition-fast, 150ms);
    }

    .tool-card:hover {
      box-shadow: var(--yb-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      transform: translateY(-2px);
    }

    .tool-top {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .tool-icon {
      font-size: 1.75rem;
      line-height: 1;
      min-width: 32px;
      text-align: center;
    }

    .tool-header-text {
      flex: 1;
      min-width: 0;
    }

    .tool-title {
      font-size: var(--yb-font-size-lg, 1.125rem);
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: var(--yb-color-text, #1a202c);
    }

    .tool-author {
      font-size: var(--yb-font-size-xs, 0.75rem);
      color: var(--yb-color-text-muted, #718096);
    }

    .tool-desc {
      font-size: var(--yb-font-size-sm, 0.875rem);
      color: var(--yb-color-text, #1e293b);
      line-height: 1.5;
      margin: 0;
      flex: 1;
    }

    .tool-tip-box {
      background: var(--yb-color-surface-subtle, #f8f9fa);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-sm, 6px);
      padding: 0.65rem 0.85rem;
      font-size: var(--yb-font-size-xs, 0.75rem);
      color: var(--yb-color-text-secondary, #4a5568);
      line-height: 1.4;
    }

    .tool-tip-box strong {
      color: var(--yb-color-primary, #ff5500);
    }

    .tool-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid var(--yb-color-border, #e2e8f0);
      gap: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--yb-color-text-muted, #718096);
    }
  `;

  @state() private selectedCategory: string = "all";
  @state() private searchQuery: string = "";

  private handleSearch(e: Event) {
    const detail = (e as CustomEvent<{ value: string }>).detail;
    const target = e.target as HTMLInputElement | { value: string };
    const query =
      detail?.value !== undefined ? detail.value : (target?.value ?? "");
    this.searchQuery = query.toLowerCase().trim();
  }

  override render() {
    const categories: Array<{ id: string; label: string }> = [
      { id: "all", label: "All Tools" },
      { id: "labels", label: "Labels & Printing" },
      { id: "icons", label: "Icons & Pixel Art" },
      { id: "audio", label: "Audio & Feeds" },
      { id: "developer", label: "Developer & CLI" },
    ];

    const filtered = COMMUNITY_TOOLS.filter((tool) => {
      const matchesCategory =
        this.selectedCategory === "all" ||
        tool.category === this.selectedCategory;
      const matchesSearch =
        !this.searchQuery ||
        tool.name.toLowerCase().includes(this.searchQuery) ||
        tool.description.toLowerCase().includes(this.searchQuery) ||
        (tool.tip && tool.tip.toLowerCase().includes(this.searchQuery));
      return matchesCategory && matchesSearch;
    });

    return html`
      <div>
        <div class="header-bar">
          <h2>Community Tools & Resources</h2>
          <p class="subtitle">
            A curated directory of community-built tools, label makers, icon
            repositories, and audio utilities for Yoto families and creators.
          </p>
        </div>

        <div class="filter-bar">
          <div class="category-pills">
            ${categories.map(
              (cat) => html`
                <button
                  type="button"
                  class="category-pill ${this.selectedCategory === cat.id
                    ? "active"
                    : ""}"
                  @click=${() => {
                    this.selectedCategory = cat.id;
                  }}
                >
                  ${cat.label}
                </button>
              `,
            )}
          </div>

          <div class="search-box">
            <yb-text-input
              placeholder="Search tools..."
              clearable
              .value=${this.searchQuery}
              @input=${this.handleSearch}
            ></yb-text-input>
          </div>
        </div>

        ${
          filtered.length === 0
            ? html`
                <div class="empty-state">
                  <p>No community tools match your search or filter.</p>
                </div>
              `
            : html`
                <div class="tools-grid">
                  ${filtered.map(
                    (tool) => html`
                      <div class="tool-card">
                        <div class="tool-top">
                          <span class="tool-icon">${tool.icon}</span>
                          <div class="tool-header-text">
                            <h4 class="tool-title">${tool.name}</h4>
                            <span class="tool-author">By ${tool.author}</span>
                          </div>
                        </div>

                        <p class="tool-desc">${tool.description}</p>

                        ${
                          tool.tip
                            ? html`
                                <div class="tool-tip-box">
                                  <strong>Tip:</strong> ${tool.tip}
                                </div>
                              `
                            : null
                        }

                        <div class="tool-footer">
                          <yb-badge variant="neutral">
                            ${tool.categoryLabel}
                          </yb-badge>

                          <a
                            href=${tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style="text-decoration: none;"
                          >
                            <yb-button variant="secondary" size="small">
                              Visit Tool ↗
                            </yb-button>
                          </a>
                        </div>
                      </div>
                    `,
                  )}
                </div>
              `
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-tools-view": YbToolsView;
  }
}
