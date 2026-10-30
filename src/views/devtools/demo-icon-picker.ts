// ==============================================================================
// Devtools Icon Picker Interactive Demo Component
// See: AGENTS.md, docs/rfcs/022-devtools-and-widget-gallery.md
// ==============================================================================

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { IconRecord } from "../../services/icon-search.js";
import "../../widgets/yb-button.js";
import "../../widgets/yb-icon-picker.js";
import "../../widgets/yb-pixel-icon.js";
import "../../widgets/yb-badge.js";

/**
 * <yb-demo-icon-picker>
 * Interactive sandbox component rendering an icon picker trigger,
 * preview card showing the selected icon metadata, and the <yb-icon-picker> modal.
 */
@customElement("yb-demo-icon-picker")
export class YbDemoIconPicker extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .demo-container {
      display: flex;
      flex-direction: column;
      gap: var(--yb-spacing-md, 1rem);
    }

    .demo-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .preview-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 10px);
      background: var(--yb-color-surface-subtle, #f8f9fa);
      max-width: 500px;
    }

    .preview-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .preview-title {
      font-weight: 600;
      font-size: var(--yb-font-size-sm, 0.875rem);
      color: var(--yb-color-text, #1a202c);
    }

    .preview-meta {
      font-size: var(--yb-font-size-xs, 0.75rem);
      color: var(--yb-color-text-muted, #718096);
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .preview-meta code {
      font-family: var(--yb-font-family-mono);
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      padding: 0.15rem 0.35rem;
      border-radius: var(--yb-radius-sm, 4px);
    }
  `;

  @state() private pickerOpen = false;
  @state() private selectedIcon?: IconRecord;

  private handleOpen = (): void => {
    this.pickerOpen = true;
  };

  private handleIconSelected = (e: CustomEvent<{ icon: IconRecord }>): void => {
    this.selectedIcon = e.detail.icon;
    this.pickerOpen = false;
    this.dispatchEvent(
      new CustomEvent("yb-icon-selected", {
        detail: e.detail,
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleDialogClose = (): void => {
    this.pickerOpen = false;
    this.dispatchEvent(
      new CustomEvent("yb-dialog-close", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    return html`
      <div class="demo-container">
        <div class="demo-row">
          <yb-button
            variant="primary"
            data-testid="open-icon-picker-btn"
            @click=${this.handleOpen}
          >
            Open Icon Picker
          </yb-button>
        </div>

        <div class="preview-card" data-testid="selected-icon-preview">
          ${this.selectedIcon
            ? html`
                <yb-pixel-icon
                  size="lg"
                  src=${this.selectedIcon.path}
                  alt=${this.selectedIcon.title}
                ></yb-pixel-icon>
                <div class="preview-info">
                  <span class="preview-title" data-testid="selected-icon-title">
                    ${this.selectedIcon.title}
                  </span>
                  <div class="preview-meta">
                    <yb-badge
                      variant="neutral"
                      data-testid="selected-icon-provider"
                    >
                      ${this.selectedIcon.provider}
                    </yb-badge>
                    <code data-testid="selected-icon-id">
                      ${this.selectedIcon.id}
                    </code>
                  </div>
                </div>
              `
            : html`
                <span
                  style="color: var(--yb-color-text-muted); font-size: 0.875rem;"
                  data-testid="selected-icon-empty"
                >
                  No icon selected yet. Click "Open Icon Picker" to choose an
                  icon.
                </span>
              `}
        </div>

        <yb-icon-picker
          ?open=${this.pickerOpen}
          .selectedIconId=${this.selectedIcon?.id}
          @yb-icon-selected=${this.handleIconSelected}
          @yb-dialog-close=${this.handleDialogClose}
        ></yb-icon-picker>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-demo-icon-picker": YbDemoIconPicker;
  }
}
