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

    it("renders episode ordering selector in podcast import modal and sorts previewed episodes", async () => {
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
<rss version="2.0">
  <channel>
    <title>Storytime</title>
    <item>
      <title>Episode 1 (Oldest)</title>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
      <enclosure url="https://example.com/ep1.mp3" type="audio/mpeg"/>
    </item>
    <item>
      <title>Episode 2 (Newest)</title>
      <pubDate>Tue, 02 Jan 2024 10:00:00 GMT</pubDate>
      <enclosure url="https://example.com/ep2.mp3" type="audio/mpeg"/>
    </item>
  </channel>
</rss>`;
      await el.updateComplete;

      const orderRadios = el.shadowRoot?.querySelectorAll(
        "input[name='podcastOrder']",
      );
      expect(
        orderRadios?.length,
        "ordering radio options should exist",
      ).to.be.greaterThan(0);

      // Select oldest first
      const oldestRadio = el.shadowRoot?.querySelector(
        "input[name='podcastOrder'][value='oldest']",
      ) as HTMLInputElement;
      expect(oldestRadio).to.exist;
      oldestRadio.click();
      await el.updateComplete;

      // Click preview
      const previewBtn = Array.from(
        el.shadowRoot?.querySelectorAll("yb-button") || [],
      ).find((b) => b.textContent?.includes("Fetch & Preview Episodes"));
      expect(previewBtn).to.exist;
      previewBtn?.click();

      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const previewRows = el.shadowRoot?.querySelectorAll(".podcast-ep-row");
      expect(previewRows?.length).to.equal(2);
      expect(previewRows?.[0]?.textContent).to.include("Episode 1 (Oldest)");
      expect(previewRows?.[1]?.textContent).to.include("Episode 2 (Newest)");
    });

    it("displays podcast artwork preview and checkbox when previewing a podcast feed", async () => {
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

      // Open podcast dialog
      (el as unknown as { podcastDialogOpen: boolean }).podcastDialogOpen =
        true;
      (el as unknown as { podcastRawXml: string }).podcastRawXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Bedtime Stories</title>
    <itunes:image href="https://example.com/podcast-art.jpg"/>
    <item>
      <title>Episode 1</title>
      <enclosure url="https://example.com/ep1.mp3" type="audio/mpeg"/>
    </item>
  </channel>
</rss>`;
      await el.updateComplete;

      // Trigger preview
      const previewBtn = Array.from(
        el.shadowRoot?.querySelectorAll("yb-button") || [],
      ).find((b) => b.textContent?.includes("Fetch & Preview Episodes"));
      expect(previewBtn).to.exist;
      previewBtn?.click();

      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const artworkPreview = el.shadowRoot?.querySelector(
        ".podcast-artwork-preview",
      );
      expect(
        artworkPreview,
        "podcast-artwork-preview should be displayed",
      ).to.exist;
      const thumbnail = el.shadowRoot?.querySelector(
        ".podcast-artwork-thumbnail",
      ) as HTMLImageElement;
      expect(thumbnail).to.exist;
      expect(thumbnail.src).to.equal("https://example.com/podcast-art.jpg");

      const checkbox = el.shadowRoot?.querySelector(
        ".podcast-artwork-preview input[type='checkbox']",
      ) as HTMLInputElement;
      expect(checkbox).to.exist;
      expect(checkbox.checked).to.be.true;
    });

    it("applies podcast artwork as card cover when importing episodes", async () => {
      const origFetch = globalThis.fetch;
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url === "https://example.com/podcast-art.jpg") {
          return new Response(new Blob(["art-bytes"], { type: "image/jpeg" }), {
            status: 200,
          });
        }
        if (url === "https://example.com/ep1.mp3") {
          return new Response(new Blob(["audio-bytes"], { type: "audio/mpeg" }), {
            status: 200,
          });
        }
        return new Response("Not found", { status: 404 });
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

        // Set state for import
        const viewAny = el as unknown as {
          podcastFeedImageUrl: string;
          podcastApplyCoverArtwork: boolean;
          podcastPreviewEpisodes: Array<{ title: string; enclosureUrl: string }>;
          importPodcastEpisodes: () => Promise<void>;
          card: Card;
        };
        viewAny.podcastFeedImageUrl = "https://example.com/podcast-art.jpg";
        viewAny.podcastApplyCoverArtwork = true;
        viewAny.podcastPreviewEpisodes = [
          { title: "Episode 1", enclosureUrl: "https://example.com/ep1.mp3" },
        ];

        await viewAny.importPodcastEpisodes();

        expect(viewAny.card.cover).to.exist;
        expect(viewAny.card.cover?.imageL).to.match(/^data:image\/jpeg;base64,/);
        expect(viewAny.card.customCoverArt).to.match(/^data:image\/jpeg;base64,/);
        expect(viewAny.card.metadata?.cover?.imageL).to.match(/^data:image\/jpeg;base64,/);
      } finally {
        globalThis.fetch = origFetch;
      }
    });
    });
  });
});
