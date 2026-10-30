import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { resolveIconMediaId } from "../services/icon-search.js";

export type PixelIconSize = "sm" | "md" | "lg" | "xl";

/**
 * <yb-pixel-icon>
 * Standardizes 16x16 pixel icon rendering with crisp edges and contrast background canvas.
 * See: docs/rfcs/005-widgets-and-component-library.md
 */
@customElement("yb-pixel-icon")
export class YbPixelIcon extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .icon-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--yb-color-surface-dark, #12161a);
      border-radius: var(--yb-radius-sm, 6px);
      overflow: hidden;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    }

    .size-sm {
      width: 24px;
      height: 24px;
    }

    .size-md {
      width: 32px;
      height: 32px;
    }

    .size-lg {
      width: 48px;
      height: 48px;
    }

    .size-xl {
      width: 64px;
      height: 64px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    }

    .fallback {
      color: var(--yb-color-text-muted, #718096);
      font-size: 10px;
      user-select: none;
    }
  `;

  @property({ type: String }) src = "";
  @property({ type: String }) alt = "";
  @property({ type: String }) size: PixelIconSize = "md";
  @state() private hasError = false;

  override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("src")) {
      this.hasError = false;
    }
  }

  /**
   * Resolves relative paths (e.g. 'assets/icons/...') to absolute paths ('/assets/icons/...')
   * or "yoto:#<mediaId>" references to cached image URLs, ensuring assets load correctly
   * across deep SPA client-side routes (e.g. /cards/:id).
   */
  private get resolvedSrc(): string {
    if (!this.src) return "";

    let target = this.src;
    if (target.startsWith("yoto:#")) {
      const mapped = resolveIconMediaId(target);
      if (mapped) {
        target = mapped;
      }
    }

    if (
      target.startsWith("/") ||
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("blob:") ||
      target.startsWith("data:")
    ) {
      return target;
    }
    return `/${target}`;
  }

  private onError() {
    this.hasError = true;
  }

  override render() {
    return html`
      <div class="icon-container size-${this.size}">
        ${
          this.src && !this.hasError
            ? html`
                <img
                  src=${this.resolvedSrc}
                  alt=${this.alt}
                  loading="lazy"
                  @error=${this.onError}
                />
              `
            : html`<span class="fallback">16×16</span>`
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-pixel-icon": YbPixelIcon;
  }
}
