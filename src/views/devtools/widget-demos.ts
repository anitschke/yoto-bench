import { html, TemplateResult } from "lit";
import "../../widgets/yb-button.js";
import "../../widgets/yb-dialog.js";
import "../../widgets/yb-dropdown.js";
import "../../widgets/yb-text-input.js";
import "../../widgets/yb-number-input.js";
import "../../widgets/yb-badge.js";
import "../../widgets/yb-progress-bar.js";
import "../../widgets/yb-pixel-icon.js";
import "../../widgets/yb-toast.js";
import "../../widgets/yb-please-sign-in.js";
import { dispatchToast } from "../../widgets/events.js";

export interface WidgetDemoItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  renderDemo: (ctx: DemoContext) => TemplateResult;
}

export interface DemoContext {
  logEvent: (name: string, detail?: unknown) => void;
  openDialog?: () => void;
}

export const WIDGET_DEMOS: WidgetDemoItem[] = [
  {
    id: "button",
    title: "Action Button",
    tag: "<yb-button>",
    description:
      "Standard interactive button supporting primary (orange), secondary, subtle, and danger variants, sizes sm/md/lg, and disabled/loading states.",
    renderDemo: (ctx) => html`
      <div class="demo-section">
        <h4>Variants</h4>
        <div class="demo-row">
          <yb-button
            variant="primary"
            @click=${() => ctx.logEvent("click", "primary button clicked")}
          >
            Primary
          </yb-button>
          <yb-button
            variant="secondary"
            @click=${() => ctx.logEvent("click", "secondary button clicked")}
          >
            Secondary
          </yb-button>
          <yb-button
            variant="subtle"
            @click=${() => ctx.logEvent("click", "subtle button clicked")}
          >
            Subtle
          </yb-button>
          <yb-button
            variant="danger"
            @click=${() => ctx.logEvent("click", "danger button clicked")}
          >
            Danger
          </yb-button>
        </div>

        <h4>Sizes</h4>
        <div class="demo-row">
          <yb-button size="small">Small</yb-button>
          <yb-button size="medium">Medium (Default)</yb-button>
          <yb-button size="large">Large</yb-button>
        </div>

        <h4>States</h4>
        <div class="demo-row">
          <yb-button disabled>Disabled</yb-button>
          <yb-button loading>Loading</yb-button>
          <yb-button variant="danger" loading>Deleting...</yb-button>
        </div>

        <h4>Slots & Icons</h4>
        <div class="demo-row">
          <yb-button>
            <span slot="prefix">◀</span>
            Previous
          </yb-button>
          <yb-button variant="secondary">
            Next
            <span slot="suffix">▶</span>
          </yb-button>
        </div>
      </div>
    `,
  },
  {
    id: "dialog",
    title: "Modal Dialog",
    tag: "<yb-dialog>",
    description:
      "Accessible modal overlay wrapper around native <dialog> with focus trap, backdrop dismissal, ESC key handling, and header/footer slots.",
    renderDemo: (ctx) => html`
      <div class="demo-section">
        <h4>Interactive Modal Trigger</h4>
        <div class="demo-row">
          <yb-button
            variant="primary"
            @click=${() => {
              const dialog = document.querySelector(
                "#demo-sample-dialog",
              ) as HTMLElement & {
                open?: boolean;
              };
              if (dialog) dialog.open = true;
              ctx.logEvent("dialog-open", "Modal triggered open");
            }}
          >
            Open Test Dialog
          </yb-button>
        </div>

        <yb-dialog
          id="demo-sample-dialog"
          heading="Sample Modal Dialog"
          @yb-close=${() => ctx.logEvent("yb-close", "Dialog closed")}
        >
          <p>
            This modal wraps the native HTML
            <code>&lt;dialog&gt;</code> element. It provides top-layer
            elevation, background backdrop dimming, and native focus trapping.
          </p>
          <p>
            Press <kbd>Escape</kbd> or click the backdrop outside this card to
            dismiss.
          </p>
          <div
            slot="footer"
            style="display: flex; gap: 0.5rem; justify-content: flex-end;"
          >
            <yb-button
              variant="subtle"
              @click=${() => {
                const dialog = document.querySelector(
                  "#demo-sample-dialog",
                ) as HTMLElement & {
                  open?: boolean;
                };
                if (dialog) dialog.open = false;
              }}
            >
              Cancel
            </yb-button>
            <yb-button
              variant="primary"
              @click=${() => {
                const dialog = document.querySelector(
                  "#demo-sample-dialog",
                ) as HTMLElement & {
                  open?: boolean;
                };
                if (dialog) dialog.open = false;
                ctx.logEvent("confirm", "Dialog confirmed");
              }}
            >
              Confirm
            </yb-button>
          </div>
        </yb-dialog>
      </div>
    `,
  },
  {
    id: "dropdown",
    title: "Dropdown Menu",
    tag: "<yb-dropdown>",
    description:
      "Custom select dropdown conforming to WAI-ARIA combobox guidelines with arrow navigation, search filtering, and rich badges.",
    renderDemo: (ctx) => html`
      <div class="demo-section">
        <h4>Standard Dropdown</h4>
        <div style="max-width: 320px;">
          <yb-dropdown
            label="Audio Quality Preset"
            placeholder="Select bitrate..."
            .options=${[
              {
                value: "standard",
                label: "Standard (128 kbps)",
                badge: "Fast",
              },
              {
                value: "high",
                label: "High Quality (192 kbps)",
                badge: "Recommended",
              },
              {
                value: "lossless",
                label: "Original Master (Uncompressed)",
                badge: "Large",
              },
            ]}
            @yb-change=${(e: CustomEvent<{ value: string }>) =>
              ctx.logEvent("yb-change", e.detail)}
          ></yb-dropdown>
        </div>

        <h4 style="margin-top: 1.5rem;">Disabled State</h4>
        <div style="max-width: 320px;">
          <yb-dropdown
            label="Read-only Selection"
            disabled
            .options=${[{ value: "1", label: "Fixed Value" }]}
            value="1"
          ></yb-dropdown>
        </div>
      </div>
    `,
  },
  {
    id: "text-input",
    title: "Text Input",
    tag: "<yb-text-input>",
    description:
      "Accessible single-line text and search field with integrated label, clear button, error feedback, and debounced typing.",
    renderDemo: (ctx) => html`
      <div class="demo-section">
        <h4>Variants & States</h4>
        <div
          style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;"
        >
          <yb-text-input
            label="Card Title"
            placeholder="e.g. Bedtime Stories Vol. 1"
            clearable
            @yb-input=${(e: CustomEvent<{ value: string }>) =>
              ctx.logEvent("yb-input", e.detail)}
          ></yb-text-input>

          <yb-text-input
            label="Search Query"
            placeholder="Search icons..."
            value="Dinosaur"
            clearable
            @yb-input=${(e: CustomEvent<{ value: string }>) =>
              ctx.logEvent("yb-input", e.detail)}
          ></yb-text-input>

          <yb-text-input
            label="With Validation Error"
            value="invalid-podcast-feed"
            errorMessage="Must be a valid https:// RSS URL"
          ></yb-text-input>

          <yb-text-input
            label="Disabled Field"
            value="Immutable Track ID: trk_94819"
            disabled
          ></yb-text-input>
        </div>
      </div>
    `,
  },
  {
    id: "number-input",
    title: "Number Input",
    tag: "<yb-number-input>",
    description:
      "Numeric stepper input with decrement/increment controls, min/max clamping, and step constraints.",
    renderDemo: (ctx) => html`
      <div class="demo-section">
        <h4>Numeric Steppers</h4>
        <div
          style="display: flex; flex-direction: column; gap: 1rem; max-width: 300px;"
        >
          <yb-number-input
            label="Max Podcast Episodes"
            .min=${1}
            .max=${50}
            .value=${10}
            @yb-change=${(e: CustomEvent<{ value: number }>) =>
              ctx.logEvent("yb-change", e.detail)}
          ></yb-number-input>

          <yb-number-input
            label="Volume Step (0-100)"
            .min=${0}
            .max=${100}
            .step=${5}
            .value=${65}
            @yb-change=${(e: CustomEvent<{ value: number }>) =>
              ctx.logEvent("yb-change", e.detail)}
          ></yb-number-input>

          <yb-number-input
            label="Disabled Stepper"
            .value=${5}
            disabled
          ></yb-number-input>
        </div>
      </div>
    `,
  },
  {
    id: "badge",
    title: "Status Badge",
    tag: "<yb-badge>",
    description:
      "Compact semantic status chips and provider tags with success, warning, danger, and neutral palettes.",
    renderDemo: () => html`
      <div class="demo-section">
        <h4>Color Variants</h4>
        <div class="demo-row">
          <yb-badge variant="success">Online</yb-badge>
          <yb-badge variant="warning">Syncing (85%)</yb-badge>
          <yb-badge variant="danger">Disconnected</yb-badge>
          <yb-badge variant="neutral">Official Yoto</yb-badge>
          <yb-badge variant="neutral">Community</yb-badge>
        </div>

        <h4>With Micro-icons or Numbers</h4>
        <div class="demo-row">
          <yb-badge variant="success">● Connected</yb-badge>
          <yb-badge variant="warning">⚡ 24% Battery</yb-badge>
          <yb-badge variant="neutral">16×16 px</yb-badge>
        </div>
      </div>
    `,
  },
  {
    id: "progress-bar",
    title: "Progress Bar",
    tag: "<yb-progress-bar>",
    description:
      "Determinate fill indicators (0–100%) and indeterminate pulsing bars for audio hashing and S3 uploads.",
    renderDemo: () => html`
      <div class="demo-section">
        <h4>Determinate Progress</h4>
        <div
          style="display: flex; flex-direction: column; gap: 1rem; max-width: 450px;"
        >
          <yb-progress-bar
            .value=${25}
            label="Unpacking ZIP archive... (25%)"
          ></yb-progress-bar>
          <yb-progress-bar
            .value=${70}
            label="Uploading Track 7 of 10... (70%)"
          ></yb-progress-bar>
          <yb-progress-bar
            .value=${100}
            label="Upload Complete! (100%)"
          ></yb-progress-bar>
        </div>

        <h4 style="margin-top: 1.5rem;">Indeterminate (Pulsing)</h4>
        <div style="max-width: 450px;">
          <yb-progress-bar
            indeterminate
            label="Computing SHA-256 audio digests..."
          ></yb-progress-bar>
        </div>
      </div>
    `,
  },
  {
    id: "pixel-icon",
    title: "Pixel Icon Display",
    tag: "<yb-pixel-icon>",
    description:
      "Crisp 16×16 pixelated display with dark high-contrast canvas, sizing presets (sm/md/lg), and fallback handling.",
    renderDemo: () => html`
      <div class="demo-section">
        <h4>Sizes on Dark Canvas</h4>
        <div class="demo-row" style="align-items: flex-end;">
          <div style="text-align: center;">
            <yb-pixel-icon
              size="sm"
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAChJREFUOE9jZKAQMFKon2HUAAYGhv9//v//T6wB+A3Ahkb1kOoBAwMDAO3iCfe62fC5AAAAAElFTkSuQmCC"
            ></yb-pixel-icon>
            <div
              style="font-size: 0.75rem; color: var(--yb-color-text-muted); margin-top: 4px;"
            >
              sm (24px)
            </div>
          </div>
          <div style="text-align: center;">
            <yb-pixel-icon
              size="md"
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAChJREFUOE9jZKAQMFKon2HUAAYGhv9//v//T6wB+A3Ahkb1kOoBAwMDAO3iCfe62fC5AAAAAElFTkSuQmCC"
            ></yb-pixel-icon>
            <div
              style="font-size: 0.75rem; color: var(--yb-color-text-muted); margin-top: 4px;"
            >
              md (32px)
            </div>
          </div>
          <div style="text-align: center;">
            <yb-pixel-icon
              size="lg"
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAChJREFUOE9jZKAQMFKon2HUAAYGhv9//v//T6wB+A3Ahkb1kOoBAwMDAO3iCfe62fC5AAAAAElFTkSuQmCC"
            ></yb-pixel-icon>
            <div
              style="font-size: 0.75rem; color: var(--yb-color-text-muted); margin-top: 4px;"
            >
              lg (48px)
            </div>
          </div>
        </div>

        <h4 style="margin-top: 1.5rem;">Broken Image / Fallback State</h4>
        <div class="demo-row">
          <yb-pixel-icon
            size="md"
            src="/assets/non-existent-icon.png"
          ></yb-pixel-icon>
          <span style="font-size: 0.875rem; color: var(--yb-color-text-muted);">
            Renders accessible fallback canvas when image fails to load.
          </span>
        </div>
      </div>
    `,
  },
  {
    id: "toast",
    title: "Toast Notifications",
    tag: "<yb-toast> & <yb-toast-manager>",
    description:
      "Ephemeral or persistent notification toasts dispatched via window event 'yb-toast' with automatic queue orchestration.",
    renderDemo: (ctx) => html`
      <div class="demo-section">
        <h4>Interactive Dispatch Sandbox</h4>
        <p style="font-size: 0.875rem; color: var(--yb-color-text-muted);">
          Clicking these buttons dispatches real <code>yb-toast</code> custom
          events to the global <code>&lt;yb-toast-manager&gt;</code>:
        </p>
        <div class="demo-row">
          <yb-button
            variant="secondary"
            @click=${() => {
              dispatchToast(window, {
                type: "info",
                message: "Syncing playlist changes with Yoto Cloud...",
              });
              ctx.logEvent("toast", { type: "info" });
            }}
          >
            Info Toast
          </yb-button>

          <yb-button
            variant="primary"
            @click=${() => {
              dispatchToast(window, {
                type: "success",
                message: "MYO Card updated successfully!",
              });
              ctx.logEvent("toast", { type: "success" });
            }}
          >
            Success Toast
          </yb-button>

          <yb-button
            variant="secondary"
            @click=${() => {
              dispatchToast(window, {
                type: "warning",
                message:
                  "Audio bitrate exceeds 192 kbps. Transcode recommended.",
              });
              ctx.logEvent("toast", { type: "warning" });
            }}
          >
            Warning Toast
          </yb-button>

          <yb-button
            variant="danger"
            @click=${() => {
              dispatchToast(window, {
                type: "error",
                message:
                  "Upload failed: Network timeout. S3 presigned URL expired.",
                durationMs: 0,
                actionLabel: "Retry",
                onAction: () => {
                  ctx.logEvent(
                    "retry-clicked",
                    "User clicked Retry on error toast",
                  );
                },
              });
              ctx.logEvent("toast", { type: "error", persistent: true });
            }}
          >
            Persistent Error Toast
          </yb-button>
        </div>

        <h4 style="margin-top: 1.5rem;">Static Banner Previews</h4>
        <div
          style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 450px;"
        >
          <yb-toast
            type="info"
            message="Connecting to AWS IoT broker..."
          ></yb-toast>
          <yb-toast
            type="error"
            message="401 Unauthorized: Session token expired"
            actionLabel="Re-authenticate"
          ></yb-toast>
        </div>
      </div>
    `,
  },
  {
    id: "auth-prompt",
    title: "Sign In Prompt",
    tag: "<yb-please-sign-in>",
    description:
      "Standardized empty-state authentication card displayed across views when no valid OAuth session exists.",
    renderDemo: () => html`
      <div class="demo-section">
        <h4>Default Authentication Empty State</h4>
        <yb-please-sign-in
          heading="Sign in to Manage Cards"
          description="Authenticate with your Yoto account to access your personal MYO library and physical cards."
        ></yb-please-sign-in>
      </div>
    `,
  },
];
