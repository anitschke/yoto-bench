import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { ToastNotificationEvent, ToastOptions } from "./events.js";
import "./yb-toast.js";

interface QueuedToast extends ToastOptions {
  id: string;
}

/**
 * <yb-toast-manager>
 * Top-level notification queue listener and renderer.
 * Utilizes the HTML Popover API (popover="manual") to elevate toast notifications
 * into the browser's top layer, ensuring error toasts remain visible above modal dialog backdrops.
 * See: docs/rfcs/005-widgets-and-component-library.md
 *      docs/rfcs/006-error-handling-and-toast-notifications.md
 */
@customElement("yb-toast-manager")
export class YbToastManager extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
      border: none;
      background: transparent;
      padding: 0;
      margin: 0;
      overflow: visible;
      inset: auto 1.5rem 1.5rem auto;
    }

    /* Popover styles for top-layer elevation above native dialog backdrops */
    .toast-container[popover] {
      border: none;
      background: transparent;
      padding: 0;
      margin: 0;
      overflow: visible;
      inset: auto 1.5rem 1.5rem auto;
    }

    .toast-container:popover-open {
      display: flex;
    }

    yb-toast {
      pointer-events: auto;
    }
  `;

  @state() private toasts: QueuedToast[] = [];
  @query(".toast-container") private containerEl?: HTMLElement;

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(
      ToastNotificationEvent.EVENT_NAME,
      this.handleToastEvent as EventListener,
    );
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(
      ToastNotificationEvent.EVENT_NAME,
      this.handleToastEvent as EventListener,
    );
    if (this.containerEl && "hidePopover" in HTMLElement.prototype) {
      try {
        if (this.containerEl.matches(":popover-open")) {
          this.containerEl.hidePopover();
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (this.containerEl && "showPopover" in HTMLElement.prototype) {
      if (this.toasts.length > 0) {
        try {
          // Promote to the top of the top-layer stack (above open modal dialogs)
          if (this.containerEl.matches(":popover-open")) {
            this.containerEl.hidePopover();
          }
          this.containerEl.showPopover();
        } catch (err) {
          console.warn("[YbToastManager] Failed to elevate popover:", err);
        }
      } else {
        try {
          if (this.containerEl.matches(":popover-open")) {
            this.containerEl.hidePopover();
          }
        } catch {
          // Ignore
        }
      }
    }
  }

  private handleToastEvent = (e: CustomEvent<ToastOptions>) => {
    const detail = e.detail;
    const id = Math.random().toString(36).substring(2, 9);
    const toast: QueuedToast = { ...detail, id };

    // Diagnostic console logging per RFC 006
    if (detail.type === "error") {
      console.error(
        "[Yoto-Tools Error]",
        detail.message,
        detail.errorDetail || "",
      );
    } else if (detail.type === "warning") {
      console.warn(
        "[Yoto-Tools Warning]",
        detail.message,
        detail.errorDetail || "",
      );
    }

    this.toasts = [...this.toasts, toast];

    // Duration timer (0 means persistent)
    const duration =
      detail.durationMs !== undefined
        ? detail.durationMs
        : detail.type === "error"
          ? 0
          : 4000;
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  };

  private dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  override render() {
    return html`
      <div
        class="toast-container"
        popover="manual"
        role="status"
        aria-live="polite"
      >
        ${this.toasts.map(
          (t) => html`
            <yb-toast
              .message=${t.message}
              .type=${t.type || "info"}
              .actionLabel=${t.actionLabel || ""}
              @dismiss=${() => this.dismiss(t.id)}
              @action=${() => {
                if (t.onAction) t.onAction();
                this.dismiss(t.id);
              }}
            ></yb-toast>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-toast-manager": YbToastManager;
  }
}
