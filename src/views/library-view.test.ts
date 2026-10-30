import { html, fixture, expect } from "@open-wc/testing";
import "./library-view.js";
import { YbLibraryView } from "./library-view.js";
import { YbDialog } from "../widgets/yb-dialog.js";
import { YbTextInput } from "../widgets/yb-text-input.js";
import { authService } from "../api/auth.js";
import { yotoApi } from "../api/client.js";
import { Card } from "../models/index.js";

const mockCards: Card[] = [
  {
    cardId: "card_1",
    title: "Bedtime Tales",
    content: {
      chapters: [
        {
          key: "01",
          title: "Chapter 1",
          tracks: [],
          display: { icon16x16: "icons/star.png" },
        },
      ],
    },
  },
  {
    cardId: "card_2",
    title: "Adventure Island",
    content: {
      chapters: [],
    },
  },
];

describe("yb-library-view", () => {
  it("shows please-sign-in prompt when unauthenticated", async () => {
    const el = await fixture<YbLibraryView>(
      html`<yb-library-view></yb-library-view>`,
    );
    expect(el.shadowRoot?.querySelector("yb-please-sign-in")).to.exist;
  });

  describe("when authenticated", () => {
    let origListCards: typeof yotoApi.listCards;
    let origCreateCard: typeof yotoApi.createCard;
    let origIsAuth: typeof authService.isAuthenticated;

    beforeEach(() => {
      origListCards = yotoApi.listCards;
      origCreateCard = yotoApi.createCard;
      origIsAuth = authService.isAuthenticated;

      authService.isAuthenticated = () => true;
      yotoApi.listCards = async () => Promise.resolve(mockCards);
      yotoApi.createCard = async (c) =>
        Promise.resolve({ cardId: "new_123", card: c as Card });
    });

    afterEach(() => {
      yotoApi.listCards = origListCards;
      yotoApi.createCard = origCreateCard;
      authService.isAuthenticated = origIsAuth;
    });

    it("renders search input and New Card button next to it", async () => {
      const el = await fixture<YbLibraryView>(
        html`<yb-library-view></yb-library-view>`,
      );
      el.authSession = {
        accessToken: "mock",
        refreshToken: "mock",
        expiresAt: Date.now() + 10000,
      };
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const searchFilter = el.shadowRoot?.querySelector(".search-filter");
      expect(searchFilter).to.exist;

      const searchInput = searchFilter?.querySelector("yb-text-input");
      expect(searchInput).to.exist;
      expect(searchInput?.getAttribute("placeholder")).to.equal(
        "Search cards...",
      );

      const newCardBtn = searchFilter?.querySelector("yb-button");
      expect(newCardBtn).to.exist;
      expect(newCardBtn?.textContent).to.include("New Card");
    });

    it("opens create card dialog when New Card button is clicked", async () => {
      const el = await fixture<YbLibraryView>(
        html`<yb-library-view></yb-library-view>`,
      );
      el.authSession = {
        accessToken: "mock",
        refreshToken: "mock",
        expiresAt: Date.now() + 10000,
      };
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const newCardBtn = el.shadowRoot?.querySelector(
        ".search-filter yb-button",
      ) as HTMLElement;
      newCardBtn.click();
      await el.updateComplete;

      const dialog = el.shadowRoot?.querySelector("yb-dialog") as YbDialog;
      expect(dialog).to.exist;
      expect(dialog.hasAttribute("open")).to.be.true;
      expect(dialog.open).to.be.true;
      const nativeDialog = dialog.shadowRoot?.querySelector("dialog");
      expect(nativeDialog?.open).to.be.true;
    });

    it("updates newCardTitle and retains value when typing in the dialog input", async () => {
      const el = await fixture<YbLibraryView>(
        html`<yb-library-view></yb-library-view>`,
      );
      el.authSession = {
        accessToken: "mock",
        refreshToken: "mock",
        expiresAt: Date.now() + 10000,
      };
      await el.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 50));
      await el.updateComplete;

      const newCardBtn = el.shadowRoot?.querySelector(
        ".search-filter yb-button",
      ) as HTMLElement;
      newCardBtn.click();
      await el.updateComplete;

      const textInput = el.shadowRoot?.querySelector(
        "yb-dialog yb-text-input",
      ) as YbTextInput;
      expect(textInput).to.exist;

      const nativeInput = textInput.shadowRoot!.querySelector("input")!;
      expect(nativeInput).to.exist;

      nativeInput.value = "Bedtime Stories Podcast";
      nativeInput.dispatchEvent(
        new Event("input", { bubbles: true, composed: true }),
      );

      await el.updateComplete;
      await textInput.updateComplete;

      expect(nativeInput.value).to.equal("Bedtime Stories Podcast");
      expect(textInput.value).to.equal("Bedtime Stories Podcast");
    });
  });
});
