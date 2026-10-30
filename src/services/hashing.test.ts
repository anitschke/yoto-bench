import { expect } from "@open-wc/testing";
import { computeBase64UrlSha256, computeHexSha256 } from "./hashing.js";

describe("Hashing Service", () => {
  const sampleText = "Hello Yoto Player!";
  const sampleBytes = new TextEncoder().encode(sampleText);

  it("computes standard SHA-256 hex string", async () => {
    const hex = await computeHexSha256(sampleBytes);
    expect(hex).to.be.a("string");
    expect(hex.length).to.equal(64);
  });

  it("computes unpadded Base64URL SHA-256 matching Yoto audio upload spec", async () => {
    const b64url = await computeBase64UrlSha256(sampleBytes);
    expect(b64url).to.be.a("string");
    expect(b64url).not.to.include("=");
    expect(b64url).not.to.include("+");
    expect(b64url).not.to.include("/");
  });

  it("works with Blobs", async () => {
    const blob = new Blob([sampleBytes]);
    const hex = await computeHexSha256(blob);
    const b64url = await computeBase64UrlSha256(blob);
    expect(hex.length).to.equal(64);
    expect(b64url.length).to.be.greaterThan(20);
  });
});
