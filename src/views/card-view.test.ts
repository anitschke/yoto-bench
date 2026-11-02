import { html, fixture, expect } from "@open-wc/testing";
import "./card-view.js";
import { YbCardView } from "./card-view.js";
import { authService } from "../api/auth.js";
import { yotoApi } from "../api/client.js";
import { Card } from "../models/index.js";

const mockCard: Card = {
  cardId: "card_123",
  title: "My Awesome Adventure",
  metadata: {
    description: "A fun adventure card",
  },
  content: {
    chapters: [
      {
        key: "01",
        title: "Chapter 1",
        duration: 120,
        tracks: [
          {
            key: "01",
            title: "Chapter 1",
            trackUrl: "yoto:#hash1",
            duration: 120,
          },
        ],
        display: {
          icon16x16: "assets/icons/star.png",
        },
      },
      {
        key: "02",
        title: "Chapter 2",
        duration: 180,
        tracks: [
          {
            key: "02",
            title: "Chapter 2",
            trackUrl: "yoto:#hash2",
            duration: 180,
          },
        ],
        display: {
          icon16x16: "assets/icons/moon.png",
        },
      },
    ],
  },
};

const mockSyncedCard: Card = {
  ...mockCard,
  metadata: {
    description:
      '<!-- yoto-bench:sync\n{\n  "version": 1,\n  "sourceType": "podcast-rss",\n  "feedUrl": "https://example.com/rss.xml",\n  "filter": {}\n}\n-->',
  },
};

describe("yb-card-view", () => {
  it("shows please-sign-in prompt when unauthenticated", async () => {
    const el = await fixture<YbCardView>(
      html`<yb-card-view cardId="card_123"></yb-card-view>`,
    );
    expect(el.shadowRoot?.querySelector("yb-please-sign-in")).to.exist;
  });

  describe("when authenticated", () => {
    let origGetCard: typeof yotoApi.getCard;
    let origIsAuth: typeof authService.isAuthenticated;

    beforeEach(() => {
      origGetCard = yotoApi.getCard;
      origIsAuth = authService.isAuthenticated;

      authService.isAuthenticated = () => true;
      yotoApi.getCard = async () => Promise.resolve(mockCard);
    });

    afterEach(() => {
      yotoApi.getCard = origGetCard;
      authService.isAuthenticated = origIsAuth;
    });

    it("renders card title, ID, and chapters", async () => {
      const el = await fixture<YbCardView>(
        html`<yb-card-view cardId="card_123"></yb-card-view>`,
      );
      // provide auth session
      el.authSession = {
        accessToken: "mock",
        refreshToken: "mock",
        expiresAt: Date.now() + 10000,
      };
      await el.updateComplete;
      // Allow async loadCard to finish
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      expect(el.shadowRoot?.querySelector("h2")?.textContent).to.equal(
        "My Awesome Adventure",
      );
      const trackItems = el.shadowRoot?.querySelectorAll(".track-item");
      expect(trackItems?.length).to.equal(2);
    });

    it("renders sync button when podcast sync metadata is present", async () => {
      yotoApi.getCard = async () => Promise.resolve(mockSyncedCard);
      const el = await fixture<YbCardView>(
        html`<yb-card-view cardId="card_123"></yb-card-view>`,
      );
      el.authSession = {
        accessToken: "mock",
        refreshToken: "mock",
        expiresAt: Date.now() + 10000,
      };
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const syncBadge = el.shadowRoot?.querySelector("yb-badge");
      expect(syncBadge).to.exist;
      expect(syncBadge?.textContent).to.include("Podcast Sync Active");

      const buttons = Array.from(
        el.shadowRoot?.querySelectorAll("yb-button") || [],
      );
      const syncBtn = buttons.find((b) =>
        b.textContent?.includes("Sync New Episodes"),
      );
      expect(syncBtn).to.exist;
    });

    it("renders drop zone for audio ingestion on manual card", async () => {
      const el = await fixture<YbCardView>(
        html`<yb-card-view cardId="card_123"></yb-card-view>`,
      );
      el.authSession = {
        accessToken: "mock",
        refreshToken: "mock",
        expiresAt: Date.now() + 10000,
      };
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const dropZone = el.shadowRoot?.querySelector(".drop-zone");
      expect(dropZone).to.exist;
    });

    it("locks structural edits and renders informative banner on synced podcast cards while keeping icons editable", async () => {
      yotoApi.getCard = async () => Promise.resolve(mockSyncedCard);
      const el = await fixture<YbCardView>(
        html`<yb-card-view cardId="card_123"></yb-card-view>`,
      );
      el.authSession = {
        accessToken: "mock",
        refreshToken: "mock",
        expiresAt: Date.now() + 10000,
      };
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      // Banner should be present
      const banner = el.shadowRoot?.querySelector(".synced-card-banner");
      expect(banner, "synced-card-banner should be rendered").to.exist;
      expect(banner?.textContent).to.include(
        "This playlist is automated via podcast sync",
      );

      // Drop zone should be hidden on synced card
      const dropZone = el.shadowRoot?.querySelector(".drop-zone");
      expect(dropZone, "drop zone should be hidden on synced card").to.not.exist;

      // Track actions (reordering, delete) should be hidden
      const trackActions = el.shadowRoot?.querySelectorAll(".track-actions");
      expect(
        trackActions?.length,
        "track structural actions should be hidden",
      ).to.equal(0);

      // Track icon buttons must remain present and interactive
      const iconBtns = el.shadowRoot?.querySelectorAll(".track-icon-btn");
      expect(iconBtns?.length).to.equal(2);
    });

    it("detaches from podcast sync when clicking detach button", async () => {
      let savedCard: Card | null = null;
      yotoApi.getCard = async () => Promise.resolve(mockSyncedCard);
      yotoApi.updateCard = async (c: Card) => {
        savedCard = c;
      };

      const el = await fixture<YbCardView>(
        html`<yb-card-view cardId="card_123"></yb-card-view>`,
      );
      el.authSession = {
        accessToken: "mock",
        refreshToken: "mock",
        expiresAt: Date.now() + 10000,
      };
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const detachBtn = el.shadowRoot?.querySelector(
        ".detach-sync-btn",
      ) as HTMLElement;
      expect(detachBtn, "detach button should exist").to.exist;
      detachBtn.click();

      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      expect(savedCard).to.exist;
      expect(
        (savedCard as unknown as Card).metadata?.description || "",
      ).to.not.include("<!-- yoto-bench:sync");
      expect(el.shadowRoot?.querySelector(".synced-card-banner")).to.not.exist;
      expect(el.shadowRoot?.querySelector(".drop-zone")).to.exist;
    });
  });
});
