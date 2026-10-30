import { html, fixture, expect } from "@open-wc/testing";
import { YbButton } from "./yb-button.js";
import "./yb-button.js";

describe("YbButton", () => {
  it("renders with default secondary variant", async () => {
    const el = await fixture<YbButton>(html`<yb-button>Click Me</yb-button>`);
    expect(el.variant).to.equal("secondary");
    const button = el.shadowRoot!.querySelector("button")!;
    expect(button.classList.contains("variant-secondary")).to.be.true;
    expect(el.textContent).to.contain("Click Me");
  });

  it("renders primary variant", async () => {
    const el = await fixture<YbButton>(
      html`<yb-button variant="primary">Submit</yb-button>`,
    );
    expect(el.variant).to.equal("primary");
    const button = el.shadowRoot!.querySelector("button")!;
    expect(button.classList.contains("variant-primary")).to.be.true;
  });

  it("handles loading state", async () => {
    const el = await fixture<YbButton>(
      html`<yb-button loading>Loading</yb-button>`,
    );
    const button = el.shadowRoot!.querySelector("button")!;
    expect(button.getAttribute("aria-busy")).to.equal("true");
    expect(button.hasAttribute("disabled")).to.be.true;
  });
});
