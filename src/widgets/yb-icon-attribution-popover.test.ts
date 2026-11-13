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

    // Show again (re-hovering after moving cursor back)
    popover.show(anchor);
    await popover.updateComplete;
    if ("showPopover" in HTMLElement.prototype) {
      expect(innerPopover?.matches(":popover-open")).to.be.true;
    }
    expect(window.getComputedStyle(innerPopover!).display).to.not.equal("none");

    YbIconAttributionPopover.hideActive();
    await popover.updateComplete;
    if ("hidePopover" in HTMLElement.prototype) {
      expect(innerPopover?.matches(":popover-open")).to.be.false;
    }
  });

  it("handles moving cursor between multiple icons smoothly without collision", async () => {
    const container = await fixture<HTMLDivElement>(html`
      <div style="display: flex; gap: 10px;">
        <button id="btn1" style="width: 40px; height: 40px;">
          <yb-icon-attribution-popover
            id="pop1"
            iconTitle="First Icon"
            provider="noto-emoji"
          ></yb-icon-attribution-popover>
        </button>
        <button id="btn2" style="width: 40px; height: 40px;">
          <yb-icon-attribution-popover
            id="pop2"
            iconTitle="Second Icon"
            provider="yoto"
          ></yb-icon-attribution-popover>
        </button>
      </div>
    `);

    const btn1 = container.querySelector<HTMLButtonElement>("#btn1")!;
    const btn2 = container.querySelector<HTMLButtonElement>("#btn2")!;
    const pop1 = container.querySelector<YbIconAttributionPopover>("#pop1")!;
    const pop2 = container.querySelector<YbIconAttributionPopover>("#pop2")!;

    await pop1.updateComplete;
    await pop2.updateComplete;

    const inner1 = pop1.shadowRoot?.querySelector<HTMLElement>(".popover-container");
    const inner2 = pop2.shadowRoot?.querySelector<HTMLElement>(".popover-container");

    // 1. Move into button 1
    btn1.dispatchEvent(new MouseEvent("mouseenter"));
    await pop1.updateComplete;
    if ("showPopover" in HTMLElement.prototype) {
      expect(inner1?.matches(":popover-open")).to.be.true;
    }

    // 2. Move directly into button 2
    btn1.dispatchEvent(new MouseEvent("mouseleave"));
    btn2.dispatchEvent(new MouseEvent("mouseenter"));
    await pop1.updateComplete;
    await pop2.updateComplete;
    if ("showPopover" in HTMLElement.prototype) {
      expect(inner1?.matches(":popover-open")).to.be.false;
      expect(inner2?.matches(":popover-open")).to.be.true;
    }

    // 3. Move back into button 1
    btn2.dispatchEvent(new MouseEvent("mouseleave"));
    btn1.dispatchEvent(new MouseEvent("mouseenter"));
    await pop1.updateComplete;
    await pop2.updateComplete;
    if ("showPopover" in HTMLElement.prototype) {
      expect(inner2?.matches(":popover-open")).to.be.false;
      expect(inner1?.matches(":popover-open")).to.be.true;
      expect(window.getComputedStyle(inner1!).display).to.not.equal("none");
    }

    // 4. Click button 1
    btn1.dispatchEvent(new MouseEvent("click"));
    await pop1.updateComplete;
    if ("hidePopover" in HTMLElement.prototype) {
      expect(inner1?.matches(":popover-open")).to.be.false;
    }
  });
});
