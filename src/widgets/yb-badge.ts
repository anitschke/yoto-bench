import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger";

/**
 * <yb-badge>
 * Status pill or tag component for device states, tags, and counts.
 * See: docs/rfcs/005-widgets-and-component-library.md
 */
@customElement("yb-badge")
export class YbBadge extends LitElement {
  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      border-radius: var(--yb-radius-full, 9999px);
      font-size: var(--yb-font-size-xs, 0.75rem);
      font-weight: 500;
      line-height: 1.2;
      border: 1px solid transparent;
      user-select: none;
    }

    .variant-neutral {
      background-color: var(--yb-color-neutral-subtle, #f1f5f9);
      color: var(--yb-color-neutral, #64748b);
      border-color: var(--yb-color-border, #e2e8f0);
    }

    .variant-success {
      background-color: var(--yb-color-success-subtle, #ecfdf5);
      color: var(--yb-color-success, #10b981);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .variant-warning {
      background-color: var(--yb-color-warning-subtle, #fffbeb);
      color: var(--yb-color-warning, #f59e0b);
      border-color: rgba(245, 158, 11, 0.2);
    }

    .variant-danger {
      background-color: var(--yb-color-danger-subtle, #fef2f2);
      color: var(--yb-color-danger, #ef4444);
      border-color: rgba(239, 68, 68, 0.2);
    }
  `;

  @property({ type: String }) variant: BadgeVariant = "neutral";

  override render() {
    return html`
      <span class="badge variant-${this.variant}">
        <slot name="leading"></slot>
        <slot></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-badge": YbBadge;
  }
}
