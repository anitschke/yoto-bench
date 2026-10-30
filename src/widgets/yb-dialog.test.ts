import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import { YbDialog } from "./yb-dialog.js";
import "./yb-dialog.js";

describe("YbDialog", () => {
  it("opens native dialog via showModal()", async () => {
    const el = await fixture<YbDialog>(html`
      <yb-dialog heading="Confirm Action">
        <p>Dialog body text</p>
      </yb-dialog>
    `);
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    expect(dialog.open).to.be.false;

    el.showModal();
    expect(dialog.open).to.be.true;

    el.close();
    expect(dialog.open).to.be.false;
  });

  it("emits close event when close button is clicked", async () => {
    const el = await fixture<YbDialog>(
      html`<yb-dialog heading="Test Dialog"></yb-dialog>`,
    );
    el.showModal();
    const closeBtn = el.shadowRoot!.querySelector(
      ".close-button",
    ) as HTMLButtonElement;

    setTimeout(() => closeBtn.click());
    await oneEvent(el, "close");
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    expect(dialog.open).to.be.false;
  });

  it("is accessible when displayed", async () => {
    const el = await fixture<YbDialog>(html`
      <yb-dialog heading="Accessible Modal">
        <p>Testing accessibility.</p>
      </yb-dialog>
    `);
    await expect(el).to.be.accessible();
  });
});
