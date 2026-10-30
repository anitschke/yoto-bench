// ==============================================================================
// Web Crypto SHA-256 Hashing Utilities
// See: AGENTS.md, RFC 008, RFC 010, RFC 011
// ==============================================================================

/**
 * Converts a Blob, Uint8Array, or ArrayBuffer into an ArrayBuffer.
 */
async function toArrayBuffer(
  data: Blob | Uint8Array | ArrayBuffer,
): Promise<ArrayBuffer> {
  if (data instanceof Blob) {
    return await data.arrayBuffer();
  }
  if (data instanceof Uint8Array) {
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer;
  }
  return data;
}

/**
 * Computes a SHA-256 hash formatted as Base64URL without padding,
 * which matches Yoto's audio deduplication and S3 upload specifications.
 * See: pkg/yoto/upload.go (FileSHA256)
 */
export async function computeBase64UrlSha256(
  data: Blob | Uint8Array | ArrayBuffer,
): Promise<string> {
  const buffer = await toArrayBuffer(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(hashBuffer);

  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    if (b !== undefined) {
      binary += String.fromCharCode(b);
    }
  }
  const base64 = btoa(binary);

  // Convert Base64 to unpadded Base64URL
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Computes a standard hexadecimal SHA-256 hash used for content-addressable
 * asset caching (e.g. icon PNG names, bundle validation).
 */
export async function computeHexSha256(
  data: Blob | Uint8Array | ArrayBuffer,
): Promise<string> {
  const buffer = await toArrayBuffer(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(hashBuffer);

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
