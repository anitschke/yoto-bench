import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { consume } from "@lit/context";
import { authService } from "../api/auth.js";
import { yotoApi } from "../api/client.js";
import { yotoMqtt } from "../mqtt/client.js";
import { authContext, devicesContext } from "../context/index.js";
import { AuthSession, Card, Device, DeviceStatus } from "../models/index.js";
import { dispatchToast } from "../widgets/events.js";
import { YbDialog } from "../widgets/yb-dialog.js";
import "../widgets/yb-button.js";
import "../widgets/yb-badge.js";
import "../widgets/yb-dialog.js";
import "../widgets/yb-progress-bar.js";
import "../widgets/yb-pixel-icon.js";
import "../widgets/yb-text-input.js";
import "../widgets/yb-please-sign-in.js";

/**
 * <yb-device-view>
 * Device management, live hardware status monitoring, and card playback remote control.
 * See: docs/rfcs/018-device-management-and-remote-control.md
 */
@customElement("yb-device-view")
export class YbDeviceView extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    h2 {
      margin: 0;
      font-size: var(--yb-font-size-2xl, 1.5rem);
      color: var(--yb-color-text, #1a202c);
    }

    .device-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .device-card {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      padding: 1.5rem;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      display: flex;
      flex-direction: column;
      gap: 1rem;
      cursor: pointer;
      transition:
        box-shadow var(--yb-transition-fast, 150ms),
        transform var(--yb-transition-fast, 150ms);
    }

