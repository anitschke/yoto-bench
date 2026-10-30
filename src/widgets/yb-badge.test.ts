import { html, fixture, expect } from "@open-wc/testing";
import { YbBadge } from "./yb-badge.js";
import "./yb-badge.js";

describe("YbBadge", () => {
  it("renders default neutral variant", async () => {
    const el = await fixture<YbBadge>(html`<yb-badge>Tag</yb-badge>`);
    expect(el.variant).to.equal("neutral");
    const span = el.shadowRoot!.querySelector(".badge")!;
    expect(span.classList.contains("variant-neutral")).to.be.true;
    expect(el.textContent).to.contain("Tag");
  });

  it("renders success variant", async () => {
    const el = await fixture<YbBadge>(
      html`<yb-badge variant="success">Online</yb-badge>`,
    );
    expect(el.variant).to.equal("success");
    const span = el.shadowRoot!.querySelector(".badge")!;
    expect(span.classList.contains("variant-success")).to.be.true;
  });
});
