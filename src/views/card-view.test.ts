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

    it("renders cover artwork section with placeholder when no cover is set", async () => {
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

      const coverSection = el.shadowRoot?.querySelector(".cover-section");
      expect(coverSection, "cover-section should exist").to.exist;
      const placeholder = el.shadowRoot?.querySelector(".cover-placeholder");
      expect(placeholder, "placeholder should exist").to.exist;
      expect(el.shadowRoot?.querySelector(".cover-image")).to.not.exist;
    });

    it("renders cover image when card has cover artwork", async () => {
      yotoApi.getCard = async () =>
        Promise.resolve({
          ...mockCard,
          cover: {
            imageL: "https://example.com/cover.jpg",
          },
        });

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

      const coverImg = el.shadowRoot?.querySelector(
        ".cover-image",
      ) as HTMLImageElement;
      expect(coverImg).to.exist;
      expect(coverImg.src).to.equal("https://example.com/cover.jpg");
    });

    it("updates cover artwork when setting image URL", async () => {
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

      const urlInput = el.shadowRoot?.querySelector(
        ".cover-url-input",
      ) as HTMLElement & { value: string };
      expect(urlInput).to.exist;

      urlInput.dispatchEvent(
        new CustomEvent("yb-input", {
          detail: { value: "https://example.com/new-art.png" },
        }),
      );
      await el.updateComplete;

      const setBtn = el.shadowRoot?.querySelector(
        ".cover-set-url-btn",
      ) as HTMLElement;
      expect(setBtn).to.exist;
      setBtn.click();
      await el.updateComplete;

      const coverImg = el.shadowRoot?.querySelector(
        ".cover-image",
      ) as HTMLImageElement;
      expect(coverImg).to.exist;
      expect(coverImg.src).to.equal("https://example.com/new-art.png");
    });

    it("removes cover artwork when clicking Remove Cover", async () => {
      yotoApi.getCard = async () =>
        Promise.resolve({
          ...mockCard,
          customCoverArt: "https://example.com/cover.jpg",
          cover: {
            imageL: "https://example.com/cover.jpg",
          },
        });

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

      const removeBtn = el.shadowRoot?.querySelector(
        ".cover-remove-btn",
      ) as HTMLElement;
      expect(removeBtn).to.exist;
      removeBtn.click();
      await el.updateComplete;

      expect(el.shadowRoot?.querySelector(".cover-image")).to.not.exist;
      expect(el.shadowRoot?.querySelector(".cover-placeholder")).to.exist;
    });

    it("uploads cover image file and updates card", async () => {
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

      const fileInput = el.shadowRoot?.querySelector(
        "#cover-file-input",
      ) as HTMLInputElement;
      expect(fileInput).to.exist;

      const file = new File(["fake-image"], "cover.png", {
        type: "image/png",
      });
      Object.defineProperty(fileInput, "files", {
        value: [file],
      });

      fileInput.dispatchEvent(new Event("change"));
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const coverImg = el.shadowRoot?.querySelector(
        ".cover-image",
      ) as HTMLImageElement;
      expect(coverImg).to.exist;
      expect(coverImg.src).to.match(/^data:image\/png;base64,/);
    });
  });
});
