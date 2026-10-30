import { expect } from "@open-wc/testing";
import { reorderPlaylist } from "./upload-queue.js";
import { Chapter } from "../models/index.js";

describe("Upload Queue & Playlist Utilities", () => {
  describe("reorderPlaylist", () => {
    it("renumbers chapters and tracks with zero-padded keys and numeric overlay labels", () => {
      const chapters: Chapter[] = [
        {
          key: "old_key_10",
          title: "First",
          tracks: [
            {
              key: "old_track_10",
              title: "First Track",
              trackUrl: "yoto:#1",
            },
          ],
        },
        {
          key: "old_key_20",
          title: "Second",
          tracks: [
            {
              key: "old_track_20",
              title: "Second Track",
              trackUrl: "yoto:#2",
            },
          ],
        },
      ];

      const reordered = reorderPlaylist(chapters);
      expect(reordered[0]?.key).to.equal("01");
      expect(reordered[0]?.overlayLabel).to.equal("1");
      expect(reordered[0]?.tracks[0]?.key).to.equal("01");
      expect(reordered[0]?.tracks[0]?.overlayLabel).to.equal("1");

      expect(reordered[1]?.key).to.equal("02");
      expect(reordered[1]?.overlayLabel).to.equal("2");
      expect(reordered[1]?.tracks[0]?.key).to.equal("02");
      expect(reordered[1]?.tracks[0]?.overlayLabel).to.equal("2");
    });
  });
});
