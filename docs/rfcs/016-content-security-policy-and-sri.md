# RFC 016: Content Security Policy (CSP) & Subresource Integrity (SRI)

- **Date:** 2026-09-18
- **Status:** Accepted
- **Author:** Antigravity Agent & Andrew Nitschke

---

## 1. Summary

This proposal establishes a defense-in-depth security posture for `yoto-bench` by implementing a strict **Content Security Policy (CSP)** delivered via an HTML `<meta>` tag and enforcing **Subresource Integrity (SRI)** on compiled JavaScript and CSS assets. It explicitly prohibits `eval`, restricts external connections to approved Yoto and AWS endpoints, and binds asset loading directly to cryptographic hashes.

---

## 2. Motivation & Threat Model

As a client-side application managing audio credentials and personal Yoto libraries:
1. **Cross-Site Scripting (XSS):** We must guarantee that malicious inline or injected scripts cannot execute.
2. **CDN / Asset Tampering:** We must guarantee that compiled assets (`app-[hash].js`, `fonts-[hash].css`) cannot be altered or substituted in transit.
3. **Restricted Egress:** The browser must be prevented from exfiltrating data, restricting network connections exclusively to Yoto APIs, AWS S3/IoT brokers, and configured proxy relays.

---

## 3. Subresource Integrity (SRI) via Vite

### A. Vite Build Integration
During production compilation in GitHub Actions (`npm run build`), Vite integrates an SRI build plugin (`vite-plugin-sri`):
1. For every emitted bundle (`app-[hash].js`, `fonts-[hash].css`), the plugin computes a cryptographic digest: `sha384-...`.
2. It automatically writes the `integrity` and `crossorigin` attributes onto `<script>` and `<link>` tags within `dist/index.html`:
   ```html
   <link
     rel="stylesheet"
     href="/assets/fonts-a7b6c5d4.css"
     integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
     crossorigin="anonymous"
   />
   <script
     type="module"
     src="/assets/app-c8d9e2f1.js"
     integrity="sha384-d+7h0tO9E3Zq1cW3p4T7s2R8K5m9A6N7J1l4D2g5F8H0j3K6L9P2Q5S8U1V4X7Y0"
     crossorigin="anonymous"
   ></script>
   ```

---

## 4. Content Security Policy Specification (`<meta>` Element)

A strict Content Security Policy is injected into the `<head>` of `index.html`:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'none';
    script-src 'sha384-...';
    style-src 'self';
    font-src 'self';
    img-src 'self' data: https:;
    media-src 'self' blob: https:;
    connect-src 'self' https: wss://*.iot.eu-west-2.amazonaws.com;
    base-uri 'self';
    form-action 'none';
  "
/>
```

### Directives Breakdown:
- **`script-src 'sha384-...'` (Pure Cryptographic Hash Pinning):**
  - **No `'self'` Bypass:** Omits `'self'` in production builds. Including `'self'` would allow any arbitrary same-origin script file to execute, negating the hash restriction. Omitting `'self'` enforces that **only** scripts whose cryptographic digest matches the build-time SRI hash can execute.
  - **No `eval`:** Omits `'unsafe-eval'`. The use of `eval()`, `new Function()`, and string-based timers is completely blocked. (Lit 3 uses compiled tagged template literals and natively complies with no-eval environments).
  - **No Unsafe Inline:** Omits `'unsafe-inline'`. Only the hashed and SRI-verified `app-[hash].js` bundle can run.
- **`style-src 'self'`:** Restricts stylesheets to local self-hosted bundles (`fonts-[hash].css`) and component Shadow DOM styles.
- **`font-src 'self'`:** Restricts font files (`.woff2`) strictly to the same origin.
- **`img-src 'self' data: https:`:** Allows local icons, base64 data URIs (< 4 KB Vite inlining), Yoto official icons, and arbitrary podcast cover art thumbnails loaded over secure TLS.
- **`media-src 'self' blob: https:`:** Allows in-browser audio previews from OPFS blob URLs, Yoto media CDNs, and arbitrary podcast audio streams.
- **`connect-src 'self' https: wss://*.iot.eu-west-2.amazonaws.com;`:** Restricts network requests (`fetch` and WebSockets) to secure HTTPS endpoints and our authenticated AWS IoT MQTT broker.

---

### Architectural Rationale: Relaxing `connect-src` to `https:`

Earlier revisions of this RFC attempted to maintain a strict hostname allowlist in `connect-src` (restricting connections exclusively to `api.yotoplay.com`, `*.s3.amazonaws.com`, and `corsproxy.io`). However, supporting client-side podcast RSS ingestion and audio uploading ([RFC 008](008-audio-ingestion-zip-and-upload-concurrency.md), [RFC 010](010-podcast-rss-importer-and-card-sync.md)) required relaxing `connect-src` to permit `https:` for the following reasons:

1. **W3C CSP Fetch Semantics (`connect-src` vs `media-src`):**
   - In CSP, `media-src` exclusively applies to media elements rendered directly in the DOM (`<audio src="...">` and `<video src="...">`).
   - In `yoto-bench`, podcast episodes cannot merely be played; their audio binaries must be fetched directly by JavaScript via `fetch(ep.enclosureUrl)` in order to extract ID3 tags, stage them in OPFS, compute SHA-256 digests via Web Crypto, and stream them to Yoto's S3 storage.
   - Because these requests execute via `fetch()`, the browser strictly evaluates them against **`connect-src`**, completely bypassing `media-src`.

2. **Unbounded Diversity of Podcast Media CDNs:**
   - Podcast publishers host audio files across thousands of distinct CDNs, edge networks, and redirect trackers (e.g. `*.prxu.org`, `*.podtrac.com`, Megaphone, Libsyn, Buzzsprout, Podbean, Transistor, Simplecast, AWS CloudFront, and custom self-hosted WordPress/Nginx servers).
   - An open podcast importer cannot predict which CDN host a user's chosen RSS feed will point to. Maintaining a static hostname allowlist in `connect-src` is fundamentally brittle and breaks whenever a user enters a podcast hosted on an unlisted CDN.

3. **Infeasibility of Audio Proxying:**
   - While lightweight XML text feeds (~30–80 KB) are relayed through a CORS proxy ([RFC 009](009-cors-proxy-for-rss-feeds.md)), proxying multi-hundred-megabyte audio files is unviable: it violates third-party proxy Terms of Service, exhausts bandwidth quotas, introduces extreme latency, and contradicts our zero-server-maintenance architecture. Audio tracks must be downloaded directly by the client browser.

4. **Threat Model & Defense-in-Depth:**
   - The primary purpose of CSP in Single-Page Applications is **preventing unauthorized script execution (XSS)**. This defense is fully upheld:
     - `script-src` remains cryptographically pinned to SHA-384 hashes with zero `'unsafe-inline'` or `eval`.
     - `default-src 'none'`, `object-src 'none'`, and `form-action 'none'` prevent injection of plugins, objects, or malicious form posts.
   - Allowing `https:` in `connect-src` requires all egress traffic to use encrypted TLS connections, enabling user-directed media downloads without sacrificing the application's core XSS protections.

---

## 5. Security & Build Validation

1. **Automated CI Check:** Playwright E2E tests executing in GitHub Actions will fail if any CSP violation is reported to the browser console.
2. **No Inlined Executables:** All application logic resides strictly within the hashed ES module bundle.
