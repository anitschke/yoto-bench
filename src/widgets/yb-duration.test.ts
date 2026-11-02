import { html, fixture, expect } from "@open-wc/testing";
import "./yb-duration.js";
import { YbDuration } from "./yb-duration.js";

describe("yb-duration", () => {
  it("renders 00:00 and PT0S by default", async () => {
    const el = await fixture<YbDuration>(html`<yb-duration></yb-duration>`);
    const timeEl = el.shadowRoot?.querySelector("time");
    expect(timeEl).to.exist;
    expect(timeEl?.getAttribute("datetime")).to.equal("PT0S");
    expect(timeEl?.textContent?.trim()).to.equal("0:00");
  });

  it("formats standard MM:SS correctly", async () => {
    const el = await fixture<YbDuration>(
      html`<yb-duration .seconds=${185}></yb-duration>`,
    );
    const timeEl = el.shadowRoot?.querySelector("time");
    expect(timeEl?.getAttribute("datetime")).to.equal("PT3M5S");
    expect(timeEl?.textContent?.trim()).to.equal("3:05");
  });

  it("formats standard H:MM:SS for durations >= 1 hour", async () => {
    const el = await fixture<YbDuration>(
      html`<yb-duration .seconds=${4530}></yb-duration>`,
    );
    const timeEl = el.shadowRoot?.querySelector("time");
    expect(timeEl?.getAttribute("datetime")).to.equal("PT1H15M30S");
    expect(timeEl?.textContent?.trim()).to.equal("1:15:30");
  });

  it("formats short seconds correctly", async () => {
    const el = await fixture<YbDuration>(
      html`<yb-duration .seconds=${42}></yb-duration>`,
    );
    const timeEl = el.shadowRoot?.querySelector("time");
    expect(timeEl?.getAttribute("datetime")).to.equal("PT42S");
    expect(timeEl?.textContent?.trim()).to.equal("0:42");
  });

  it("supports format='human' for readable compact labels", async () => {
    const elMin = await fixture<YbDuration>(
      html`<yb-duration .seconds=${185} format="human"></yb-duration>`,
    );
    expect(elMin.shadowRoot?.querySelector("time")?.textContent?.trim()).to.equal(
      "3m 5s",
    );

    const elHr = await fixture<YbDuration>(
      html`<yb-duration .seconds=${4530} format="human"></yb-duration>`,
    );
    expect(elHr.shadowRoot?.querySelector("time")?.textContent?.trim()).to.equal(
      "1h 15m",
    );

    const elSec = await fixture<YbDuration>(
      html`<yb-duration .seconds=${42} format="human"></yb-duration>`,
    );
    expect(elSec.shadowRoot?.querySelector("time")?.textContent?.trim()).to.equal(
      "42s",
    );
  });
});
