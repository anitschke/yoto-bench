// ==============================================================================
// Icon Attribution Popover Widget (HTML Popover API)
// See: AGENTS.md, docs/rfcs/005-widgets-and-component-library.md,
// docs/rfcs/011-inverted-icon-index-and-search.md,
// https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
// ==============================================================================

import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";

/**
 * <yb-icon-attribution-popover>
 * A lightweight, high-contrast attribution popover component leveraging the modern HTML Popover API
 * (popover="manual") to elevate icon metadata (icon title, source/provider, and creator author)
 * into the browser's top layer on hover or focus without cluttering the icon picker grid.
 */
@customElement("yb-icon-attribution-popover")
export class YbIconAttributionPopover extends LitElement {
  static override styles = css`
    :host {
      display: inline;
      pointer-events: none;
    }

    .popover-container,
    .popover-content {
      position: fixed;
      margin: 0;
      padding: 0.5rem 0.75rem;
      border-radius: var(--yb-radius-md, 8px);
      background: var(--yb-color-surface-dark, #0f172a);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4),
        0 4px 6px -2px rgba(0, 0, 0, 0.25);
      font-family: inherit;
      font-size: var(--yb-font-size-xs, 0.75rem);
      line-height: 1.35;
      pointer-events: none !important;
      z-index: 10000;
      max-width: 240px;
      width: max-content;
      display: none;
      flex-direction: column;
      gap: 0.2rem;
      text-align: left;
      white-space: normal;
    }

    .popover-container *,
    .popover-content * {
      pointer-events: none !important;
    }

    .popover-container[popover],
    .popover-content[popover] {
      inset: auto auto auto auto;
      overflow: visible;
    }

    .popover-container:popover-open,
    .popover-content:popover-open {
      display: flex !important;
    }

    .icon-title {
      font-weight: 600;
      font-size: var(--yb-font-size-xs, 0.8125rem);
      color: #ffffff;
      word-break: break-word;
    }

    .icon-meta {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .source-badge,
    .badge {
      display: inline-block;
      padding: 0.1rem 0.4rem;
      border-radius: var(--yb-radius-sm, 4px);
      font-size: 0.6875rem;
      font-weight: 500;
      line-height: 1.2;
    }

    .source-badge.noto-emoji,
    .badge.noto-emoji {
      background: rgba(59, 130, 246, 0.25);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.4);
    }

    .source-badge.yoto,
    .badge.yoto {
      background: rgba(255, 85, 0, 0.25);
      color: #fdba74;
      border: 1px solid rgba(255, 85, 0, 0.4);
    }

    .source-badge.custom,
    .badge.custom {
      background: rgba(16, 185, 129, 0.25);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    .source-badge.yotoicons,
    .badge.yotoicons {
      background: rgba(168, 85, 247, 0.25);
      color: #d8b4fe;
      border: 1px solid rgba(168, 85, 247, 0.4);
    }

    .author-tag {
      color: #94a3b8;
      font-size: 0.6875rem;
    }
  `;

  @property({ type: String }) iconTitle = "";
  @property({ type: String }) provider = "";
  @property({ type: String }) author = "";

  @query(".popover-container") private popoverEl?: HTMLElement;

  private parentEl: HTMLElement | null = null;
  private static activePopover: YbIconAttributionPopover | null = null;

