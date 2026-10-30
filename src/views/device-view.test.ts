import { fixture, html, expect } from "@open-wc/testing";
import "./device-view.js";
import { YbDeviceView } from "./device-view.js";
import { authService } from "../api/auth.js";
import { yotoMqtt } from "../mqtt/client.js";
import { Device } from "../models/index.js";

import { yotoApi } from "../api/client.js";

describe("<yb-device-view>", () => {
  const originalGetSession = authService.getSession;
  const originalIsAuthenticated = authService.isAuthenticated;
  const originalListDevices = yotoApi.listDevices;
  const originalListCards = yotoApi.listCards;

  beforeEach(() => {
    yotoApi.listDevices = async () => [];
    yotoApi.listCards = async () => [];
  });

  afterEach(() => {
    authService.getSession = originalGetSession;
    authService.isAuthenticated = originalIsAuthenticated;
    yotoApi.listDevices = originalListDevices;
    yotoApi.listCards = originalListCards;
    yotoMqtt.disconnectAll();
    window.history.replaceState(null, "", "/");
  });

  it("renders please-sign-in prompt when unauthenticated", async () => {
    authService.isAuthenticated = () => false;
    authService.getSession = () => null;

    const el = await fixture<YbDeviceView>(
      html`<yb-device-view></yb-device-view>`,
    );

    const signInPrompt = el.shadowRoot?.querySelector("yb-please-sign-in");
    expect(signInPrompt).to.exist;
  });

  it("renders 'No Yoto Players Found' zero state when authenticated with 0 devices", async () => {
    authService.isAuthenticated = () => true;
    authService.getSession = () => ({
      accessToken: "mock-token",
      expiresAt: Date.now() + 60000,
    });
    yotoApi.listDevices = async () => [];

    const el = await fixture<YbDeviceView>(
      html`<yb-device-view></yb-device-view>`,
    );

    const emptyState = el.shadowRoot?.querySelector(".empty-state");
    expect(emptyState).to.exist;
    expect(emptyState?.textContent).to.include("No Yoto Players Found");
  });

  it("renders device grid for multi-device accounts", async () => {
    authService.isAuthenticated = () => true;
    authService.getSession = () => ({
      accessToken: "mock-token",
      expiresAt: Date.now() + 60000,
    });

    const mockDevices: Device[] = [
      {
        deviceId: "dev-1",
        name: "Kids Bedroom Player",
        deviceType: "v3",
        online: true,
        status: {
          batteryLevel: 80,
          charging: true,
          volume: 8,
        },
      },
      {
        deviceId: "dev-2",
        name: "Living Room Mini",
        deviceType: "mini",
        online: false,
        status: {
          batteryLevel: 45,
          charging: false,
          volume: 5,
        },
      },
    ];
    yotoApi.listDevices = async () => mockDevices;

    const el = await fixture<YbDeviceView>(
      html`<yb-device-view></yb-device-view>`,
    );

    const cards = el.shadowRoot?.querySelectorAll(".device-card");
    expect(cards?.length).to.equal(2);
    expect(cards?.[0]?.textContent).to.include("Kids Bedroom Player");
    expect(cards?.[1]?.textContent).to.include("Living Room Mini");
  });

  it("auto-selects single player for single-device accounts per RFC 018", async () => {
    authService.isAuthenticated = () => true;
    authService.getSession = () => ({
      accessToken: "mock-token",
      expiresAt: Date.now() + 60000,
    });

    const singleDevice: Device[] = [
      {
        deviceId: "solo-player",
        name: "Only Player",
        deviceType: "v3",
        online: true,
        status: {
          batteryLevel: 95,
          charging: false,
          volume: 10,
          fwVersion: "v2.18.0",
        },
      },
    ];
    yotoApi.listDevices = async () => singleDevice;

    const el = await fixture<YbDeviceView>(
      html`<yb-device-view></yb-device-view>`,
    );

    // Detailed dashboard should be rendered directly
    const dashboard = el.shadowRoot?.querySelector(".dashboard-layout");
    expect(dashboard).to.exist;
    expect(dashboard?.textContent).to.include("Only Player");
    expect(dashboard?.textContent).to.include("Battery & Power");
  });

  it("renders live hardware telemetry and transport controls in detail view", async () => {
    authService.isAuthenticated = () => true;
    authService.getSession = () => ({
      accessToken: "mock-token",
      expiresAt: Date.now() + 60000,
    });

    const mockDevice: Device = {
      deviceId: "test-dev-123",
      name: "Playroom Yoto",
      deviceType: "v3",
      online: true,
      status: {
        batteryLevel: 72,
        charging: true,
        volume: 7,
        fwVersion: "v2.19.1",
        nightlightMode: "warm_amber",
        activeCard: "card-abc",
        playingStatus: "playing",
      },
    };
    yotoApi.listDevices = async () => [mockDevice];

    const el = await fixture<YbDeviceView>(
      html`<yb-device-view></yb-device-view>`,
    );

    const statNumbers = el.shadowRoot?.querySelectorAll(".stat-number");
    expect(statNumbers?.length).to.be.at.least(2);
    // Battery readout
    expect(statNumbers?.[0]?.textContent).to.equal("72");
    // Volume readout
    expect(statNumbers?.[1]?.textContent).to.equal("7");

    // Charging indicator badge
    const chargingBadge = el.shadowRoot?.querySelector(
      "yb-badge[variant='warning']",
    );
    expect(chargingBadge).to.exist;
    expect(chargingBadge?.textContent).to.include("Charging");

    // Transport buttons
    const buttons = el.shadowRoot?.querySelectorAll("yb-button");
    const buttonTexts = Array.from(buttons || []).map((b) =>
      b.textContent?.trim(),
    );
    expect(buttonTexts.some((t) => t?.includes("Play Card on Device"))).to.be
      .true;
    expect(buttonTexts.some((t) => t?.includes("Pause"))).to.be.true;
    expect(buttonTexts.some((t) => t?.includes("Stop"))).to.be.true;

    // Card Picker Modal
    const dialog = el.shadowRoot?.querySelector("#card-picker-dialog");
    expect(dialog).to.exist;
  });

  it("dispatches volume adjustment when volume steppers are clicked", async () => {
    authService.isAuthenticated = () => true;
    authService.getSession = () => ({
      accessToken: "mock-token",
      expiresAt: Date.now() + 60000,
    });

    let setVolumeCalledWith: { deviceId: string; volume: number } | null = null;
    yotoMqtt.setVolume = (deviceId: string, volume: number) => {
      setVolumeCalledWith = { deviceId, volume };
    };

    const mockDevice: Device = {
      deviceId: "dev-vol-test",
      name: "Volume Player",
      deviceType: "v3",
      online: true,
      status: {
        batteryLevel: 50,
        charging: false,
        volume: 6,
      },
    };
    yotoApi.listDevices = async () => [mockDevice];

    const el = await fixture<YbDeviceView>(
      html`<yb-device-view></yb-device-view>`,
    );

    const plusBtn = el.shadowRoot?.querySelector(
      "yb-button[aria-label='Increase Volume']",
    ) as HTMLElement;
    expect(plusBtn).to.exist;
    plusBtn.click();
    await el.updateComplete;

    expect(setVolumeCalledWith).to.deep.equal({
      deviceId: "dev-vol-test",
      volume: 7,
    });
  });
});
