import { expect } from "@open-wc/testing";
import {
  isAudioFile,
  cleanTitleFromFilename,
  sortAudioTracks,
} from "./audio-parser.js";

describe("Audio Parser Service", () => {
  describe("isAudioFile", () => {
    it("recognizes mp3, m4a, wav, ogg, aac files", () => {
      expect(isAudioFile("track01.mp3")).to.be.true;
      expect(isAudioFile("song.M4A")).to.be.true;
      expect(isAudioFile("audio.wav")).to.be.true;
      expect(isAudioFile("audio.ogg")).to.be.true;
      expect(isAudioFile("audio.aac")).to.be.true;
    });

    it("rejects non-audio files", () => {
      expect(isAudioFile("cover.jpg")).to.be.false;
      expect(isAudioFile("notes.txt")).to.be.false;
      expect(isAudioFile("archive.zip")).to.be.false;
    });
  });

  describe("cleanTitleFromFilename", () => {
    it("cleans leading track numbers and file extensions", () => {
      expect(cleanTitleFromFilename("01 - Good Morning.mp3")).to.equal(
        "Good Morning",
      );
      expect(cleanTitleFromFilename("02. The Forest.m4a")).to.equal(
        "The Forest",
      );
      expect(cleanTitleFromFilename("track_03_bedtime.mp3")).to.equal(
        "track_03_bedtime",
      );
    });
  });

  describe("sortAudioTracks", () => {
    it("sorts by disk and track number", () => {
      const files = [
        {
          name: "02.mp3",
          blob: new Blob([]),
          metadata: { title: "Two", diskNumber: 1, trackNumber: 2 },
        },
        {
          name: "01.mp3",
          blob: new Blob([]),
          metadata: { title: "One", diskNumber: 1, trackNumber: 1 },
        },
        {
          name: "d2_01.mp3",
          blob: new Blob([]),
          metadata: { title: "Disk 2 One", diskNumber: 2, trackNumber: 1 },
        },
      ];

      const sorted = sortAudioTracks(files);
      expect(sorted[0]?.metadata?.title).to.equal("One");
      expect(sorted[1]?.metadata?.title).to.equal("Two");
      expect(sorted[2]?.metadata?.title).to.equal("Disk 2 One");
    });
  });
});
