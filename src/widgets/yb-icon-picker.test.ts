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

  it("loads catalog and renders icons in the grid", async () => {
    const el = await fixture<YbIconPicker>(
      html`<yb-icon-picker open></yb-icon-picker>`,
    );
    // Wait for async loadCatalog
    while (el.shadowRoot?.querySelector(".empty-state")?.textContent?.includes("Loading")) {
      await new Promise((r) => setTimeout(r, 20));
    }
    await el.updateComplete;

    const iconItems = el.shadowRoot?.querySelectorAll(".icon-item");
    expect(iconItems?.length).to.be.greaterThan(0);
  });

  it("dispatches yb-icon-selected when an icon is clicked", async () => {
    const el = await fixture<YbIconPicker>(
      html`<yb-icon-picker open></yb-icon-picker>`,
    );
    while (el.shadowRoot?.querySelector(".empty-state")?.textContent?.includes("Loading")) {
      await new Promise((r) => setTimeout(r, 20));
    }
    await el.updateComplete;

    let selectedIcon: unknown = null;
    el.addEventListener("yb-icon-selected", ((e: CustomEvent) => {
      selectedIcon = e.detail.icon;
    }) as EventListener);

    const firstIcon = el.shadowRoot?.querySelector<HTMLButtonElement>(".icon-item");
    expect(firstIcon).to.exist;
    firstIcon?.click();

    expect(selectedIcon).to.not.be.null;
    expect(el.open).to.be.false;
  });
});
