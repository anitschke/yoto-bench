import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { authService } from "../api/auth.js";
import { yotoApi } from "../api/client.js";
import { authContext } from "../context/index.js";
import { AuthSession, Card } from "../models/index.js";
import { dispatchToast } from "../widgets/events.js";
import "../widgets/yb-button.js";
import "../widgets/yb-badge.js";
import "../widgets/yb-pixel-icon.js";
import "../widgets/yb-dialog.js";
import "../widgets/yb-text-input.js";
import "../widgets/yb-please-sign-in.js";

@customElement("yb-library-view")
export class YbLibraryView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    h2 {
      margin: 0;
      font-size: var(--yb-font-size-2xl, 1.5rem);
      color: var(--yb-color-text, #1a202c);
    }

    .search-filter {
      max-width: 320px;
      width: 100%;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .card-item {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      transition:
        box-shadow var(--yb-transition-fast, 150ms),
        transform var(--yb-transition-fast, 150ms);
    }

    .card-item:hover {
      box-shadow: var(--yb-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      transform: translateY(-2px);
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .card-title {
      font-size: var(--yb-font-size-md, 1rem);
      font-weight: 600;
      margin: 0;
      color: var(--yb-color-text, #1a202c);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-meta {
      font-size: var(--yb-font-size-xs, 0.75rem);
      color: var(--yb-color-text-muted, #718096);
    }

    .card-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid var(--yb-color-border, #e2e8f0);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--yb-color-text-muted, #718096);
    }
  `;

  @consume({ context: authContext, subscribe: true })
  @state()
  authSession: AuthSession | null = null;

  @state() private cards: Card[] = [];
  @state() private searchQuery = "";
  @state() private loading = true;

  override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("authSession")) {
      if (this.authSession && authService.isAuthenticated()) {
        void this.loadCards();
      } else {
        this.cards = [];
        this.loading = false;
      }
    }
  }

  private isFetching = false;

  private async loadCards() {
    if (this.isFetching) return;
    this.isFetching = true;
    this.loading = true;
    try {
      if (authService.isAuthenticated()) {
        this.cards = await yotoApi.listCards();
      }
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to load card library.",
        errorDetail: err,
      });
    } finally {
      this.loading = false;
      this.isFetching = false;
    }
  }

  private onSearch(e: CustomEvent<{ value: string }>) {
    this.searchQuery = e.detail.value.toLowerCase();
  }

  override render() {
    const isAuthed = !!this.authSession && authService.isAuthenticated();
    if (!isAuthed) {
      return html`
        <yb-please-sign-in
          heading="Please Sign In"
          description="Sign in with your Yoto account to access your cards and library."
        ></yb-please-sign-in>
      `;
    }

    if (this.loading) {
      return html`<div class="empty-state"><p>Loading library...</p></div>`;
    }

    const filtered = this.cards.filter((c) =>
      (c.title || "").toLowerCase().includes(this.searchQuery),
    );

    return html`
      <div>
        <div class="header-bar">
          <div>
            <h2>My Cards (${this.cards.length})</h2>
          </div>
          <div class="search-filter">
            <yb-text-input
              placeholder="Search cards..."
              clearable
              @input=${this.onSearch}
            ></yb-text-input>
          </div>
        </div>

        ${
          filtered.length === 0
            ? html`<div class="empty-state">
                <p>No cards match your search.</p>
              </div>`
            : html`
                <div class="card-grid">
                  ${filtered.map((card) => {
                    const firstChapter = card.content?.chapters?.[0];
                    const iconUrl = firstChapter?.display?.icon16x16 || "";
                    const trackCount = card.content?.chapters?.length || 0;

                    return html`
                      <div class="card-item">
                        <div class="card-top">
                          <yb-pixel-icon
                            src=${iconUrl}
                            alt=${card.title}
                            size="md"
                          ></yb-pixel-icon>
                          <div style="flex: 1; min-width: 0;">
                            <h4 class="card-title">${card.title}</h4>
                            <span class="card-meta"
                              >${trackCount}
                              ${trackCount === 1 ? "track" : "tracks"}</span
                            >
                          </div>
                        </div>
                        <div class="card-actions">
                          <yb-button
                            variant="subtle"
                            size="small"
                            @click=${() => {
                              window.history.pushState(
                                null,
                                "",
                                `/cards/${card.cardId}`,
                              );
                              window.dispatchEvent(
                                new PopStateEvent("popstate"),
                              );
                            }}
                          >
                            Edit
                          </yb-button>
                        </div>
                      </div>
                    `;
                  })}
                </div>
              `
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-library-view": YbLibraryView;
  }
}
