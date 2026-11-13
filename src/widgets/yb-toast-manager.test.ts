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

  it("elevates toast container into top layer via popover API when toasts are present", async () => {
    const el = await fixture<YbToastManager>(
      html`<yb-toast-manager></yb-toast-manager>`,
    );

    const container = el.shadowRoot!.querySelector(".toast-container");
    expect(container, "container should exist").to.exist;

    window.dispatchEvent(
      new ToastNotificationEvent({
        message: "Error during modal operation",
        type: "error",
        durationMs: 0,
      }),
    );
    await el.updateComplete;

    if ("showPopover" in HTMLElement.prototype) {
      expect(container?.matches(":popover-open")).to.be.true;
    }
  });

  it("elevates toasts above open modal dialogs", async () => {
    // Open a modal dialog
    const dialog = await fixture<HTMLDialogElement>(html`<dialog></dialog>`);
    dialog.showModal();
    expect(dialog.open).to.be.true;

    const el = await fixture<YbToastManager>(
      html`<yb-toast-manager></yb-toast-manager>`,
    );

    window.dispatchEvent(
      new ToastNotificationEvent({
        message: "Failed while modal dialog was open",
        type: "error",
        durationMs: 0,
      }),
    );
    await el.updateComplete;

    const container = el.shadowRoot!.querySelector(".toast-container");
    expect(container).to.exist;

    if ("showPopover" in HTMLElement.prototype) {
      expect(container?.matches(":popover-open")).to.be.true;
    }

    // Clean up dialog
    dialog.close();
  });
});
