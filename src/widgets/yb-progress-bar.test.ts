import { html, fixture, expect } from "@open-wc/testing";
import { YbProgressBar } from "./yb-progress-bar.js";
import "./yb-progress-bar.js";

describe("YbProgressBar", () => {
  it("renders determinate bar with correct width and aria attributes", async () => {
    const el = await fixture<YbProgressBar>(
      html`<yb-progress-bar .value=${65}></yb-progress-bar>`,
    );
    const container = el.shadowRoot!.querySelector(".progress-container")!;
    expect(container.getAttribute("role")).to.equal("progressbar");
    expect(container.getAttribute("aria-valuenow")).to.equal("65");
    const bar = el.shadowRoot!.querySelector(".bar") as HTMLElement;
    expect(bar.style.width).to.equal("65%");
  });

  it("renders indeterminate animation when set", async () => {
    const el = await fixture<YbProgressBar>(
      html`<yb-progress-bar indeterminate></yb-progress-bar>`,
    );
    const bar = el.shadowRoot!.querySelector(".bar")!;
    expect(bar.classList.contains("indeterminate")).to.be.true;
  });

  it("clamps values below 0 and above 100", async () => {
    const el = await fixture<YbProgressBar>(
      html`<yb-progress-bar .value=${150}></yb-progress-bar>`,
    );
    const bar = el.shadowRoot!.querySelector(".bar") as HTMLElement;
    expect(bar.style.width).to.equal("100%");
  });

  it("is accessible", async () => {
    const el = await fixture<YbProgressBar>(
      html`<yb-progress-bar
        .value=${40}
        aria-label="Upload progress"
      ></yb-progress-bar>`,
    );
    await expect(el).to.be.accessible();
  });
});
