import { html, fixture, expect } from "@open-wc/testing";
import "./yb-icon-attribution-popover.js";
import { YbIconAttributionPopover } from "./yb-icon-attribution-popover.js";

describe("yb-icon-attribution-popover", () => {
  it("renders icon title and formats provider names correctly", async () => {
    const el = await fixture<YbIconAttributionPopover>(
      html`<yb-icon-attribution-popover
        iconTitle="Sparkling Star"
        provider="noto-emoji"
      ></yb-icon-attribution-popover>`,
    );

    const titleEl = el.shadowRoot?.querySelector(".icon-title");
    expect(titleEl?.textContent).to.equal("Sparkling Star");

    const badge = el.shadowRoot?.querySelector(".source-badge");
    expect(badge?.textContent?.trim()).to.equal("Google Noto Emoji");
    expect(badge?.classList.contains("noto-emoji")).to.be.true;
  });

  it("renders author when provided", async () => {
    const el = await fixture<YbIconAttributionPopover>(
      html`<yb-icon-attribution-popover
        iconTitle="Sleepy Fox"
        provider="yotoicons"
        author="PixelArtist42"
      ></yb-icon-attribution-popover>`,
    );

    const badge = el.shadowRoot?.querySelector(".source-badge");
    expect(badge?.textContent?.trim()).to.equal("YotoIcons.com");

    const author = el.shadowRoot?.querySelector(".author-tag");
    expect(author?.textContent).to.include("by PixelArtist42");
  });

  it("shows popover on parent element mouseenter and hides on mouseleave", async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div id="target-parent" style="width: 50px; height: 50px;">
        <yb-icon-attribution-popover
          iconTitle="Music Note"
          provider="yoto"
        ></yb-icon-attribution-popover>
      </div>
    `);

    const popover = container.querySelector<YbIconAttributionPopover>(
      "yb-icon-attribution-popover",
    )!;
    await popover.updateComplete;

    const innerPopover = popover.shadowRoot?.querySelector<HTMLElement>(
      ".popover-container",
    );
    expect(innerPopover).to.exist;

    // Trigger mouseenter on parent
    container.dispatchEvent(new MouseEvent("mouseenter"));
    await popover.updateComplete;

    if ("showPopover" in HTMLElement.prototype) {
      expect(innerPopover?.matches(":popover-open")).to.be.true;
    } else {
      expect(innerPopover?.style.display).to.equal("flex");
    }

    // Trigger mouseleave on parent
    container.dispatchEvent(new MouseEvent("mouseleave"));
    await popover.updateComplete;

    if ("hidePopover" in HTMLElement.prototype) {
      expect(innerPopover?.matches(":popover-open")).to.be.false;
    }
  });

  it("can be triggered programmatically via show() and hide()", async () => {
    const anchor = await fixture<HTMLButtonElement>(
      html`<button style="width: 40px; height: 40px;">Icon</button>`,
    );
    const popover = await fixture<YbIconAttributionPopover>(
      html`<yb-icon-attribution-popover
        iconTitle="Rocket"
        provider="custom"
      ></yb-icon-attribution-popover>`,
    );

    popover.show(anchor);
    await popover.updateComplete;

    const innerPopover = popover.shadowRoot?.querySelector<HTMLElement>(
      ".popover-container",
    );
    if ("showPopover" in HTMLElement.prototype) {
      expect(innerPopover?.matches(":popover-open")).to.be.true;
    }

    popover.hide();
    await popover.updateComplete;
    if ("hidePopover" in HTMLElement.prototype) {
      expect(innerPopover?.matches(":popover-open")).to.be.false;
    }
  });
});
