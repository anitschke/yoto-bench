import { test, expect } from "./fixtures/mock-yoto.js";

// ==============================================================================
// Podcast Ingestion & Synchronization E2E Test Suite
// Verifies feed parsing, episode preview, audio download, OPFS staging,
// and chapter creation in Card View using the reusable MockYotoHarness.
// ==============================================================================

test.describe("Podcast RSS Feed Importer (E2E)", () => {
  const FEED_URL = "https://feeds.example.com/bedtime-stories.xml";

  test("previews and imports podcast episodes into a card", async ({
    page,
    yoto,
  }) => {
    // 1. Arrange: configure mock card and mock podcast feed
    yoto.setCard({
      cardId: "card_podcast_test",
      title: "Bedtime Audio Card",
      content: {
        chapters: [],
      },
    });

    await yoto.mockPodcastFeed(FEED_URL, {
      title: "Bedtime Stories for Kids",
      episodes: [
        {
          title: "Episode 1: The Magic Tree",
          duration: 450,
          enclosureUrl: "https://example.com/audio/ep1.mp3",
        },
        {
          title: "Episode 2: The Starlight River",
          duration: 600,
          enclosureUrl: "https://example.com/audio/ep2.mp3",
        },
      ],
    });

    // 2. Act: Navigate to card view
    await page.goto("/card/card_podcast_test");

    // Verify card view is loaded
    await expect(page.locator("h2")).toContainText("Bedtime Audio Card");
    await expect(page.locator(".track-item")).toHaveCount(0);

    // 3. Open the podcast import dialog
    const importBtn = page.locator('yb-button:has-text("Import Podcast")');
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // 4. Fill in the podcast feed URL and click fetch preview
    const podcastDialog = page
      .locator("yb-dialog")
      .filter({ hasText: "Import Podcast RSS Feed" });
    await expect(podcastDialog).toHaveAttribute("open", "");

    const urlInput = podcastDialog.locator("yb-text-input input").first();
    await expect(urlInput).toBeVisible();
    await urlInput.fill(FEED_URL);

    // Trigger preview fetch
    const previewBtn = podcastDialog.locator(
      'yb-button:has-text("Fetch & Preview Episodes")',
    );
    await previewBtn.click();

    // 5. Assert: Verify preview rows rendered in modal
    const epRows = podcastDialog.locator(".podcast-ep-row");
    await expect(epRows).toHaveCount(2);
    await expect(epRows.first()).toContainText("Episode 1: The Magic Tree");
    await expect(epRows.nth(1)).toContainText("Episode 2: The Starlight River");

    // 6. Act: Click import button
    const confirmImportBtn = podcastDialog.locator(
      'yb-button:has-text("Import 2 Episodes")',
    );
    await expect(confirmImportBtn).toBeVisible();
    await confirmImportBtn.click();

    // 7. Assert: Verify episodes added to card tracks
    const tracks = page.locator(".track-item");
    await expect(tracks).toHaveCount(2, { timeout: 15000 });
    await expect(page.locator(".track-title-input").first()).toHaveValue(
      "Episode 1: The Magic Tree",
    );
    await expect(page.locator(".track-title-input").nth(1)).toHaveValue(
      "Episode 2: The Starlight River",
    );

    // Verify sync badge is now active
    await expect(
      page.locator('yb-badge:has-text("Podcast Sync Active")'),
    ).toBeVisible();

    // 8. Act: Click Save Card to persist changes to Yoto
    const saveCardBtn = page.locator('yb-button:has-text("Save Card")');
    await expect(saveCardBtn).toBeVisible();
    await saveCardBtn.click();

    // Verify success toast appears
    await expect(
      page.locator('text="Card playlist saved successfully to Yoto!"'),
    ).toBeVisible();

    // Verify the in-memory card in mock harness was persisted via POST /content
    const savedCard = yoto.getCard("card_podcast_test");
    expect(savedCard).toBeDefined();
    expect(savedCard?.content?.chapters).toHaveLength(2);
    expect(savedCard?.metadata?.description).toContain("<!-- yoto-bench:sync");
  });
});
