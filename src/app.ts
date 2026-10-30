import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Router } from "@lit-labs/router";
import { provide } from "@lit/context";
import { authService, AuthStateChangedEvent } from "./api/auth.js";
import { authContext } from "./context/index.js";
import { AuthSession } from "./models/index.js";
import "./widgets/index.js";
import "./views/library-view.js";
import "./views/card-view.js";
import "./views/device-view.js";
import "./views/privacy-view.js";
import "./views/callback-view.js";

/**
 * <yb-app>
 * Root Single-Page Application shell with @lit-labs/router navigation.
 * See: docs/rfcs/003-client-spa-and-routing-strategy.md
 *      docs/rfcs/021-project-rebranding-and-naming-strategy.md
 */
@customElement("yb-app")
export class YbApp extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: var(--yb-color-surface, #ffffff);
      border-bottom: 1px solid var(--yb-color-border, #e2e8f0);
      padding: 0.75rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--yb-color-primary, #ff5c35);
      cursor: pointer;
      text-decoration: none;
    }

    nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    nav a {
      color: var(--yb-color-text, #1a202c);
      text-decoration: none;
      font-weight: 500;
      font-size: var(--yb-font-size-sm, 0.875rem);
      padding: 0.4rem 0.6rem;
      border-radius: var(--yb-radius-sm, 6px);
      transition: background-color var(--yb-transition-fast, 150ms);
    }

    nav a:hover {
      background-color: var(--yb-color-surface-subtle, #f8f9fa);
    }

    .auth-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }

    footer {
      background: var(--yb-color-surface, #ffffff);
      border-top: 1px solid var(--yb-color-border, #e2e8f0);
      padding: 1.5rem 2rem;
      text-align: center;
      font-size: var(--yb-font-size-xs, 0.75rem);
      color: var(--yb-color-text-muted, #718096);
    }

    footer a {
      color: var(--yb-color-primary, #ff5c35);
      text-decoration: none;
    }
  `;

  @provide({ context: authContext })
  @state()
  authSession: AuthSession | null = null;

  @state() private isAuthenticated = false;

  private onAuthChanged = () => {
    const session = authService.getSession();
    this.authSession = session ? { ...session } : null;
    this.isAuthenticated = authService.isAuthenticated();
  };

  private router = new Router(this, [
    {
      path: "/",
      render: () => html`<yb-library-view></yb-library-view>`,
    },
    {
      path: "/cards/:id",
      render: ({ id }) =>
        html`<yb-card-view .cardId=${id || ""}></yb-card-view>`,
    },
    {
      path: "/device",
      render: () => html`<yb-device-view></yb-device-view>`,
    },
    {
      path: "/privacy",
      render: () => html`<yb-privacy-view></yb-privacy-view>`,
    },
    {
      path: "/callback",
      render: () => html`<yb-callback-view></yb-callback-view>`,
    },
  ]);

  override connectedCallback() {
    super.connectedCallback();
    this.authSession = authService.getSession();
    this.isAuthenticated = authService.isAuthenticated();
    window.addEventListener(
      AuthStateChangedEvent.EVENT_NAME,
      this.onAuthChanged,
    );
    window.addEventListener("popstate", this.onAuthChanged);

    // If access token is expired on startup but refresh token is present, renew silently
    if (
      this.authSession &&
      this.authSession.refreshToken &&
      Date.now() >= this.authSession.expiresAt - 60000
    ) {
      void authService.refreshToken();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      AuthStateChangedEvent.EVENT_NAME,
      this.onAuthChanged,
    );
    window.removeEventListener("popstate", this.onAuthChanged);
  }

  private navigate(path: string, e?: Event) {
    if (e instanceof MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
    }
    if (e) e.preventDefault();
    window.history.pushState(null, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  private handleLoginLogout() {
    if (this.isAuthenticated) {
      authService.logout();
      this.authSession = null;
      this.isAuthenticated = false;
    } else {
      authService.login();
    }
  }

  override render() {
    return html`
      <header>
        <a class="brand" href="/" @click=${(e: Event) => this.navigate("/", e)}>
          <span>🎵 YotoBench</span>
        </a>
        <nav>
          <a href="/" @click=${(e: Event) => this.navigate("/", e)}>Cards</a>
          <a href="/device" @click=${(e: Event) => this.navigate("/device", e)}
            >Players</a
          >
          <a
            href="/privacy"
            @click=${(e: Event) => this.navigate("/privacy", e)}
            >Privacy</a
          >
        </nav>
        <div class="auth-section">
          <yb-button
            variant=${this.isAuthenticated ? "secondary" : "primary"}
            size="small"
            @click=${this.handleLoginLogout}
          >
            ${this.isAuthenticated ? "Sign Out" : "Sign In"}
          </yb-button>
        </div>
      </header>

      <main>${this.router.outlet()}</main>

      <footer>
        <p>
          YotoBench — A modern web client for Yoto Players.
          <a
            href="/privacy"
            @click=${(e: Event) => this.navigate("/privacy", e)}
            >Privacy & Transparency</a
          >
        </p>
      </footer>

      <!-- Global Toast Queue Manager per RFC 006 -->
      <yb-toast-manager></yb-toast-manager>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-app": YbApp;
  }
}
