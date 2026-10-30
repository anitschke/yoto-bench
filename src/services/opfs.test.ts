import { expect } from "@open-wc/testing";
import { OpfsStagingService } from "./opfs.js";

describe("OPFS Staging Service", () => {
  let staging: OpfsStagingService;

  beforeEach(() => {
    staging = new OpfsStagingService();
  });

  afterEach(async () => {
    await staging.clearAll();
  });

  it("saves, lists, and retrieves staged files", async () => {
    const sessionKey = "test_card_session";
    const sampleBlob = new Blob(["test audio content"], {
      type: "audio/mpeg",
    });

    await staging.saveFile(sessionKey, "track1.mp3", sampleBlob);

    const files = await staging.listFiles(sessionKey);
    expect(files).to.include("track1.mp3");

    const retrieved = await staging.getFile(sessionKey, "track1.mp3");
    expect(retrieved).to.exist;
    expect(await retrieved?.text()).to.equal("test audio content");
  });

  it("cleans up session files", async () => {
    const sessionKey = "test_cleanup_session";
    const sampleBlob = new Blob(["content"]);

    await staging.saveFile(sessionKey, "track1.mp3", sampleBlob);
    await staging.cleanSession(sessionKey);

    const files = await staging.listFiles(sessionKey);
    expect(files.length).to.equal(0);
  });
});
