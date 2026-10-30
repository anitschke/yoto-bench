import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { WIDGET_DEMOS, WidgetDemoItem } from "./devtools/widget-demos.js";
import "../widgets/yb-button.js";
import "../widgets/yb-badge.js";

interface EventLogEntry {
  id: number;
  timestamp: string;
  name: string;
  detail: string;
}

/**
 * <yb-devtools-view>
 * Hidden developer workbench and component demo sandbox.
 * See: docs/rfcs/022-devtools-and-widget-gallery.md
 */
@customElement("yb-devtools-view")
export class YbDevtoolsView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .devtools-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 1.5rem;
      min-height: calc(100vh - 180px);
    }

    @media (max-width: 768px) {
      .devtools-layout {
        grid-template-columns: 1fr;
      }
    }

    /* Left Sidebar */
    .sidebar {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 10px);
      padding: 1.25rem 1rem;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: fit-content;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--yb-color-border, #e2e8f0);
    }

    .sidebar-header h3 {
      margin: 0;
      font-size: var(--yb-font-size-md, 1rem);
      font-weight: 700;
      color: var(--yb-color-text, #1a202c);
    }

    .nav-group-title {
      font-size: var(--yb-font-size-xs, 0.75rem);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--yb-color-text-muted, #718096);
      margin-bottom: 0.5rem;
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border-radius: var(--yb-radius-sm, 6px);
      color: var(--yb-color-text, #1a202c);
      text-decoration: none;
      font-size: var(--yb-font-size-sm, 0.875rem);
      font-weight: 500;
      cursor: pointer;
      transition: background-color var(--yb-transition-fast, 150ms);
    }

    .nav-link:hover {
      background: var(--yb-color-surface-subtle, #f8f9fa);
    }

    .nav-link.active {
      background: var(--yb-color-primary-light, #fff2ed);
      color: var(--yb-color-primary, #ff5c35);
      font-weight: 600;
    }

    /* Main Content Area */
    .content-area {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .panel-card {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 10px);
      padding: 1.5rem;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
    }

    .component-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 1px solid var(--yb-color-border, #e2e8f0);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .component-header h2 {
      margin: 0;
      font-size: var(--yb-font-size-xl, 1.25rem);
      color: var(--yb-color-text, #1a202c);
    }

    .component-header code {
      font-family: var(--yb-font-family-mono);
      font-size: var(--yb-font-size-sm, 0.875rem);
      background: var(--yb-color-surface-subtle, #f8f9fa);
      padding: 0.2rem 0.4rem;
      border-radius: var(--yb-radius-sm, 6px);
      color: var(--yb-color-primary, #ff5c35);
    }

    .component-desc {
      font-size: var(--yb-font-size-sm, 0.875rem);
      color: var(--yb-color-text-muted, #718096);
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    /* Shared Demo Layouts */
    .demo-section h4 {
      margin: 1.25rem 0 0.5rem 0;
      font-size: var(--yb-font-size-sm, 0.875rem);
      font-weight: 600;
      color: var(--yb-color-text, #1a202c);
    }

    .demo-section h4:first-child {
      margin-top: 0;
    }

    .demo-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    /* Event Inspector */
    .event-inspector {
      background: var(--yb-color-surface-subtle, #f8f9fa);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 10px);
      padding: 1rem;
    }

    .inspector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .inspector-header h4 {
      margin: 0;
      font-size: var(--yb-font-size-sm, 0.875rem);
      color: var(--yb-color-text, #1a202c);
    }

    .event-log-container {
      font-family: var(--yb-font-family-mono);
      font-size: var(--yb-font-size-xs, 0.75rem);
      max-height: 160px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-sm, 6px);
      padding: 0.5rem;
    }

    .event-log-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      background: var(--yb-color-surface-subtle, #f8f9fa);
    }

    .event-time {
      color: var(--yb-color-text-muted, #718096);
    }

    .event-name {
      color: var(--yb-color-primary, #ff5c35);
      font-weight: 600;
    }

    .event-detail {
      color: var(--yb-color-text, #1a202c);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;

  @state() private activeWidgetId = "all";
  @state() private eventLogs: EventLogEntry[] = [];
  private logCounter = 0;

  override connectedCallback() {
    super.connectedCallback();
    this.syncRouteFromUrl();
    window.addEventListener("popstate", this.onPopState);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("popstate", this.onPopState);
  }

  private onPopState = () => {
    this.syncRouteFromUrl();
  };

  private syncRouteFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/^\/devtools\/(widgets\/)?([a-z0-9-]+)?/i);
    if (match && match[2]) {
      this.activeWidgetId = match[2];
    } else {
      this.activeWidgetId = "all";
    }
  }

  private navigateSubpage(widgetId: string, e: Event) {
    e.preventDefault();
    this.activeWidgetId = widgetId;
    const path =
      widgetId === "all"
        ? "/devtools/widgets"
        : `/devtools/widgets/${widgetId}`;
    window.history.pushState(null, "", path);
  }

  public logEvent = (name: string, detail?: unknown) => {
    const entry: EventLogEntry = {
      id: ++this.logCounter,
      timestamp: new Date().toLocaleTimeString(),
      name,
      detail:
        typeof detail === "object"
          ? JSON.stringify(detail)
          : String(detail ?? ""),
    };
    this.eventLogs = [entry, ...this.eventLogs.slice(0, 19)];
  };

  private clearEventLogs() {
    this.eventLogs = [];
  }

  private renderDemoCard(widget: WidgetDemoItem) {
    return html`
      <div class="panel-card" id="widget-${widget.id}">
        <div class="component-header">
          <h2>${widget.title}</h2>
          <code>${widget.tag}</code>
        </div>
        <div class="component-desc">${widget.description}</div>
        <div class="demo-wrapper">
          ${widget.renderDemo({
            logEvent: this.logEvent,
          })}
        </div>
      </div>
    `;
  }

  override render() {
    const activeDemos =
      this.activeWidgetId === "all"
        ? WIDGET_DEMOS
        : WIDGET_DEMOS.filter((w) => w.id === this.activeWidgetId);

    return html`
      <div class="devtools-layout">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <span>🛠︎</span>
            <h3>Devtools</h3>
          </div>

          <div>
            <div class="nav-group-title">Widgets Sandbox</div>
            <ul class="nav-list">
              <li>
                <a
                  class="nav-link ${this.activeWidgetId === "all" ? "active" : ""}"
                  href="/devtools/widgets"
                  @click=${(e: Event) => this.navigateSubpage("all", e)}
                >
                  <span>All Widgets</span>
                  <yb-badge variant="neutral">${WIDGET_DEMOS.length}</yb-badge>
                </a>
              </li>
              ${WIDGET_DEMOS.map(
                (w) => html`
                  <li>
                    <a
                      class="nav-link ${
                        this.activeWidgetId === w.id ? "active" : ""
                      }"
                      href="/devtools/widgets/${w.id}"
                      @click=${(e: Event) => this.navigateSubpage(w.id, e)}
                    >
                      <span>${w.title}</span>
                    </a>
                  </li>
                `,
              )}
            </ul>
          </div>
        </aside>

        <!-- Main Workspace -->
        <main class="content-area">
          <!-- Event Inspector Panel -->
          <div class="event-inspector">
            <div class="inspector-header">
              <h4>Interactive Event Log (Spy)</h4>
              <yb-button
                size="small"
                variant="subtle"
                @click=${this.clearEventLogs}
              >
                Clear Log
              </yb-button>
            </div>
            <div class="event-log-container">
              ${
                this.eventLogs.length === 0
                  ? html`<div
                      style="color: var(--yb-color-text-muted); padding: 0.25rem;"
                    >
                      Interact with buttons, dropdowns, inputs, or toasts below
                      to see dispatched events.
                    </div>`
                  : this.eventLogs.map(
                      (entry) => html`
                        <div class="event-log-item">
                          <span class="event-time">${entry.timestamp}</span>
                          <span class="event-name">${entry.name}</span>
                          <span class="event-detail">${entry.detail}</span>
                        </div>
                      `,
                    )
              }
            </div>
          </div>

          <!-- Component Demos List -->
          ${activeDemos.map((widget) => this.renderDemoCard(widget))}
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-devtools-view": YbDevtoolsView;
  }
}
