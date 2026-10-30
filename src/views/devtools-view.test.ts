import { fixture, html, expect } from "@open-wc/testing";
import "./devtools-view.js";
import { YbDevtoolsView } from "./devtools-view.js";

describe("<yb-devtools-view>", () => {
  it("renders devtools workbench shell with sidebar and event inspector", async () => {
    const el = await fixture<YbDevtoolsView>(
      html`<yb-devtools-view></yb-devtools-view>`,
    );

    const sidebar = el.shadowRoot?.querySelector(".sidebar");
    expect(sidebar).to.exist;

    const inspector = el.shadowRoot?.querySelector(".event-inspector");
    expect(inspector).to.exist;

    // By default, activeWidgetId is "all", which displays all widget sections
    const cards = el.shadowRoot?.querySelectorAll(".panel-card");
    expect(cards && cards.length).to.be.greaterThan(5);
  });

  it("logs dispatched interaction events to the event inspector", async () => {
    const el = await fixture<YbDevtoolsView>(
      html`<yb-devtools-view></yb-devtools-view>`,
    );

    el.logEvent("test-click", { foo: "bar" });
    await el.updateComplete;

    const logItems = el.shadowRoot?.querySelectorAll(".event-log-item");
    expect(logItems?.length).to.equal(1);
    expect(logItems?.[0].textContent).to.include("test-click");
    expect(logItems?.[0].textContent).to.include('{"foo":"bar"}');
  });
});
