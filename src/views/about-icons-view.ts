// ==============================================================================
// About Icon Sources & Licensing Information View
// See: AGENTS.md, docs/rfcs/001-project-vision-and-architecture.md,
// docs/rfcs/011-inverted-icon-index-and-search.md
// ==============================================================================

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "../widgets/yb-button.js";
import "../widgets/yb-badge.js";

@customElement("yb-about-icons-view")
export class YbAboutIconsView extends LitElement {
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

    h1,
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

    .source-card {
      background: var(--yb-color-surface-subtle, #f8f9fa);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 12px);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .source-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .source-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      color: var(--yb-color-text, #1a202c);
      font-size: var(--yb-font-size-xl, 1.25rem);
    }

    .source-icon {
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

    a {
      color: var(--yb-color-primary, #ff5500);
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
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
          <h1>About Icon Sources & Licensing</h1>
          <p class="subtitle">
            YotoBench indexes thousands of 16×16 pixel icons optimized for the
            LED matrix on Yoto players. Here is how our icon catalog is sourced,
            licensed, and rendered.
          </p>
        </div>

        <!-- Google Noto Emoji -->
        <section class="source-card">
          <div class="source-title-row">
            <h3 class="source-title">
              <span class="source-icon">✨</span>
              Google Noto Emoji
            </h3>
            <yb-badge variant="neutral">Apache 2.0 License</yb-badge>
          </div>
          <p>
            YotoBench includes over 3,700 pixel art icons derived from Google's
            open-source
            <a
              href="https://github.com/googlefonts/noto-emoji"
              target="_blank"
              rel="noopener noreferrer"
              >Noto Emoji</a
            >
            library. Each emoji is downscaled and color-quantized into a crisp
            16×16 pixel grid.
          </p>
          <p>
            Noto Emoji is distributed under the
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              >Apache License, Version 2.0</a
            >. Search tags and categories are powered by Unicode CLDR
            classifications, enabling fast multi-word and prefix queries (e.g.
            "sleepy moon", "space rocket").
          </p>
        </section>

        <!-- Official Yoto Icons -->
        <section class="source-card">
          <div class="source-title-row">
            <h3 class="source-title">
              <span class="source-icon">🟠</span>
              Official Yoto Display Art
            </h3>
            <yb-badge variant="success">Official Yoto API</yb-badge>
          </div>
          <p>
            The official Yoto display icons are classic 16×16 icons published
            by Yoto Ltd for use across official story and audio cards. These
            icons are synchronized directly through Yoto's official REST API
            (<code>api.yotoplay.com</code>) using your authenticated Yoto
            account.
          </p>
          <p>
            Official icons are intended for personal use on your cards,
            playlists, and linked Yoto players.
          </p>
        </section>

        <!-- Custom Uploads -->
        <section class="source-card">
          <div class="source-title-row">
            <h3 class="source-title">
              <span class="source-icon">🖼️</span>
              Custom User Uploads
            </h3>
            <yb-badge variant="warning">User Created</yb-badge>
          </div>
          <p>
            Users can upload custom artwork in PNG, JPEG, or WebP formats.
            YotoBench automatically resizes and samples the uploaded image
            client-side via HTML5 Canvas using nearest-neighbor interpolation to
            retain crisp pixel definition.
          </p>
          <p>
            Uploaded icons are sent directly to your private Yoto account media
            library (as <code>yoto:#&lt;mediaId&gt;</code>) and are never stored on
            intermediary third-party servers.
          </p>
        </section>

        <!-- Community Repositories (YotoIcons.com) -->
        <section class="source-card">
          <div class="source-title-row">
            <h3 class="source-title">
              <span class="source-icon">🎨</span>
              Community Repositories (YotoIcons.com)
            </h3>
            <yb-badge variant="neutral">Upcoming Integration</yb-badge>
          </div>
          <p>
            The broader Yoto creator community maintains active pixel art
            catalogs, most notably
            <a
              href="https://yotoicons.com/"
              target="_blank"
              rel="noopener noreferrer"
              >YotoIcons.com</a
            >.
          </p>
          <p>
            As community integrations roll out, each community-authored icon will
            prominently display its source and the creator's username via the
            hover attribution popover, ensuring proper credit and attribution.
          </p>
        </section>

        <!-- Hardware Display & Contrast -->
        <section class="source-card">
          <div class="source-title-row">
            <h3 class="source-title">
              <span class="source-icon">💡</span>
              Hardware LED Matrix & Contrast Guidelines
            </h3>
            <yb-badge variant="neutral">Hardware Specs</yb-badge>
          </div>
          <p>
            Physical Yoto players (Generation 2, Generation 3, and Yoto Mini)
            feature a physical 16×16 RGB LED pixel matrix behind the front
            grille.
          </p>
          <ul>
            <li>
              <strong>Dimensions:</strong> Exactly 16 pixels wide by 16 pixels
              high.
            </li>
            <li>
              <strong>Contrast:</strong> High-contrast foregrounds with dark or
              transparent backgrounds produce the sharpest visibility through
              the player's plastic shell.
            </li>
            <li>
              <strong>Rendering:</strong> All preview icons in YotoBench are
              rendered with <code>image-rendering: pixelated</code> to match the
              crisp square pixels of the physical hardware display.
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
            ← Back to Library
          </yb-button>
          <yb-button
            variant="secondary"
            @click=${() => {
              window.history.pushState(null, "", "/privacy");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            Privacy Policy
          </yb-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-about-icons-view": YbAboutIconsView;
  }
}
