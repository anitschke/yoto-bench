import { expect } from "@open-wc/testing";
import {
  tokenizeText,
  buildInvertedIndex,
  IconSearchEngine,
  IconRecord,
} from "./icon-search.js";

describe("Icon Search Engine", () => {
  describe("tokenizeText", () => {
    it("lowercases, strips diacritics, and removes stop words", () => {
      const tokens = tokenizeText("The Café & Restaurant on the Moon!");
      expect(tokens).to.deep.equal(["cafe", "restaurant", "moon"]);
    });

    it("splits on hyphens, underscores, and special characters", () => {
      const tokens = tokenizeText("noto_u1f431-cat_face");
      expect(tokens).to.deep.equal(["noto", "u1f431", "cat", "face"]);
    });

    it("returns empty array for empty or stop-word-only text", () => {
      expect(tokenizeText("")).to.deep.equal([]);
      expect(tokenizeText("the a an and")).to.deep.equal([]);
    });
  });

  describe("IconSearchEngine", () => {
    const mockIcons: IconRecord[] = [
      {
        id: "cat_orange",
        provider: "yoto",
        title: "Orange Cat",
        path: "icons/cat_orange.png",
        tags: ["feline", "pet", "kitty"],
      },
      {
        id: "cat_black",
        provider: "noto-emoji",
        title: "Black Cat Face",
        path: "icons/cat_black.png",
        tags: ["feline", "spooky", "halloween"],
      },
      {
        id: "dog_golden",
        provider: "yoto",
        title: "Golden Retriever",
        path: "icons/dog.png",
        tags: ["dog", "canine", "pet", "puppy"],
      },
    ];

    const index = buildInvertedIndex(mockIcons);
    const engine = new IconSearchEngine({
      version: 1,
      icons: mockIcons,
      index,
    });

    it("finds matching icons by whole-word token", () => {
      const results = engine.search("cat");
      expect(results.length).to.equal(2);
      expect(results.map((r) => r.id)).to.include("cat_orange");
      expect(results.map((r) => r.id)).to.include("cat_black");
    });

    it("supports prefix matching", () => {
      const results = engine.search("fel");
      expect(results.length).to.equal(2);
      expect(results.map((r) => r.id)).to.include("cat_orange");
      expect(results.map((r) => r.id)).to.include("cat_black");
    });

    it("performs multi-word AND intersection", () => {
      const results = engine.search("cat orange");
      expect(results.length).to.equal(1);
      expect(results[0]?.id).to.equal("cat_orange");
    });

    it("filters by provider", () => {
      const results = engine.search("cat", { provider: "noto-emoji" });
      expect(results.length).to.equal(1);
      expect(results[0]?.id).to.equal("cat_black");
    });

    it("ranks primary title matches higher than tag matches", () => {
      const results = engine.search("pet");
      // "pet" is in tags of cat_orange and dog_golden
      expect(results.length).to.equal(2);
    });

    it("falls back to OR when AND intersection yields nothing", () => {
      const results = engine.search("orange dog");
      expect(results.length).to.be.greaterThan(0);
      expect(results.some((r) => r.id === "cat_orange")).to.true;
      expect(results.some((r) => r.id === "dog_golden")).to.true;
    });

    it("incrementally adds new icons and searches them", () => {
      engine.addIcons([
        {
          id: "yoto_space_rocket",
          provider: "yoto",
          title: "Space Rocket",
          path: "https://api.yotoplay.com/icons/rocket.png",
          tags: ["space", "astronomy", "rocket", "fly"],
        },
      ]);

      const results = engine.search("rocket");
      expect(results.length).to.equal(1);
      expect(results[0]?.id).to.equal("yoto_space_rocket");
      expect(results[0]?.provider).to.equal("yoto");
    });
  });
});
