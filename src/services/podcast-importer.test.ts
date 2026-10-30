import { expect } from "@open-wc/testing";
import {
  parsePodcastFeed,
  filterEpisodes,
  extractSyncMetadata,
  embedSyncMetadata,
  stripSyncMetadata,
  CardSyncMetadata,
  PodcastEpisode,
} from "./podcast-importer.js";

const SAMPLE_RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Bedtime Stories for Kids</title>
    <description>Calming stories for bedtime</description>
    <itunes:image href="https://example.com/cover.jpg"/>
    <item>
      <title>Episode 1: The Magic Tree</title>
      <description>A gentle tale of trees</description>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
      <itunes:duration>450</itunes:duration>
      <enclosure url="https://example.com/ep1.mp3" length="123456" type="audio/mpeg"/>
    </item>
    <item>
      <title>Teaser Trailer</title>
      <description>Coming soon promo</description>
      <pubDate>Tue, 02 Jan 2024 10:00:00 GMT</pubDate>
      <itunes:duration>45</itunes:duration>
      <enclosure url="https://example.com/trailer.mp3" length="12345" type="audio/mpeg"/>
    </item>
    <item>
      <title>Episode 2: The Starlight River</title>
      <description>Follow the stars</description>
      <pubDate>Wed, 03 Jan 2024 10:00:00 GMT</pubDate>
      <itunes:duration>600</itunes:duration>
      <enclosure url="https://example.com/ep2.mp3" length="234567" type="audio/mpeg"/>
    </item>
  </channel>
</rss>`;

describe("Podcast Importer Service", () => {
  describe("parsePodcastFeed", () => {
    it("parses feed channel metadata and episodes", () => {
      const parsed = parsePodcastFeed(SAMPLE_RSS_XML);
      expect(parsed.title).to.equal("Bedtime Stories for Kids");
      expect(parsed.description).to.equal("Calming stories for bedtime");
      expect(parsed.imageUrl).to.equal("https://example.com/cover.jpg");
      expect(parsed.episodes.length).to.equal(3);

      const ep1 = parsed.episodes.find((e) => e.title.includes("Magic Tree"));
      expect(ep1).to.exist;
      expect(ep1?.duration).to.equal(450);
      expect(ep1?.enclosureUrl).to.equal("https://example.com/ep1.mp3");
    });
  });

  describe("filterEpisodes", () => {
    const episodes: PodcastEpisode[] = [
      {
        title: "Short Promo",
        duration: 30,
        enclosureUrl: "https://example.com/promo.mp3",
        pubDate: "2024-01-01T00:00:00Z",
      },
      {
        title: "Old Episode",
        duration: 300,
        enclosureUrl: "https://example.com/old.mp3",
        pubDate: "2024-01-02T00:00:00Z",
      },
      {
        title: "New Episode",
        duration: 500,
        enclosureUrl: "https://example.com/new.mp3",
        pubDate: "2024-01-03T00:00:00Z",
      },
    ];

    it("filters out short promo clips based on minDurationSeconds", () => {
      const filtered = filterEpisodes(episodes, { minDurationSeconds: 60 });
      expect(filtered.length).to.equal(2);
      expect(filtered.some((e) => e.title === "Short Promo")).to.be.false;
    });

    it("sorts by newest first by default and respects limit", () => {
      const filtered = filterEpisodes(episodes, { limit: 1 });
      expect(filtered.length).to.equal(1);
      expect(filtered[0]?.title).to.equal("New Episode");
    });

    it("sorts by oldest first when specified", () => {
      const filtered = filterEpisodes(episodes, { order: "oldest" });
      expect(filtered[0]?.title).to.equal("Short Promo");
      expect(filtered[2]?.title).to.equal("New Episode");
    });
  });

  describe("Card Sync Metadata", () => {
    const mockSync: CardSyncMetadata = {
      version: 1,
      sourceType: "podcast-rss",
      feedUrl: "https://feeds.example.com/podcast.xml",
      filter: {
        limit: 10,
        order: "newest",
        minDurationSeconds: 120,
      },
      lastSynced: "2024-01-15T12:00:00Z",
    };

    it("serializes and extracts sync metadata cleanly", () => {
      const baseDesc = "A fun playlist for bedtime.";
      const fullDesc = embedSyncMetadata(baseDesc, mockSync);

      expect(fullDesc).to.include("<!-- yoto-bench:sync");
      expect(fullDesc).to.include(mockSync.feedUrl);

      const extracted = extractSyncMetadata(fullDesc);
      expect(extracted).to.deep.equal(mockSync);

      const clean = stripSyncMetadata(fullDesc);
      expect(clean).to.equal(baseDesc);
    });

    it("handles description without sync block", () => {
      expect(extractSyncMetadata("Just normal text")).to.be.null;
      expect(extractSyncMetadata(undefined)).to.be.null;
      expect(stripSyncMetadata("Just normal text")).to.equal(
        "Just normal text",
      );
    });
  });
});
