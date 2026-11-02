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

    it("applies advanced filter options (keyword filter and max duration) in podcast import modal", async () => {
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

      // Open podcast import dialog
      (el as unknown as { podcastDialogOpen: boolean }).podcastDialogOpen =
        true;
      (el as unknown as { podcastRawXml: string }).podcastRawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Kids Stories</title>
    <item>
      <title>Story 1: The Magic Mountain</title>
      <itunes:duration>300</itunes:duration>
      <enclosure url="https://example.com/1.mp3" type="audio/mpeg"/>
    </item>
    <item>
      <title>Story 2: Bonus Marathon</title>
      <itunes:duration>7200</itunes:duration>
      <enclosure url="https://example.com/2.mp3" type="audio/mpeg"/>
    </item>
    <item>
      <title>Interview with Author</title>
      <itunes:duration>600</itunes:duration>
      <enclosure url="https://example.com/3.mp3" type="audio/mpeg"/>
    </item>
  </channel>
</rss>`;
      await el.updateComplete;

      const includeInput = el.shadowRoot?.querySelector(
        ".podcast-include-keywords-input",
      ) as HTMLElement & { value: string };
      expect(includeInput, "include keywords input should exist").to.exist;
      includeInput.dispatchEvent(
        new CustomEvent("yb-input", { detail: { value: "Story" } }),
      );

      const maxDurationInput = el.shadowRoot?.querySelector(
        ".podcast-max-duration-input",
      ) as HTMLElement & { value: number };
      expect(maxDurationInput, "max duration input should exist").to.exist;
      maxDurationInput.dispatchEvent(
        new CustomEvent("yb-input", { detail: { value: 3600 } }),
      );
      await el.updateComplete;

      // Trigger preview
      const previewBtn = Array.from(
        el.shadowRoot?.querySelectorAll("yb-button") || [],
      ).find((b) => b.textContent?.includes("Fetch & Preview Episodes"));
      previewBtn?.click();

      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const previewRows = el.shadowRoot?.querySelectorAll(".podcast-ep-row");
      expect(
        previewRows?.length,
        "only Story 1 matches Story keyword and max duration <= 3600s",
      ).to.equal(1);
      expect(previewRows?.[0]?.textContent).to.include(
        "Story 1: The Magic Mountain",
      );
    });
  });
});
