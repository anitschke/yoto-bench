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
    description:
      '<!-- yoto-bench:sync\n{\n  "version": 1,\n  "sourceType": "podcast-rss",\n  "feedUrl": "https://example.com/rss.xml",\n  "filter": {}\n}\n-->',
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

      const settingsBtn = buttons.find((b) =>
        b.textContent?.includes("Sync Settings"),
      );
      expect(settingsBtn, "Sync Settings button should be rendered").to.exist;
    });

    it("opens sync settings dialog with pre-populated values and updates card on save", async () => {
      let savedCard: Card | null = null;
      const origUpdateCard = yotoApi.updateCard;
      yotoApi.updateCard = async (c: Card) => {
        savedCard = c;
      };

      try {
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

        const buttons = Array.from(
          el.shadowRoot?.querySelectorAll("yb-button") || [],
        );
        const settingsBtn = buttons.find((b) =>
          b.textContent?.includes("Sync Settings"),
        );
        expect(settingsBtn).to.exist;
        settingsBtn?.click();
        await el.updateComplete;

        const dialog = el.shadowRoot?.querySelector(
          ".sync-settings-dialog",
        ) as HTMLElement & { open: boolean };
        expect(dialog).to.exist;
        expect(dialog.open).to.be.true;

        const feedInput = el.shadowRoot?.querySelector(
          ".sync-feed-url-input",
        ) as HTMLElement & { value: string };
        expect(feedInput).to.exist;
        expect(feedInput.value).to.equal("https://example.com/rss.xml");

        // Modify feed URL and episode limit
        feedInput.dispatchEvent(
          new CustomEvent("yb-input", {
            detail: { value: "https://newhost.example.com/feed.xml" },
          }),
        );
        const limitInput = el.shadowRoot?.querySelector(
          ".sync-limit-input",
        ) as HTMLElement & { value: number };
        limitInput.dispatchEvent(
          new CustomEvent("yb-input", {
            detail: { value: 25 },
          }),
        );
        await el.updateComplete;

        // Click Save Settings
        const saveBtn = el.shadowRoot?.querySelector(
          ".sync-save-settings-btn",
        ) as HTMLElement;
        expect(saveBtn).to.exist;
        saveBtn.click();
        await el.updateComplete;
        await new Promise((resolve) => setTimeout(resolve, 50));
        await el.updateComplete;

        expect(savedCard, "yotoApi.updateCard should have been called").to.exist;
        const savedMeta = JSON.parse(
          (savedCard as unknown as Card).metadata?.description?.match(
            /<!--\s*yoto-bench:sync\s*\n([\s\S]*?)\n-->/,
          )?.[1] || "{}",
        );
        expect(savedMeta.feedUrl).to.equal(
          "https://newhost.example.com/feed.xml",
        );
        expect(savedMeta.filter?.limit).to.equal(25);
        expect(dialog.open).to.be.false;
      } finally {
        yotoApi.updateCard = origUpdateCard;
      }
    });

    it("renders drop zone for audio ingestion", async () => {
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
  });
});
