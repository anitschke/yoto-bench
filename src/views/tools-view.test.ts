import { html, fixture, expect } from "@open-wc/testing";
import "./tools-view.js";
import { YbToolsView, COMMUNITY_TOOLS } from "./tools-view.js";
import { YbTextInput } from "../widgets/yb-text-input.js";

describe("yb-tools-view", () => {
  it("renders header and all curated tools by default", async () => {
    const el = await fixture<YbToolsView>(html`<yb-tools-view></yb-tools-view>`);

    expect(el.shadowRoot?.querySelector("h2")?.textContent).to.include(
      "Community Tools & Resources",
    );

    const cards = el.shadowRoot?.querySelectorAll(".tool-card");
    expect(cards?.length).to.equal(COMMUNITY_TOOLS.length);

    // Verify presence of key tools
    expect(el.shadowRoot?.textContent).to.include("Yoto Card Forge");
    expect(el.shadowRoot?.textContent).to.include("YotoIcons.com");
    expect(el.shadowRoot?.textContent).to.include("MP3Gain Volume Normalizer");
    expect(el.shadowRoot?.textContent).to.include("yotocli");
  });

  it("filters tools when category pill is selected", async () => {
    const el = await fixture<YbToolsView>(html`<yb-tools-view></yb-tools-view>`);

    const pills = el.shadowRoot?.querySelectorAll(
      ".category-pill",
    ) as NodeListOf<HTMLButtonElement>;

    // Find and click the 'Labels & Printing' pill
    const labelsPill = Array.from(pills).find((p) =>
      p.textContent?.includes("Labels & Printing"),
    );
    expect(labelsPill).to.exist;
    labelsPill!.click();

    await el.updateComplete;

    const cards = el.shadowRoot?.querySelectorAll(".tool-card");
    expect(cards?.length).to.equal(2);
    expect(el.shadowRoot?.textContent).to.include("Yoto Card Forge");
    expect(el.shadowRoot?.textContent).to.include("Avery MYO Sticker Templates");
    expect(el.shadowRoot?.textContent).to.not.include("MP3Gain Volume Normalizer");
  });

  it("filters tools via search input", async () => {
    const el = await fixture<YbToolsView>(html`<yb-tools-view></yb-tools-view>`);

    const searchInput = el.shadowRoot?.querySelector(
      ".search-box yb-text-input",
    ) as YbTextInput;
    expect(searchInput).to.exist;

    const nativeInput = searchInput.shadowRoot!.querySelector("input")!;
    nativeInput.value = "piskel";
    nativeInput.dispatchEvent(
      new Event("input", { bubbles: true, composed: true }),
    );

    await el.updateComplete;

    const cards = el.shadowRoot?.querySelectorAll(".tool-card");
    expect(cards?.length).to.equal(1);
    expect(el.shadowRoot?.textContent).to.include("Piskel Pixel Art Editor");
  });

  it("displays empty state when search returns no matches", async () => {
    const el = await fixture<YbToolsView>(html`<yb-tools-view></yb-tools-view>`);

    const searchInput = el.shadowRoot?.querySelector(
      ".search-box yb-text-input",
    ) as YbTextInput;
    const nativeInput = searchInput.shadowRoot!.querySelector("input")!;
    nativeInput.value = "nonexistenttool12345";
    nativeInput.dispatchEvent(
      new Event("input", { bubbles: true, composed: true }),
    );

    await el.updateComplete;

    const empty = el.shadowRoot?.querySelector(".empty-state");
    expect(empty).to.exist;
    expect(empty?.textContent).to.include(
      "No community tools match your search or filter",
    );
  });
});
