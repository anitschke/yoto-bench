import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { authService } from "../api/auth.js";
import { dispatchToast } from "../widgets/events.js";
import "../widgets/yb-button.js";

@customElement("yb-callback-view")
export class YbCallbackView extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      text-align: center;
    }

    .box {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      padding: 3rem 2rem;
      max-width: 440px;
      width: 100%;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--yb-color-primary, #ff5c35);
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 750ms linear infinite;
      margin: 0 auto 1.5rem;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `;

  @state() private error = "";

  override async connectedCallback() {
    super.connectedCallback();
    await this.processCallback();
  }

  private async processCallback() {
    const params = new URLSearchParams(window.location.search);
    try {
      const completed = await authService.handleCallback(params);
      if (completed) {
        // Successfully exchanged tokens on this origin
        dispatchToast(window, {
          type: "success",
          message: "Signed in successfully!",
        });
        window.history.replaceState(null, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error = msg;
      dispatchToast(window, {
        type: "error",
        message: "Authentication failed.",
        errorDetail: err,
      });
    }
  }

  override render() {
    if (this.error) {
      return html`
        <div class="box">
          <h3 style="color: var(--yb-color-danger, #ef4444);">Login Failed</h3>
          <p>${this.error}</p>
          <yb-button
            variant="primary"
            @click=${() => {
              window.history.pushState(null, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            Return Home
          </yb-button>
        </div>
      `;
    }

    return html`
      <div class="box">
        <div class="spinner"></div>
        <h3>Signing In...</h3>
        <p>Connecting to Yoto Auth0 identity service.</p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-callback-view": YbCallbackView;
  }
}
