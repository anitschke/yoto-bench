import { test, expect } from "@playwright/test";

test.describe("Icon Picker Modal & Search Sandbox (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the icon-picker widget demo page in devtools
    await page.goto("/devtools/widgets/icon-picker");
  });

  test("loads devtools icon picker demo with empty initial state", async ({
    page,
  }) => {
    await expect(page.locator("yb-devtools-view h2")).toContainText(
      "Icon Picker Modal",
    );
    const emptyPreview = page.locator('[data-testid="selected-icon-empty"]');
    await expect(emptyPreview).toBeVisible();
    await expect(emptyPreview).toContainText("No icon selected yet");
  });

  test("opens dialog and populates icon catalog from inverted index", async ({
    page,
  }) => {
    // Click trigger button to open modal
    await page.locator('[data-testid="open-icon-picker-btn"]').click();

    const picker = page.locator("yb-icon-picker");
    await expect(picker).toHaveAttribute("open", "");

    // Verify icons populate into the grid
    const iconItems = picker.locator(".icon-item");
    await expect(iconItems.first()).toBeVisible({ timeout: 10000 });

    const count = await iconItems.count();
    expect(count).toBeGreaterThan(20);

    // Verify icon images actually load and decode without showing the 16x16 fallback
    const firstImg = picker.locator(".icon-item yb-pixel-icon img").first();
    await expect(firstImg).toBeVisible();
    const naturalWidth = await firstImg.evaluate(
      (img: HTMLImageElement) => img.naturalWidth,
    );
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test("searches catalog and displays matching icons", async ({ page }) => {
    await page.locator('[data-testid="open-icon-picker-btn"]').click();

    const picker = page.locator("yb-icon-picker");
    const searchInput = picker.locator("yb-text-input input");
    await expect(searchInput).toBeVisible();

    // Search for "star"
    await searchInput.fill("star");
    await page.waitForTimeout(300);

    const iconItems = picker.locator(".icon-item");
    await expect(iconItems.first()).toBeVisible();

    // Check title of first matching result
    const title = await iconItems.first().getAttribute("title");
    expect(title?.toLowerCase()).toContain("star");
  });

  test("selects an icon, closes modal, and updates preview card", async ({
    page,
  }) => {
    await page.locator('[data-testid="open-icon-picker-btn"]').click();

    const picker = page.locator("yb-icon-picker");
    const searchInput = picker.locator("yb-text-input input");
    await searchInput.fill("cat");
    await page.waitForTimeout(300);

    const iconItems = picker.locator(".icon-item");
    await expect(iconItems.first()).toBeVisible();

    const chosenTitle = (await iconItems.first().getAttribute("title")) || "";
    await iconItems.first().click();

    // Modal should close
    await expect(picker).not.toHaveAttribute("open", "");

    // Preview should display the chosen icon
    const previewTitle = page.locator('[data-testid="selected-icon-title"]');
    await expect(previewTitle).toBeVisible();
    expect(chosenTitle.toLowerCase()).toContain(
      (await previewTitle.textContent())?.trim().toLowerCase() || "",
    );

    const previewId = page.locator('[data-testid="selected-icon-id"]');
    await expect(previewId).not.toBeEmpty();
  });

  test("filters icons by provider tabs", async ({ page }) => {
    await page.locator('[data-testid="open-icon-picker-btn"]').click();

    const picker = page.locator("yb-icon-picker");
    const notoTab = picker.locator(".provider-tab", {
      hasText: "Noto Emoji",
    });
    await expect(notoTab).toBeVisible();
    await notoTab.click();
    await expect(notoTab).toHaveClass(/active/);

    const iconItems = picker.locator(".icon-item");
    await expect(iconItems.first()).toBeVisible();

    // Click the first Noto Emoji icon
    await iconItems.first().click();

    // Selected icon provider in preview should be "noto-emoji"
    const providerBadge = page.locator(
      '[data-testid="selected-icon-provider"]',
    );
    await expect(providerBadge).toHaveText("noto-emoji");

    // Re-open and test Official Yoto tab
    await page.locator('[data-testid="open-icon-picker-btn"]').click();
    const yotoTab = picker.locator(".provider-tab", {
      hasText: "Official Yoto",
    });
    await yotoTab.click();
    await expect(yotoTab).toHaveClass(/active/);
    const yotoIconItems = picker.locator(".icon-item");
    await expect(yotoIconItems.first()).toBeVisible();

    // Select an official Yoto icon
    await yotoIconItems.first().click();

    // Selected icon provider in preview should be "yoto"
    await expect(providerBadge).toHaveText("yoto");

    // Re-open and verify Custom tab shows empty state initially
    await page.locator('[data-testid="open-icon-picker-btn"]').click();
    const customTab = picker.locator(".provider-tab", {
      hasText: "Custom",
    });
    await customTab.click();
    await expect(customTab).toHaveClass(/active/);
    await expect(picker.locator(".empty-state")).toContainText(
      "No matching icons found",
    );
  });

  test("displays empty state when query returns zero results", async ({
    page,
  }) => {
    await page.locator('[data-testid="open-icon-picker-btn"]').click();

    const picker = page.locator("yb-icon-picker");
    const searchInput = picker.locator("yb-text-input input");
    await searchInput.fill("zzxxnonexistentterm9999");
    await page.waitForTimeout(300);

    const emptyState = picker.locator(".empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No matching icons found");
  });
});