    .device-card:hover {
      box-shadow: var(--yb-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      transform: translateY(-2px);
    }

    .device-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .device-name {
      font-size: var(--yb-font-size-lg, 1.125rem);
      font-weight: 600;
      margin: 0;
      color: var(--yb-color-text, #1a202c);
    }

    .meta-row {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: var(--yb-font-size-sm, 0.875rem);
      color: var(--yb-color-text-muted, #718096);
    }

    .quick-battery {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: var(--yb-font-size-sm, 0.875rem);
    }

    /* Detail View Styling */
    .dashboard-layout {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .panel {
      background: var(--yb-color-surface, #ffffff);
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-lg, 16px);
      padding: 1.5rem;
      box-shadow: var(--yb-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .panel-title {
      font-size: var(--yb-font-size-base, 1rem);
      font-weight: 600;
      margin: 0;
      color: var(--yb-color-text, #1a202c);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-readout {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: var(--yb-color-text, #1a202c);
      line-height: 1;
    }

    .stat-unit {
      font-size: var(--yb-font-size-sm, 0.875rem);
      color: var(--yb-color-text-muted, #718096);
    }

    .transport-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .volume-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .volume-stepper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .metadata-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .metadata-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--yb-font-size-sm, 0.875rem);
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--yb-color-border-subtle, #edf2f7);
    }

    .metadata-label {
      color: var(--yb-color-text-muted, #718096);
    }

    .metadata-val {
      font-weight: 500;
      color: var(--yb-color-text, #1a202c);
    }

    /* Card Picker Modal Inside Styling */
    .card-picker-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 60vh;
    }

    .card-picker-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      overflow-y: auto;
      max-height: 400px;
      padding-right: 0.25rem;
    }

    .card-picker-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--yb-color-border, #e2e8f0);
      border-radius: var(--yb-radius-md, 10px);
      background: var(--yb-color-surface-subtle, #f8f9fa);
      transition: background-color var(--yb-transition-fast, 150ms);
    }

    .card-picker-item:hover {
      background: var(--yb-color-surface, #ffffff);
    }

    .card-picker-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .card-picker-title {
      font-weight: 600;
      font-size: var(--yb-font-size-sm, 0.875rem);
      color: var(--yb-color-text, #1a202c);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-picker-tracks {
      font-size: var(--yb-font-size-xs, 0.75rem);
      color: var(--yb-color-text-muted, #718096);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--yb-color-text-muted, #718096);
    }
  `;

  @consume({ context: authContext, subscribe: true })
  @state()
  authSession: AuthSession | null = null;

  @consume({ context: devicesContext, subscribe: true })
  @state()
  devices: Device[] = [];

  @state() private selectedDeviceId: string | null = null;
  @state() private deviceStatus: DeviceStatus | null = null;
  @state() private cards: Card[] = [];
  @state() private cardSearchQuery = "";
  @state() private loading = true;
  @state() private liveDeviceOnline = false;

  @query("#card-picker-dialog") private cardPickerDialog?: YbDialog;

  private isFetching = false;
  private mqttUnsubStatus: (() => void) | null = null;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.authSession && authService.isAuthenticated()) {
      this.authSession = authService.getSession();
    }
    window.addEventListener("popstate", this.handlePopState);

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      this.selectedDeviceId = id;
    }

    if (authService.isAuthenticated()) {
      void this.loadData();
    } else {
      this.loading = false;
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("popstate", this.handlePopState);
    this.teardownMqtt();
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has("authSession")) {
      if (this.authSession && authService.isAuthenticated()) {
        void this.loadData();
      } else {
        this.devices = [];
        this.cards = [];
        this.selectedDeviceId = null;
        this.deviceStatus = null;
        this.loading = false;
        this.teardownMqtt();
      }
    }

    if (changedProperties.has("devices")) {
      this.checkAutoRedirect();
      if (this.selectedDeviceId) {
        const found = this.devices.find(
          (d) => d.deviceId === this.selectedDeviceId,
        );
        if (found?.status && !this.deviceStatus) {
          this.deviceStatus = found.status;
        }
      }
    }

    if (changedProperties.has("selectedDeviceId")) {
      if (this.selectedDeviceId) {
        const found = this.devices.find(
          (d) => d.deviceId === this.selectedDeviceId,
        );
        if (found?.status) {
          this.deviceStatus = found.status;
        }
        this.setupMqtt(this.selectedDeviceId);
      } else {
        this.teardownMqtt();
        this.deviceStatus = null;
      }
    }
  }

  private handlePopState = () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id !== this.selectedDeviceId) {
      this.selectedDeviceId = id;
    }
  };

  /**
   * Automatic Device Selection Heuristic per RFC 018:
   * Single-Device Accounts: If the authenticated user has exactly one Yoto player,
   * automatically redirect to /device?id=<deviceId>.
   */
  private checkAutoRedirect() {
    if (
      !this.selectedDeviceId &&
      this.devices.length === 1 &&
      this.devices[0]
    ) {
      const singleId = this.devices[0].deviceId;
      this.selectDevice(singleId, true);
    }
  }

  private selectDevice(deviceId: string, replace = false) {
    this.selectedDeviceId = deviceId;
    const newUrl = `/device?id=${encodeURIComponent(deviceId)}`;
    if (replace) {
      window.history.replaceState(null, "", newUrl);
    } else {
      window.history.pushState(null, "", newUrl);
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  private deselectDevice() {
    this.selectedDeviceId = null;
    window.history.pushState(null, "", "/device");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  private async loadData() {
    if (this.isFetching) return;
    this.isFetching = true;
    this.loading = true;
    try {
      if (authService.isAuthenticated()) {
        const [devices, cards] = await Promise.all([
          yotoApi.listDevices(),
          yotoApi.listCards().catch(() => []),
        ]);
        this.devices = devices;
        this.cards = cards;
        this.checkAutoRedirect();
      }
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to load player devices.",
        errorDetail: err,
      });
    } finally {
      this.loading = false;
      this.isFetching = false;
    }
  }

  private setupMqtt(deviceId: string) {
    this.teardownMqtt();

    const session = authService.getSession();
    if (!session || !session.accessToken) return;

    this.liveDeviceOnline = false;

    yotoMqtt.connect(deviceId, session.accessToken);

    this.mqttUnsubStatus = yotoMqtt.onStatus(deviceId, (status) => {
      this.liveDeviceOnline = true;
      this.deviceStatus = { ...status };
      const d = this.devices.find((dev) => dev.deviceId === deviceId);
      if (d) {
        d.online = true;
        d.status = { ...status };
      }
    });
  }

  private teardownMqtt() {
    if (this.mqttUnsubStatus) {
      this.mqttUnsubStatus();
      this.mqttUnsubStatus = null;
    }
    this.liveDeviceOnline = false;
  }

  private handlePlayCard(card: Card) {
    if (!this.selectedDeviceId) return;
    try {
      yotoMqtt.playCard(this.selectedDeviceId, card.cardId);
      dispatchToast(this, {
        type: "success",
        message: `Playing "${card.title}" on player`,
      });
      this.cardPickerDialog?.close();
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to play card on device.",
        errorDetail: err,
      });
    }
  }

  private handlePlayOrResume() {
    if (!this.selectedDeviceId) return;
    if (this.deviceStatus?.activeCard) {
      yotoMqtt.playCard(this.selectedDeviceId, this.deviceStatus.activeCard);
      dispatchToast(this, {
        type: "info",
        message: "Resuming playback",
      });
    } else {
      this.cardPickerDialog?.showModal();
    }
  }

  private handlePause() {
    if (!this.selectedDeviceId) return;
    try {
      yotoMqtt.pausePlayer(this.selectedDeviceId);
      dispatchToast(this, {
        type: "info",
        message: "Playback paused",
      });
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to pause playback.",
        errorDetail: err,
      });
    }
  }

  private handleStop() {
    if (!this.selectedDeviceId) return;
    try {
      yotoMqtt.stopPlayer(this.selectedDeviceId);
      dispatchToast(this, {
        type: "info",
        message: "Playback stopped",
      });
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to stop playback.",
        errorDetail: err,
      });
    }
  }

  private handleAdjustVolume(delta: number) {
    if (!this.selectedDeviceId) return;
    const current = this.deviceStatus?.volume ?? 8;
    const max = current > 16 ? 100 : 16;
    const next = Math.max(0, Math.min(max, current + delta));
    try {
      yotoMqtt.setVolume(this.selectedDeviceId, next);
      if (this.deviceStatus) {
        this.deviceStatus = { ...this.deviceStatus, volume: next };
      }
      dispatchToast(this, {
        type: "info",
        message: `Volume set to ${next}`,
      });
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to set volume.",
        errorDetail: err,
      });
    }
  }

  private async handleRefreshStatus() {
    if (!this.selectedDeviceId) return;
    try {
      if (authService.isAuthenticated()) {
        const devices = await yotoApi.listDevices();
        this.devices = devices;
      }
      yotoMqtt.requestStatus(this.selectedDeviceId);
      dispatchToast(this, {
        type: "info",
        message: "Requested status update from player",
      });
    } catch (err) {
      dispatchToast(this, {
        type: "error",
        message: "Failed to request status.",
        errorDetail: err,
      });
    }
  }

  private isDeviceOnline(device: Device): boolean {
    if (this.selectedDeviceId === device.deviceId && this.liveDeviceOnline) {
      return true;
    }

    const raw = device.online as unknown;
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "string") {
      const lower = raw.toLowerCase();
      return lower === "true" || lower === "1";
    }
    if (typeof raw === "number") return raw !== 0;
    return false;
  }

  private getActiveCardTitle(): string {
    if (!this.deviceStatus?.activeCard) {
      return "No card active";
    }
    const found = this.cards.find(
      (c) => c.cardId === this.deviceStatus?.activeCard,
    );
    if (found) {
      return found.title;
    }
    return this.deviceStatus.activeCard;
  }

  private formatProductType(productType?: string, deviceType?: string): string {
    const raw = (productType || deviceType || "").toLowerCase();
    if (raw.includes("v3")) return "Yoto Player (Gen 3)";
    if (raw.includes("v2")) return "Yoto Player (Gen 2)";
    if (raw.includes("v1")) return "Yoto Player (Gen 1)";
    if (raw.includes("mini")) return "Yoto Mini";
    return deviceType || productType || "Yoto Player";
  }

  private formatBytes(bytes?: number): string {
    if (!bytes || bytes <= 0) return "Unknown";
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) {
      return `${Math.round(mb)} MB`;
    }
    return `${(mb / 1024).toFixed(1)} GB`;
  }

  private renderPlaybackBadge() {
    const status = (this.deviceStatus?.playingStatus || "idle").toLowerCase();
    if (status === "playing") {
      return html`<yb-badge variant="success">Playing</yb-badge>`;
    }
    if (status === "paused") {
      return html`<yb-badge variant="warning">Paused</yb-badge>`;
    }
    return html`<yb-badge variant="neutral">Idle</yb-badge>`;
  }

  private renderGrid() {
    return html`
      <div>
        <div class="header-bar">
          <h2>Players & Devices (${this.devices.length})</h2>
        </div>

        ${
          this.devices.length === 0
            ? html`
                <div class="empty-state">
                  <p><strong>No Yoto Players Found</strong></p>
                  <p>
                    Make sure your player is linked to your Yoto family account
                    in the Yoto mobile app.
                  </p>
                </div>
              `
            : html`
                <div class="device-grid">
                  ${this.devices.map((device) => {
                    const battery = device.status?.batteryLevel;
                    return html`
                      <div
                        class="device-card"
                        @click=${() => this.selectDevice(device.deviceId)}
                      >
                        <div class="device-top">
                          <h3 class="device-name">
                            ${device.name || "Yoto Player"}
                          </h3>
                          <yb-badge
                            variant=${
                              this.isDeviceOnline(device)
                                ? "success"
                                : "neutral"
                            }
                          >
                            ${
                              this.isDeviceOnline(device) ? "Online" : "Offline"
                            }
                          </yb-badge>
                        </div>
                        <div class="meta-row">
                          <span>
                            <strong>Model:</strong>
                            ${this.formatProductType(
                              device.status?.productType,
                              device.deviceType,
                            )}
                          </span>
                          <span><strong>ID:</strong> ${device.deviceId}</span>
                        </div>
                        ${
                          battery !== undefined
                            ? html`
                                <div class="quick-battery">
                                  <span>🔋 ${battery}%</span>
                                  ${
                                    device.status?.charging
                                      ? html`<yb-badge variant="warning"
                                          >⚡ Charging</yb-badge
                                        >`
                                      : ""
                                  }
                                </div>
                              `
                            : ""
                        }
                        <yb-button
                          variant="secondary"
                          size="small"
                          @click=${(e: Event) => {
                            e.stopPropagation();
                            this.selectDevice(device.deviceId);
                          }}
                        >
                          Manage Player
                        </yb-button>
                      </div>
                    `;
                  })}
                </div>
              `
        }
      </div>
    `;
  }

  private renderDetail(device: Device) {
    const isOnline = this.isDeviceOnline(device);
    const batteryLevel =
      this.deviceStatus?.batteryLevel ?? device.status?.batteryLevel ?? 0;
    const isCharging =
      this.deviceStatus?.charging ?? device.status?.charging ?? false;
    const volume = this.deviceStatus?.volume ?? device.status?.volume ?? 8;
    const activeCardTitle = this.getActiveCardTitle();

    const filteredCards = this.cards.filter((c) =>
      (c.title || "").toLowerCase().includes(this.cardSearchQuery),
    );

    return html`
      <div class="dashboard-layout">
        <!-- Breadcrumb / Header Bar -->
        <div class="header-bar">
          <div class="header-left">
            <yb-button
              variant="subtle"
              size="small"
              @click=${this.deselectDevice}
            >
              ← All Players
            </yb-button>
            <h2>${device.name || "Yoto Player"}</h2>
            <yb-badge variant=${isOnline ? "success" : "neutral"}>
              ${isOnline ? "Online" : "Offline"}
            </yb-badge>
          </div>
          <div>
            <yb-button
              variant="subtle"
              size="small"
              @click=${this.handleRefreshStatus}
            >
              🔄 Refresh Status
            </yb-button>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- Battery & Power Panel -->
          <div class="panel">
            <div class="panel-title">
              <span>Battery & Power</span>
              ${
                isCharging
                  ? html`<yb-badge variant="warning">⚡ Charging</yb-badge>`
                  : html`<yb-badge variant="neutral">Battery</yb-badge>`
              }
            </div>
            <div class="stat-readout">
              <span class="stat-number">${batteryLevel}</span>
              <span class="stat-unit">%</span>
            </div>
            <yb-progress-bar
              .value=${batteryLevel}
              accessibleLabel="Battery percentage: ${batteryLevel}%"
            ></yb-progress-bar>
          </div>

          <!-- Volume Control Panel -->
          <div class="panel">
            <div class="panel-title">
              <span>Volume</span>
            </div>
            <div class="stat-readout">
              <span class="stat-number">${volume}</span>
              <span class="stat-unit">/ 16</span>
            </div>
            <div class="volume-controls">
              <div class="volume-stepper">
                <yb-button
                  variant="subtle"
                  size="small"
                  ?disabled=${!isOnline}
                  @click=${() => this.handleAdjustVolume(-1)}
                  aria-label="Decrease Volume"
                >
                  −
                </yb-button>
                <yb-button
                  variant="subtle"
                  size="small"
                  ?disabled=${!isOnline}
                  @click=${() => this.handleAdjustVolume(1)}
                  aria-label="Increase Volume"
                >
                  +
                </yb-button>
              </div>
            </div>
          </div>

          <!-- Currently Playing & Playback Controls Panel -->
          <div class="panel" style="grid-column: 1 / -1;">
            <div class="panel-title">
              <span>Active Playback</span>
              ${this.renderPlaybackBadge()}
            </div>

            <div class="meta-row">
              <span
                ><strong>Currently Playing:</strong> ${activeCardTitle}</span
              >
              ${
                this.deviceStatus?.activeCard
                  ? html`<span
                      ><strong>Card ID:</strong>
                      ${this.deviceStatus.activeCard}</span
                    >`
                  : ""
              }
            </div>

            <div class="transport-controls">
              <yb-button
                variant="primary"
                ?disabled=${!isOnline}
                @click=${() => this.cardPickerDialog?.showModal()}
              >
                🎵 Play Card on Device
              </yb-button>
              <yb-button
                variant="secondary"
                ?disabled=${!isOnline}
                @click=${this.handlePlayOrResume}
              >
                ▶ Play / Resume
              </yb-button>
              <yb-button
                variant="subtle"
                ?disabled=${!isOnline}
                @click=${this.handlePause}
              >
                ⏸ Pause
              </yb-button>
              <yb-button
                variant="danger"
                ?disabled=${!isOnline}
                @click=${this.handleStop}
              >
                ⏹ Stop
              </yb-button>
            </div>
            ${
              !isOnline
                ? html`<p
                    style="margin: 0; font-size: var(--yb-font-size-xs, 0.75rem); color: var(--yb-color-text-muted, #718096);"
                  >
                    Player is currently offline. Turn on your Yoto player to
                    control playback and view live telemetry.
                  </p>`
                : ""
            }
          </div>

          <!-- Hardware & Metadata Panel -->
          <div class="panel" style="grid-column: 1 / -1;">
            <div class="panel-title">
              <span>Hardware & Firmware Details</span>
            </div>
            <div class="metadata-list">
              <div class="metadata-item">
                <span class="metadata-label">Device Name</span>
                <span class="metadata-val"
                  >${device.name || "Yoto Player"}</span
                >
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Product Model</span>
                <span class="metadata-val">
                  ${this.formatProductType(
                    this.deviceStatus?.productType,
                    device.deviceType,
                  )}
                </span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Device ID</span>
                <span class="metadata-val">${device.deviceId}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Firmware Version</span>
                <span class="metadata-val"
                  >${this.deviceStatus?.fwVersion || "Unknown"}</span
                >
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Nightlight Mode</span>
                <span class="metadata-val"
                  >${this.deviceStatus?.nightlightMode || "Off"}</span
                >
              </div>
              ${
                this.deviceStatus?.freeDisk !== undefined
                  ? html`
                      <div class="metadata-item">
                        <span class="metadata-label">Free Storage</span>
                        <span class="metadata-val"
                          >${this.formatBytes(this.deviceStatus.freeDisk)}</span
                        >
                      </div>
                    `
                  : ""
              }
            </div>
          </div>
        </div>

        <!-- Card Picker Modal Dialog -->
        <yb-dialog id="card-picker-dialog" heading="Play Card on Device">
          <div class="card-picker-body">
            <yb-text-input
              placeholder="Search cards..."
              clearable
              .value=${this.cardSearchQuery}
              @input=${(e: CustomEvent<{ value: string }>) => {
                this.cardSearchQuery = (e.detail?.value || "").toLowerCase();
              }}
            ></yb-text-input>

            <div class="card-picker-list">
              ${
                filteredCards.length === 0
                  ? html`<p
                      style="text-align: center; color: var(--yb-color-text-muted); padding: 1.5rem;"
                    >
                      No cards found matching your query.
                    </p>`
                  : filteredCards.map((card) => {
                      const firstChapter = card.content?.chapters?.[0];
                      const iconUrl = firstChapter?.display?.icon16x16 || "";
                      const trackCount = card.content?.chapters?.length || 0;

                      return html`
                        <div class="card-picker-item">
                          <yb-pixel-icon
                            src=${iconUrl}
                            alt=${card.title}
                            size="sm"
                          ></yb-pixel-icon>
                          <div class="card-picker-info">
                            <span class="card-picker-title">${card.title}</span>
                            <span class="card-picker-tracks"
                              >${trackCount}
                              ${trackCount === 1 ? "track" : "tracks"}</span
                            >
                          </div>
                          <yb-button
                            variant="primary"
                            size="small"
                            @click=${() => this.handlePlayCard(card)}
                          >
                            Play Now
                          </yb-button>
                        </div>
                      `;
                    })
              }
            </div>
          </div>
          <div slot="footer">
            <yb-button
              variant="subtle"
              @click=${() => this.cardPickerDialog?.close()}
            >
              Cancel
            </yb-button>
          </div>
        </yb-dialog>
      </div>
    `;
  }

  override render() {
    const isAuthed =
      (!!this.authSession || authService.isAuthenticated()) &&
      authService.isAuthenticated();
    if (!isAuthed) {
      return html`
        <yb-please-sign-in
          heading="Please Sign In"
          description="Sign in with your Yoto account to monitor and control your Yoto players."
        ></yb-please-sign-in>
      `;
    }

    if (this.loading) {
      return html`<div class="empty-state"><p>Loading devices...</p></div>`;
    }

    if (this.selectedDeviceId) {
      const activeDevice = this.devices.find(
        (d) => d.deviceId === this.selectedDeviceId,
      );
      if (activeDevice) {
        return this.renderDetail(activeDevice);
      }
      // If direct bookmark or id not in current list
      return html`
        <div class="empty-state">
          <p><strong>Device Not Found</strong></p>
          <p>The requested player was not found in your account.</p>
          <yb-button
            variant="secondary"
            size="small"
            @click=${this.deselectDevice}
          >
            ← View All Players
          </yb-button>
        </div>
      `;
    }

    return this.renderGrid();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-device-view": YbDeviceView;
  }
}
