import { html, fixture, expect } from "@open-wc/testing";
import "./yb-icon-picker.js";
import { YbIconPicker } from "./yb-icon-picker.js";

describe("yb-icon-picker", () => {
  it("renders closed by default", async () => {
    const el = await fixture<YbIconPicker>(
      html`<yb-icon-picker></yb-icon-picker>`,
    );
    expect(el.open).to.be.false;
  });

  it("renders dialog when open", async () => {
    const el = await fixture<YbIconPicker>(
      html`<yb-icon-picker open></yb-icon-picker>`,
    );
    expect(el.open).to.be.true;
    const dialog = el.shadowRoot?.querySelector("yb-dialog");
    expect(dialog).to.exist;
  });

  it("renders search input and provider tabs", async () => {
    const el = await fixture<YbIconPicker>(
      html`<yb-icon-picker open></yb-icon-picker>`,
    );
    const searchInput = el.shadowRoot?.querySelector("yb-text-input");
    expect(searchInput).to.exist;

    const tabs = el.shadowRoot?.querySelectorAll(".provider-tab");
    expect(tabs?.length).to.equal(4);
  });
});
