import { LitElement, html, css, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";

/**
 * <yb-dialog>
 * Accessible modal dialog component wrapping the native <dialog> element.
 * See: docs/rfcs/005-widgets-and-component-library.md
 */
@customElement("yb-dialog")
export class YbDialog extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    dialog {
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      background-color: var(--yb-color-surface, #ffffff);
      color: var(--yb-color-text, #1a202c);
      padding: 1.5rem;
      width: 90vw;
      max-width: 540px;
      box-shadow: var(--yb-shadow-modal, 0 20px 25px -5px rgba(0, 0, 0, 0.15));
      outline: none;
      box-sizing: border-box;
    }

    dialog::backdrop {
      background-color: rgba(18, 22, 26, 0.6);
      backdrop-filter: blur(2px);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--yb-color-border, #e2e8f0);
    }

    .heading {
      margin: 0;
      font-size: var(--yb-font-size-lg, 1.125rem);
      font-weight: 600;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--yb-color-text-muted, #718096);
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--yb-radius-sm, 6px);
    }

    .close-button:hover {
      color: var(--yb-color-text, #1a202c);
      background-color: var(--yb-color-surface-subtle, #f8f9fa);
    }

    .dialog-body {
      margin-bottom: 1.5rem;
    }

    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--yb-color-border, #e2e8f0);
    }
  `;

  @property({ type: String }) heading = "";
  @property({ type: Boolean, reflect: true }) open = false;
  @query("dialog") private dialogEl!: HTMLDialogElement;

  override updated(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has("open")) {
      if (this.open) {
        if (this.dialogEl && !this.dialogEl.open) {
          this.dialogEl.showModal();
        }
      } else {
        if (this.dialogEl && this.dialogEl.open) {
          this.dialogEl.close();
        }
      }
    }
  }

  public showModal(): void {
    this.open = true;
    if (this.dialogEl && !this.dialogEl.open) {
      this.dialogEl.showModal();
    }
  }

  public close(): void {
    const wasOpen = this.open || (this.dialogEl && this.dialogEl.open);
    this.open = false;
    if (this.dialogEl && this.dialogEl.open) {
      this.dialogEl.close();
    }
    if (wasOpen) {
      this.dispatchEvent(
        new CustomEvent("yb-dialog-close", { bubbles: true, composed: true }),
      );
      this.dispatchEvent(
        new CustomEvent("close", { bubbles: true, composed: true }),
      );
    }
  }

  private onCancel(e: Event): void {
    e.preventDefault();
    this.close();
  }

  private onNativeClose(): void {
    if (this.open) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("yb-dialog-close", { bubbles: true, composed: true }),
      );
      this.dispatchEvent(
        new CustomEvent("close", { bubbles: true, composed: true }),
      );
    }
  }

  private onDialogClick(e: MouseEvent): void {
    // Click on the backdrop closes the dialog
    if (!this.dialogEl) return;
    const rect = this.dialogEl.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      this.close();
    }
  }

  override render() {
    return html`
      <dialog
        @cancel=${this.onCancel}
        @close=${this.onNativeClose}
        @click=${this.onDialogClick}
      >
        <div class="dialog-header">
          <slot name="header">
            <h3 class="heading">${this.heading}</h3>
          </slot>
          <button
            type="button"
            class="close-button"
            @click=${this.close}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <slot></slot>
        </div>
        <div class="dialog-footer">
          <slot name="footer"></slot>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-dialog": YbDialog;
  }
}
