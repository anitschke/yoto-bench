import { html, fixture, expect } from "@open-wc/testing";
import "./about-icons-view.js";
import { YbAboutIconsView } from "./about-icons-view.js";

describe("yb-about-icons-view", () => {
  it("renders page title and all 5 icon source and hardware sections", async () => {
    const el = await fixture<YbAboutIconsView>(
      html`<yb-about-icons-view></yb-about-icons-view>`,
    );

    expect(el.shadowRoot?.querySelector("h2")?.textContent).to.include(
      "About Icon Sources & Licensing",
    );

    const cards = el.shadowRoot?.querySelectorAll(".source-card");
    expect(cards?.length).to.equal(5);

    // Section 1: Google Noto Emoji
    expect(cards?.[0]?.textContent).to.include("Google Noto Emoji");
    expect(cards?.[0]?.textContent).to.include("Apache 2.0 License");

    // Section 2: Official Yoto
    expect(cards?.[1]?.textContent).to.include("Official Yoto Display Art");

    // Section 3: Custom Uploads
    expect(cards?.[2]?.textContent).to.include("Custom User Uploads");

    // Section 4: Community Repositories (YotoIcons.com)
    expect(cards?.[3]?.textContent).to.include(
      "Community Repositories (YotoIcons.com)",
    );

    // Section 5: Hardware specs
    expect(cards?.[4]?.textContent).to.include(
      "Hardware LED Matrix & Contrast Guidelines",
    );
  });

  it("renders action buttons for navigation", async () => {
    const el = await fixture<YbAboutIconsView>(
      html`<yb-about-icons-view></yb-about-icons-view>`,
    );

    const buttons = el.shadowRoot?.querySelectorAll(".actions-row yb-button");
    expect(buttons?.length).to.equal(2);
    expect(buttons?.[0]?.textContent).to.include("Back to Library");
    expect(buttons?.[1]?.textContent).to.include("Privacy Policy");
  });
});
