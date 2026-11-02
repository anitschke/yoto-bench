import { html, fixture, expect } from "@open-wc/testing";
import "./about-view.js";
import { YbAboutView } from "./about-view.js";

describe("yb-about-view", () => {
  it("renders page header and core value propositions", async () => {
    const el = await fixture<YbAboutView>(
      html`<yb-about-view></yb-about-view>`,
    );

    expect(el.shadowRoot?.querySelector("h2")?.textContent).to.include(
      "About YotoBench",
    );

    const featureCards = el.shadowRoot?.querySelectorAll(".feature-card");
    expect(featureCards?.length).to.equal(3);

    // 1. Offline Podcast Listening
    expect(featureCards?.[0]?.textContent).to.include(
      "Offline Podcast Listening on MYO Cards",
    );
    expect(featureCards?.[0]?.textContent).to.include("road trips");

    // 2. Searchable Icon Discovery
    expect(featureCards?.[1]?.textContent).to.include(
      "Instant & Searchable Icon Discovery",
    );
    expect(featureCards?.[1]?.textContent).to.include("3,700 pixel icons");

    // 3. Privacy-First & Serverless
    expect(featureCards?.[2]?.textContent).to.include(
      "Privacy-First & Completely Serverless",
    );
    expect(featureCards?.[2]?.textContent).to.include(
      "100% client-side inside your browser",
    );
  });

  it("renders navigation buttons for Explore My Cards and Read Privacy Policy", async () => {
    const el = await fixture<YbAboutView>(
      html`<yb-about-view></yb-about-view>`,
    );

    const buttons = el.shadowRoot?.querySelectorAll(".actions-row yb-button");
    expect(buttons?.length).to.equal(2);
    expect(buttons?.[0]?.textContent).to.include("Explore My Cards");
    expect(buttons?.[1]?.textContent).to.include("Read Privacy Policy");
  });
});
