import { html, fixture, expect } from "@open-wc/testing";
import { ToastNotificationEvent } from "./events.js";
import { YbToastManager } from "./yb-toast-manager.js";
import { YbToast } from "./yb-toast.js";
import "./yb-toast-manager.js";
import "./yb-toast.js";

describe("YbToastManager", () => {
  it("enqueues toast when ToastNotificationEvent is dispatched", async () => {
    const el = await fixture<YbToastManager>(
      html`<yb-toast-manager></yb-toast-manager>`,
    );

    window.dispatchEvent(
      new ToastNotificationEvent({
        message: "Notification arrived",
        type: "info",
        durationMs: 0,
      }),
    );

    await el.updateComplete;

    const toast = el.shadowRoot!.querySelector("yb-toast") as YbToast;
    expect(toast).to.exist;
    expect(toast.message).to.equal("Notification arrived");
  });
});
