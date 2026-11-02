import { expect } from "@open-wc/testing";
import { UploadQueue, reorderPlaylist, UploadItem } from "./upload-queue.js";
import { Chapter } from "../models/index.js";
import { yotoApi } from "../api/client.js";

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

  describe("UploadQueue", () => {
    let origGetUploadUrl: typeof yotoApi.getUploadUrl;
    let origUploadFileToS3: typeof yotoApi.uploadFileToS3;
    let origPollTranscode: typeof yotoApi.pollTranscode;

    beforeEach(() => {
      origGetUploadUrl = yotoApi.getUploadUrl;
      origUploadFileToS3 = yotoApi.uploadFileToS3;
      origPollTranscode = yotoApi.pollTranscode;
    });

    afterEach(() => {
      yotoApi.getUploadUrl = origGetUploadUrl;
      yotoApi.uploadFileToS3 = origUploadFileToS3;
      yotoApi.pollTranscode = origPollTranscode;
    });

    it("processes deduplicated files by skipping S3 upload", async () => {
      let s3UploadCalled = false;
      yotoApi.getUploadUrl = async () => ({
        upload: { uploadId: "up_dedup_1" }, // No uploadUrl => deduplicated
      });
      yotoApi.uploadFileToS3 = async () => {
        s3UploadCalled = true;
      };
      yotoApi.pollTranscode = async () => ({
        transcodedSha256: "sha_dedup_1",
        transcodedInfo: { duration: 150, fileSize: 1000 },
      });

      const queue = new UploadQueue(2);
      const files = [
        {
          name: "bedtime.mp3",
          blob: new Blob(["audio-bytes"], { type: "audio/mp3" }),
          metadata: { title: "Bedtime Story", trackNumber: 1, duration: 150 },
        },
      ];

      const chapters = await queue.processQueue(files);

      expect(s3UploadCalled).to.be.false;
      expect(chapters.length).to.equal(1);
      expect(chapters[0]?.title).to.equal("Bedtime Story");
      expect(chapters[0]?.tracks[0]?.trackUrl).to.equal("yoto:#sha_dedup_1");
    });

    it("uploads new files to S3 when uploadUrl is returned", async () => {
      let uploadedToS3 = false;
      yotoApi.getUploadUrl = async () => ({
        upload: {
          uploadId: "up_new_1",
          uploadUrl: "https://s3.yotoplay.com/presigned",
        },
      });
      yotoApi.uploadFileToS3 = async (url) => {
        if (url === "https://s3.yotoplay.com/presigned") {
          uploadedToS3 = true;
        }
      };
      yotoApi.pollTranscode = async () => ({
        transcodedSha256: "sha_new_1",
        transcodedInfo: { duration: 200, fileSize: 2000 },
      });

      const queue = new UploadQueue(2);
      const files = [
        {
          name: "new_track.mp3",
          blob: new Blob(["new-audio-bytes"], { type: "audio/mp3" }),
        },
      ];

      const chapters = await queue.processQueue(files);

      expect(uploadedToS3).to.be.true;
      expect(chapters.length).to.equal(1);
      expect(chapters[0]?.tracks[0]?.trackUrl).to.equal("yoto:#sha_new_1");
    });

    it("respects concurrency limit when processing multiple files", async () => {
      let activeConcurrency = 0;
      let maxSeenConcurrency = 0;

      yotoApi.getUploadUrl = async () => {
        activeConcurrency++;
        maxSeenConcurrency = Math.max(maxSeenConcurrency, activeConcurrency);
        await new Promise((r) => setTimeout(r, 20));
        activeConcurrency--;
        return {
          upload: { uploadId: "up_concurrent", uploadUrl: "https://s3/test" },
        };
      };

      yotoApi.uploadFileToS3 = async () => {
        activeConcurrency++;
        maxSeenConcurrency = Math.max(maxSeenConcurrency, activeConcurrency);
        await new Promise((r) => setTimeout(r, 20));
        activeConcurrency--;
      };

      yotoApi.pollTranscode = async () => ({
        transcodedSha256: "sha_done",
      });

      const queue = new UploadQueue(2); // Concurrency limit = 2
      const files = Array.from({ length: 6 }, (_, i) => ({
        name: `track_${i}.mp3`,
        blob: new Blob([`bytes_${i}`], { type: "audio/mp3" }),
      }));

      const chapters = await queue.processQueue(files);
      expect(chapters.length).to.equal(6);
      expect(maxSeenConcurrency).to.be.at.most(2);
    });

    it("reports progress updates through onProgress callback", async () => {
      yotoApi.getUploadUrl = async () => ({
        upload: { uploadId: "up_1", uploadUrl: "https://s3/test" },
      });
      yotoApi.uploadFileToS3 = async (_url, _blob, _ct, onProgress) => {
        if (onProgress) {
          onProgress(50);
          onProgress(100);
        }
      };
      yotoApi.pollTranscode = async () => ({
        transcodedSha256: "sha_done",
      });

      const progressUpdates: UploadItem[][] = [];
      const queue = new UploadQueue(1);
      await queue.processQueue(
        [{ name: "test.mp3", blob: new Blob(["data"]) }],
        (items) => {
          progressUpdates.push([...items]);
        },
      );

      expect(progressUpdates.length).to.be.greaterThan(2);
      const last = progressUpdates[progressUpdates.length - 1];
      expect(last?.[0]?.status).to.equal("complete");
      expect(last?.[0]?.progress).to.equal(100);
    });
  });
});
