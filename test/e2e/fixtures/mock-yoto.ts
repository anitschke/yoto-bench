import { test as base, expect, Page } from "@playwright/test";
import { Card, Device } from "../../../src/models/index.js";

// ==============================================================================
// Reusable Mock Yoto Client & Network Harness for Playwright E2E Tests
// Intercepts Yoto REST APIs, S3 direct uploads, and RSS CORS proxies.
// ==============================================================================

export interface MockPodcastFeedOptions {
  title?: string;
  description?: string;
  episodes: Array<{
    title: string;
    duration?: number;
    enclosureUrl?: string;
    pubDate?: string;
    audioData?: string | Buffer;
  }>;
}

export class MockYotoHarness {
  private cards: Map<string, Card> = new Map();
  private devices: Device[] = [];
  private authSession = {
    accessToken: "mock_jwt_token_12345",
    refreshToken: "mock_refresh_token_67890",
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    user: {
      email: "test-user@yotobench.internal",
      name: "Test Yoto User",
    },
  };

  constructor(public page: Page) {}

  /**
   * Initializes the browser environment:
   * 1. Injects localStorage authentication session before page scripts run
   * 2. Sets up route interceptors for Yoto REST API, AWS S3, and CORS Proxy
   */
  async setupDefaults(): Promise<void> {
    // Inject auth session into localStorage
    await this.page.addInitScript((session) => {
      localStorage.setItem("yoto_auth_session", JSON.stringify(session));
    }, this.authSession);

    // Intercept Library GET: /card/family/library
    await this.page.route(
      "https://api.yotoplay.com/card/family/library",
      async (route) => {
        const cardList = Array.from(this.cards.values()).map((card) => ({
          cardId: card.cardId,
          card,
        }));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ cards: cardList }),
        });
      },
    );

    // Intercept Single Card GET: https://api.yotoplay.com/card/*
    await this.page.route(
      /https:\/\/api\.yotoplay\.com\/card\/([a-zA-Z0-9_-]+)$/,
      async (route) => {
        const url = route.request().url();
        const cardId = url.split("/").pop();
        if (cardId && this.cards.has(cardId)) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ card: this.cards.get(cardId) }),
          });
        } else {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ error: "Card not found" }),
          });
        }
      },
    );

    // Intercept Card Create/Update POST: https://api.yotoplay.com/content
    await this.page.route(
      /https:\/\/api\.yotoplay\.com\/content(\/.*)?$/,
      async (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postDataJSON() as Card | null;
          if (postData && postData.cardId) {
            this.cards.set(postData.cardId, postData);
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true }),
          });
        } else if (route.request().method() === "DELETE") {
          const url = route.request().url();
          const cardId = url.split("/").pop();
          if (cardId) this.cards.delete(cardId);
          await route.fulfill({ status: 204 });
        } else {
          await route.continue();
        }
      },
    );

    // Intercept Devices GET: https://api.yotoplay.com/device-v2/devices/mine
    await this.page.route(
      "https://api.yotoplay.com/device-v2/devices/mine",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ devices: this.devices }),
        });
      },
    );

    // Intercept S3 Upload URL Request: https://api.yotoplay.com/media/transcode/audio/uploadUrl*
    await this.page.route(
      /https:\/\/api\.yotoplay\.com\/media\/transcode\/audio\/uploadUrl.*/,
      async (route) => {
        const url = new URL(route.request().url());
        const sha256 = url.searchParams.get("sha256") || "mock_hash";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            upload: {
              uploadId: `up_${sha256.slice(0, 8)}`,
              uploadUrl: `https://mock-s3.yotoplay.com/audio/${sha256}`,
            },
          }),
        });
      },
    );

    // Intercept Mock S3 Direct PUT
    await this.page.route("https://mock-s3.yotoplay.com/**", async (route) => {
      await route.fulfill({ status: 200 });
    });

    // Intercept Transcode Polling: https://api.yotoplay.com/media/upload/*/transcoded
    await this.page.route(
      /https:\/\/api\.yotoplay\.com\/media\/upload\/([^/]+)\/transcoded/,
      async (route) => {
        const url = route.request().url();
        const match = url.match(/\/media\/upload\/([^/]+)\/transcoded/);
        const uploadId = match ? match[1] : "up_default";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            transcodedSha256: `trans_${uploadId}`,
            transcodedInfo: {
              duration: 240,
              fileSize: 1024 * 50,
            },
          }),
        });
      },
    );
  }

  /**
   * Registers a mock card into the stateful collection.
   */
  setCard(card: Card): void {
    this.cards.set(card.cardId, card);
  }

  getCard(cardId: string): Card | undefined {
    return this.cards.get(cardId);
  }

  setDevices(devices: Device[]): void {
    this.devices = devices;
  }

  /**
   * Mocks a podcast RSS XML feed and its audio enclosures.
   * Intercepts both direct requests and requests routed via corsproxy.io.
   */
  async mockPodcastFeed(
    feedUrl: string,
    options: MockPodcastFeedOptions,
  ): Promise<void> {
    const title = options.title || "Bedtime Stories Podcast";
    const description = options.description || "Soothing stories for kids";

    const itemsXml = options.episodes
      .map((ep, idx) => {
        const epUrl =
          ep.enclosureUrl || `https://example.com/audio/ep_${idx + 1}.mp3`;
        return `
      <item>
        <title>${ep.title}</title>
        <description>Episode description for ${ep.title}</description>
        <pubDate>${ep.pubDate || new Date().toUTCString()}</pubDate>
        <itunes:duration>${ep.duration || 300}</itunes:duration>
        <enclosure url="${epUrl}" length="10240" type="audio/mpeg"/>
      </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${title}</title>
    <description>${description}</description>
    ${itemsXml}
  </channel>
</rss>`;

    // Route direct feed URL
    await this.page.route(feedUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/xml",
        body: xml,
      });
    });

    // Route CORS Proxy URL (corsproxy.io)
    await this.page.route(/.*corsproxy\.io.*url=.*/, async (route) => {
      const requestUrl = route.request().url();
      if (
        requestUrl.includes(encodeURIComponent(feedUrl)) ||
        requestUrl.includes(feedUrl)
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/xml",
          body: xml,
        });
      } else {
        await route.continue();
      }
    });

    // Route each episode enclosure audio binary
    for (let idx = 0; idx < options.episodes.length; idx++) {
      const ep = options.episodes[idx]!;
      const epUrl =
        ep.enclosureUrl || `https://example.com/audio/ep_${idx + 1}.mp3`;
      const audioData =
        ep.audioData || Buffer.from("mock-audio-content-id3-mp3");

      await this.page.route(epUrl, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "audio/mpeg",
          body: audioData,
        });
      });
    }
  }
}

export const test = base.extend<{ yoto: MockYotoHarness }>({
  yoto: async ({ page }, use) => {
    const harness = new MockYotoHarness(page);
    await harness.setupDefaults();
    await use(harness);
  },
});

export { expect };
