import { html, fixture, expect } from "@open-wc/testing";
import "./library-view.js";
import { YbLibraryView } from "./library-view.js";
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

      const dialog = el.shadowRoot?.querySelector("yb-dialog");
      expect(dialog?.hasAttribute("open")).to.be.true;
    });
  });
});
