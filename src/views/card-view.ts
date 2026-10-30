import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { authService } from "../api/auth.js";
import { yotoApi } from "../api/client.js";
import { authContext } from "../context/index.js";
import { AuthSession, Card } from "../models/index.js";
import { dispatchToast } from "../widgets/events.js";
import "../widgets/yb-button.js";
import "../widgets/yb-badge.js";
import "../widgets/yb-pixel-icon.js";
import "../widgets/yb-text-input.js";
import "../widgets/yb-please-sign-in.js";

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
    }

    h2 {
      margin: 0;
      font-size: var(--yb-font-size-2xl, 1.5rem);
    }

    .track-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .track-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 10px);
      background: var(--yb-color-surface-subtle, #f8f9fa);
    }

    .track-title {
      flex: 1;
      font-weight: 500;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--yb-color-text-muted, #718096);
    }
  `;

  @consume({ context: authContext, subscribe: true })
  @state()
  authSession: AuthSession | null = null;

  @property({ type: String }) cardId = "";
  @state() private card: Card | null = null;
  @state() private loading = true;
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

    return html`
      <div class="card-editor">
        <div class="header-row">
          <div>
            <h2>${this.card.title}</h2>
            <small style="color: var(--yb-color-text-muted, #718096);"
              >ID: ${this.card.cardId}</small
            >
          </div>
          <yb-button
            variant="secondary"
            @click=${() => {
              window.history.pushState(null, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            ← Back to Library
          </yb-button>
        </div>

        <h3>Tracks (${chapters.length})</h3>
        <div class="track-list">
          ${chapters.map(
            (chap, index) => html`
              <div class="track-item">
                <span style="font-weight: 600; min-width: 24px;"
                  >${index + 1}</span
                >
                <yb-pixel-icon
                  src=${chap.display?.icon16x16 || ""}
                  alt=${chap.title}
                  size="sm"
                ></yb-pixel-icon>
                <div class="track-title">${chap.title}</div>
                ${chap.duration ? html`<small>${Math.floor(chap.duration)}s</small>` : ""}
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-card-view": YbCardView;
  }
}
