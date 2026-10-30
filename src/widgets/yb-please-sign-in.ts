import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { authService } from "../api/auth.js";
import "./yb-button.js";

/**
 * <yb-please-sign-in>
 * Reusable full empty-state prompt displayed across pages when the user is unauthenticated.
 * Provides a standardized message, description, and "Sign In with Yoto" action button.
 */
@customElement("yb-please-sign-in")
export class YbPleaseSignIn extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .container {
      text-align: center;
      padding: 4rem 1.5rem;
      color: var(--yb-color-text-muted, #718096);
      max-width: 480px;
      margin: 0 auto;
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
    }

    h3 {
      font-size: var(--yb-font-size-xl, 1.25rem);
      color: var(--yb-color-text, #1a202c);
      margin: 0 0 0.5rem;
      font-weight: 600;
    }

    p {
      font-size: var(--yb-font-size-sm, 0.875rem);
      color: #4a5568;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }

    .action-container {
      display: flex;
      justify-content: center;
    }
  `;

  @property({ type: String }) heading = "Please Sign In";
  @property({ type: String }) description =
    "Sign in with your Yoto account to access this section.";

  private handleSignIn() {
    authService.login();
  }

  override render() {
    return html`
      <div class="container">
        <h3>${this.heading}</h3>
        <p>${this.description}</p>
        <div class="action-container">
          <yb-button variant="primary" @click=${this.handleSignIn}>
            Sign In with Yoto
          </yb-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-please-sign-in": YbPleaseSignIn;
  }
}