  /**
   * Closes any currently active icon attribution popover.
   * Useful when closing the dialog or scrolling the icon list.
   */
  public static hideActive(): void {
    if (YbIconAttributionPopover.activePopover) {
      YbIconAttributionPopover.activePopover.hide();
      YbIconAttributionPopover.activePopover = null;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setupListeners();
  }

  override firstUpdated(): void {
    if (!this.parentEl) {
      this.setupListeners();
    }
    // If the cursor is already hovering the anchor when mounted, show immediately
    if (this.parentEl?.matches(":hover")) {
      void this.show(this.parentEl);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.teardownListeners();
    this.hide();
  }

  private setupListeners(): void {
    if (this.parentEl) return;
    this.parentEl = this.parentElement;
    if (this.parentEl) {
      this.parentEl.addEventListener("mouseenter", this.handleMouseEnter);
      this.parentEl.addEventListener("mouseleave", this.handleMouseLeave);
      this.parentEl.addEventListener("focusin", this.handleMouseEnter);
      this.parentEl.addEventListener("focusout", this.handleMouseLeave);
      this.parentEl.addEventListener("click", this.handleMouseLeave);
    }
  }

  private teardownListeners(): void {
    if (this.parentEl) {
      this.parentEl.removeEventListener("mouseenter", this.handleMouseEnter);
      this.parentEl.removeEventListener("mouseleave", this.handleMouseLeave);
      this.parentEl.removeEventListener("focusin", this.handleMouseEnter);
      this.parentEl.removeEventListener("focusout", this.handleMouseLeave);
      this.parentEl.removeEventListener("click", this.handleMouseLeave);
      this.parentEl = null;
    }
  }

  private handleMouseEnter = (): void => {
    if (this.parentEl) {
      void this.show(this.parentEl);
    }
  };

  private handleMouseLeave = (): void => {
    this.hide();
  };

  public async show(anchor: HTMLElement): Promise<void> {
    if (!this.popoverEl) {
      await this.updateComplete;
    }
    if (!this.popoverEl) return;

    // Dismiss any previously open popover to guarantee only one popover shows at a time
    if (
      YbIconAttributionPopover.activePopover &&
      YbIconAttributionPopover.activePopover !== this
    ) {
      YbIconAttributionPopover.activePopover.hide();
    }
    YbIconAttributionPopover.activePopover = this;

    // Reset inline display style before opening
    this.popoverEl.style.display = "";

    if ("showPopover" in HTMLElement.prototype) {
      try {
        if (!this.popoverEl.matches(":popover-open")) {
          this.popoverEl.showPopover();
        }
      } catch {
        this.popoverEl.style.display = "flex";
      }
    } else {
      this.popoverEl.style.display = "flex";
    }

    this.positionPopover(anchor);
  }

  public hide(): void {
    if (YbIconAttributionPopover.activePopover === this) {
      YbIconAttributionPopover.activePopover = null;
    }

    if (!this.popoverEl) return;

    if ("hidePopover" in HTMLElement.prototype) {
      try {
        if (this.popoverEl.matches(":popover-open")) {
          this.popoverEl.hidePopover();
        }
      } catch {
        // Fallback below
      }
    }

    // Clear inline display style when native popover is supported,
    // only set display: none in non-popover fallback environments
    if (!("showPopover" in HTMLElement.prototype)) {
      this.popoverEl.style.display = "none";
    } else {
      this.popoverEl.style.display = "";
    }
  }

  private positionPopover(anchor: HTMLElement): void {
    if (!this.popoverEl) return;

    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = this.popoverEl.getBoundingClientRect();

    // Position above anchor if space permits, otherwise below
    let top = anchorRect.top - popoverRect.height - 6;
    if (top < 10) {
      top = anchorRect.bottom + 6;
    }

    let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;
    if (left < 8) left = 8;
    if (left + popoverRect.width > window.innerWidth - 8) {
      left = window.innerWidth - popoverRect.width - 8;
    }

    this.popoverEl.style.top = `${Math.round(top)}px`;
    this.popoverEl.style.left = `${Math.round(left)}px`;
  }

  private formatProviderLabel(): string {
    switch (this.provider) {
      case "noto-emoji":
        return "Google Noto Emoji";
      case "yoto":
        return "Official Yoto";
      case "custom":
        return "Custom Upload";
      case "yotoicons":
        return "YotoIcons.com";
      default:
        return this.provider || "Icon";
    }
  }

  override render() {
    return html`
      <div
        class="popover-container popover-content"
        popover="manual"
        role="tooltip"
        aria-hidden="true"
      >
        <span class="icon-title">${this.iconTitle}</span>
        <div class="icon-meta">
          <span class="source-badge badge ${this.provider}">
            ${this.formatProviderLabel()}
          </span>
          ${this.author
            ? html`<span class="author-tag">by ${this.author}</span>`
            : null}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-icon-attribution-popover": YbIconAttributionPopover;
  }
}
