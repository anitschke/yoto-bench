import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import { YbTextInput } from "./yb-text-input.js";
import "./yb-text-input.js";

describe("YbTextInput", () => {
  it("renders input with label and placeholder", async () => {
    const el = await fixture<YbTextInput>(
      html`<yb-text-input
        label="Search Feed"
        placeholder="https://..."
      ></yb-text-input>`,
    );
    const label = el.shadowRoot!.querySelector("label");
    expect(label).to.exist;
    expect(label!.textContent).to.contain("Search Feed");
    const input = el.shadowRoot!.querySelector("input")!;
    expect(input.getAttribute("placeholder")).to.equal("https://...");
  });

  it("dispatches input event on typing", async () => {
    const el = await fixture<YbTextInput>(
      html`<yb-text-input></yb-text-input>`,
    );
    const input = el.shadowRoot!.querySelector("input")!;
    input.value = "Hello Yoto";

    setTimeout(() => input.dispatchEvent(new Event("input")));
    const ev = await oneEvent(el, "input");
    expect(ev.detail.value).to.equal("Hello Yoto");
    expect(el.value).to.equal("Hello Yoto");
  });

  it("clears value when clear button is clicked", async () => {
    const el = await fixture<YbTextInput>(
      html`<yb-text-input clearable value="Initial"></yb-text-input>`,
    );
    const clearBtn = el.shadowRoot!.querySelector(
      ".clear-btn",
    ) as HTMLButtonElement;
    expect(clearBtn).to.exist;

    setTimeout(() => clearBtn.click());
    await oneEvent(el, "input");
    expect(el.value).to.equal("");
  });

  it("is accessible", async () => {
    const el = await fixture<YbTextInput>(
      html`<yb-text-input
        label="Card Name"
        value="Bedtime Stories"
      ></yb-text-input>`,
    );
    await expect(el).to.be.accessible();
  });
});
