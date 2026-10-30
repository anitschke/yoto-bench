import { expect } from "@open-wc/testing";
import { sanitizeCardForApi } from "./client.js";
import { Card } from "../models/index.js";

describe("sanitizeCardForApi", () => {
  it("converts CDN URLs in chapter and track display to canonical yoto:#<mediaId> format", () => {
    const hash1 = "03wHp3-hbFnLZZ2GEwjLhxaTZPVYQcnEfOZaWzcaiIY";
    const hash2 = "1uv7nVxil6eEbD9iUlTLQIPiRnH_MUC9hRGkCOKs0eY";

    const card: Card = {
      cardId: "card_1",
      title: "Test Card",
      content: {
        chapters: [
          {
            key: "01",
            title: "Chapter 1",
            display: {
              icon16x16: `https://card-content.yotoplay.com/${hash1}?size=16`,
            },
            tracks: [
              {
                key: "01",
                title: "Track 1",
                trackUrl: "yoto:#audio1",
                display: {
                  icon16x16: `https://card-content.yotoplay.com/${hash2}`,
                },
              },
            ],
          },
        ],
      },
    };

    const sanitized = sanitizeCardForApi(card);
    expect(sanitized.content?.chapters[0]?.display?.icon16x16).to.equal(
      `yoto:#${hash1}`,
    );
    expect(
      sanitized.content?.chapters[0]?.tracks[0]?.display?.icon16x16,
    ).to.equal(`yoto:#${hash2}`);
    expect(sanitized.content?.chapters[0]?.tracks[0]?.type).to.equal("audio");
  });

  it("leaves already canonical yoto:#<mediaId> icons untouched", () => {
    const hash = "20l1LZ7sLHHek_2Si4XjinmKNO8ljMc5ciQozbGpKvs";
    const card: Card = {
      cardId: "card_2",
      title: "Canonical Card",
      content: {
        chapters: [
          {
            key: "01",
            title: "Chapter 1",
            tracks: [],
            display: {
              icon16x16: `yoto:#${hash}`,
            },
          },
        ],
      },
    };

    const sanitized = sanitizeCardForApi(card);
    expect(sanitized.content?.chapters[0]?.display?.icon16x16).to.equal(
      `yoto:#${hash}`,
    );
  });

  it("preserves dynamic and unrecognized card metadata fields (Rule 6: Passthrough)", () => {
    const card: Card = {
      cardId: "card_3",
      title: "Passthrough Card",
      customCoverArt: "https://example.com/cover.png",
      ambientLighting: { color: "#ff00ff" },
      content: {
        chapters: [
          {
            key: "01",
            title: "Chapter 1",
            tracks: [],
            customChapterField: 42,
          },
        ],
      },
    };

    const sanitized = sanitizeCardForApi(card);
    expect(sanitized.customCoverArt).to.equal("https://example.com/cover.png");
    expect(sanitized.ambientLighting).to.deep.equal({ color: "#ff00ff" });
    expect(sanitized.content?.chapters[0]?.customChapterField).to.equal(42);
  });
});
