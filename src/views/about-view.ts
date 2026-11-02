// ==============================================================================
// About / Why YotoBench Information View
// See: AGENTS.md, docs/rfcs/001-project-vision-and-architecture.md,
// docs/rfcs/010-podcast-rss-importer-and-card-sync.md, docs/rfcs/011-inverted-icon-index-and-search.md
// ==============================================================================

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "../widgets/yb-button.js";
import "../widgets/yb-badge.js";

@customElement("yb-about-view")
export class YbAboutView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 820px;
      margin: 0 auto;
    }

    .container {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      padding: 2.5rem;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
    }

    .hero-header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--yb-color-border, #e2e8f0);
      padding-bottom: 1.5rem;
    }

    h2 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      color: var(--yb-color-text, #1a202c);
      font-size: var(--yb-font-size-2xl, 1.75rem);
    }

    .subtitle {
      font-size: var(--yb-font-size-lg, 1.125rem);
      color: var(--yb-color-text-secondary, #4a5568);
      margin: 0;
      line-height: 1.5;
    }

    .feature-card {
      background: var(--yb-color-surface-subtle, #f8f9fa);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 12px);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .feature-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0;
      margin-bottom: 0.75rem;
      color: var(--yb-color-text, #1a202c);
      font-size: var(--yb-font-size-xl, 1.25rem);
    }

    .feature-icon {
      font-size: 1.5rem;
    }

    p,
    li {
      color: var(--yb-color-text, #1a202c);
      line-height: 1.6;
    }

    ul {
      margin: 0.5rem 0 1rem 1.25rem;
      padding: 0;
    }

    .actions-row {
      margin-top: 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
  `;

  override render() {
    return html`
      <div class="container">
        <div class="hero-header">
          <h2>About YotoBench</h2>
          <p class="subtitle">
            A fast, private, browser-based companion app designed for families
            curating Make Your Own (MYO) cards and managing Yoto players.
          </p>
        </div>

        <section class="feature-card">
          <h3 class="feature-title">
            <span class="feature-icon">🎙️</span>
            1. Truly Offline Podcast Listening on MYO Cards
          </h3>
          <p>
            Standard podcast streaming cards fail whenever an active Wi-Fi
            connection is unavailable. YotoBench solves this by downloading RSS
            podcast episodes, transcoding the audio in your browser via Web Audio
            and OPFS, and baking each track directly onto your physical MYO
            cards.
          </p>
          <p>
            Your children can enjoy their favorite bedtime podcasts, stories,
            and audio adventures wherever life takes you—on road trips, flights,
            camping retreats, or off-grid adventures without buffering or dropped
            connections.
          </p>
        </section>

        <section class="feature-card">
          <h3 class="feature-title">
            <span class="feature-icon">🎨</span>
            2. Instant & Searchable Icon Discovery
          </h3>
          <p>
            No more hunting through nested directories or waiting for large
            image catalogs to load. YotoBench features a high-performance
            in-memory inverted search index containing over 3,700 pixel icons:
          </p>
          <ul>
            <li>
              <strong>Google Noto Emoji Icons:</strong> High-contrast, expressive
              pixel art across every category (animals, vehicles, food, nature,
              symbols).
            </li>
            <li>
              <strong>Official Yoto Display Art:</strong> Classic 16×16 icons
              pre-indexed with descriptive keywords for effortless discovery.
            </li>
            <li>
              <strong>Custom Art & Auto-Resizing:</strong> Drop any PNG or JPEG
              to automatically scale and quantize into pixel-perfect 16×16
              format.
            </li>
          </ul>
        </section>

        <section class="feature-card">
          <h3 class="feature-title">
            <span class="feature-icon">🛡️</span>
            3. Privacy-First & Completely Serverless
          </h3>
          <p>
            YotoBench runs 100% client-side inside your browser. We never operate
            intermediary backend servers, host databases, or route audio
            transfers through third parties:
          </p>
          <ul>
            <li>
              <strong>Direct Browser-to-Yoto APIs:</strong> OAuth authentication
              tokens and audio uploads travel directly between your device and
              Yoto's official servers.
            </li>
            <li>
              <strong>No Credential Storage:</strong> Your credentials are never
              stored or transmitted to us.
            </li>
            <li>
              <strong>Local Staging:</strong> Temporary audio chunks stage
              securely in your browser's Origin Private File System (OPFS) and
              are discarded immediately upon upload completion.
            </li>
          </ul>
        </section>

        <div class="actions-row">
          <yb-button
            variant="primary"
            @click=${() => {
              window.history.pushState(null, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            Explore My Cards
          </yb-button>
          <yb-button
            variant="secondary"
            @click=${() => {
              window.history.pushState(null, "", "/privacy");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            Read Privacy Policy
          </yb-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-about-view": YbAboutView;
  }
}
