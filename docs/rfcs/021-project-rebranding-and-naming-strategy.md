# RFC 021: Project Rebranding & Naming Strategy

- **Date:** 2026-10-15
- **Status:** Accepted
- **Author:** Antigravity Agent & Andrew Nitschke

---

## 1. Summary

The project was originally bootstrapped under the working name `yoto-tools` (`yoto-tools.netlify.app`, GitHub repo `anitschke/yoto-tools`). However, an active open-source community project already exists under the name [**`trywait/YotoTools`**](https://github.com/trywait/YotoTools). To avoid brand confusion, goodwill dilution, or stepping on prior community claims ("trademark" and mindshare), the project is officially rebranded as **`yoto-kit`** (**`YotoKit`**).

This RFC documents the naming criteria, candidate evaluation, web clearance checks, the adoption of the **`yk-`** component and token prefix, and the step-by-step implementation plan for migrating the codebase, packages, URLs, and documentation.

---

## 2. Motivation & Problem Statement

1. **Brand & Namespace Collision:** Searching for "Yoto Tools" or "yoto-tools" surfaces `trywait/YotoTools`. Having two separate projects in the Yoto maker/hacker community with virtually identical names causes confusion for users seeking support, reporting bugs, or discovering features.
2. **Third-Party Ecosystem Etiquette:** While "Yoto" is a registered trademark of Yoto Limited, community projects typically use descriptive or compound names (e.g., `yotoicons`, `yoto-tools`). Adopting a unique name prevents inter-project friction within the community.
3. **Official Trademark Boundary:** Yoto Limited owns names like `Yoto`, `Yoto Player`, `Yoto Mini`, `Yoto Club`, `Yoto Space`, and has used names like `Yoto Labs` internally or for pilot initiatives. Our name should clarify that this is an independent, community-driven power-tool suite rather than an official Yoto Limited product.

---

## 3. Naming Criteria & Principles

A strong candidate should satisfy the following criteria:

- **Retains "Yoto" association:** Needs to be immediately recognizable to Yoto owners, parents, and community creators (contains `yoto` either as prefix, suffix, or portmanteau).
- **Short & Punchy:** Preferably 2 syllables or a concise compound word (e.g., `yoto-craft`, `yoto-kit`, `yoto-deck`).
- **Descriptive of Capability:** Reflects the app's identity as a client-side suite for MYO card authoring, track mastering, pixel icon curation, RSS podcast syndication, and device controls.
- **Available Namespace:** Clean or low-collision on GitHub, Netlify subdomains, and optionally npm / domain TLDs.
- **Distinct from Official Services:** Avoids collisions with official Yoto portals (`yoto.space`, `yotoplay.com`, `yoto-labs`).

---

## 4. Candidate Names & Analysis

Here are curated candidate names organized by theme, along with pros, cons, and domain/slug feasibility:

### Category A: The "Workbench / Maker / Utility" Names
*Highlighting creation, tinkering, crafting, and power-user utilities.*

1. **`yoto-craft` / `YotoCraft`**
   - **Vibe:** Creative, tactile, playful; mirrors crafting physical and digital MYO cards.
   - **Pros:** Very intuitive, rolls off the tongue, evokes the physical card-making experience.
   - **Cons:** Slight Minecraft association for younger kids, though distinct in this context.
   - **Subdomain:** `yotocraft.netlify.app` / `yoto-craft.netlify.app`.

2. **`yoto-kit` / `YotoKit`**
   - **Vibe:** Compact, modular toolkit; developer- and maker-friendly.
   - **Pros:** Ultra-short (7 letters), clean, professional, mirrors developer toolkits like `Webkit` or `HomeKit`.
   - **Cons:** "Kit" is sometimes associated with physical hardware boxes.
   - **Subdomain:** `yotokit.netlify.app`.

3. **`yoto-forge` / `YotoForge`**
   - **Vibe:** Heavy-duty creation, building, mastering cards and audio feeds.
   - **Pros:** Strong power-user connotation; sounds robust and capable.
   - **Cons:** Slightly heavier / more industrial tone than the typical cozy Yoto aesthetic.
   - **Subdomain:** `yotoforge.netlify.app`.

4. **`yoto-deck` / `YotoDeck`**
   - **Vibe:** Direct reference to cards ("deck of cards") as well as an audio/DJ tape deck or control deck.
   - **Pros:** Clever double meaning—both a deck of cards and a playback/control deck. Very relevant to Yoto's physical card format.
   - **Cons:** Could be mistaken for a physical hardware accessory (like a Steam Deck or Elgato Stream Deck).
   - **Subdomain:** `yotodeck.netlify.app`.

5. **`yoto-bench` / `YotoBench`**
   - **Vibe:** The maker's workbench for tinkering with cards, audio, and pixel art.
   - **Pros:** Humble, functional, friendly open-source tone.
   - **Cons:** Less playful.
   - **Subdomain:** `yotobench.netlify.app`.

---

### Category B: The "Card / Studio / Hub" Names
*Focusing on the creative studio aspect (audio editing, pixel art, playlists).*

6. **`yoto-studio` / `YotoStudio`**
   - **Vibe:** Complete creative suite for audio, icons, and card production.
   - **Pros:** Broad and comprehensive; encompasses cards, audio tags, icons, and player telemetry.
   - **Cons:** Might sound official or commercial; potentially checked or reserved by Yoto.
   - **Subdomain:** `yotostudio.netlify.app`.

7. **`card-smith` (or `yoto-cardsmith` / `YotoCardSmith`)**
   - **Vibe:** Master craftsman hand-forging custom cards.
   - **Pros:** Evocative, memorable, centers on the card creation workflow.
   - **Cons:** Longer if prefixed with `yoto-`; without `yoto-` it loses instant Yoto brand association.
   - **Subdomain:** `yotocardsmith.netlify.app`.

8. **`yoto-hub` / `YotoHub`**
   - **Vibe:** Central station connecting cards, icons, podcasts, and devices.
   - **Pros:** Short, clear, community-centric.
   - **Cons:** Generic; might have collisions on GitHub.
   - **Subdomain:** `yotohub.netlify.app`.

---

### Category C: The "Pixel / Play / Companion" Names
*Reflecting the 16x16 pixel display, playful nature, and client-side device companion role.*

9. **`yoto-companion` / `YotoCompanion`**
   - **Vibe:** The unofficial power-user companion app to the official Yoto app.
   - **Pros:** Clearly communicates its purpose as an auxiliary companion tool; respectful of official boundaries.
   - **Cons:** Longer word (4 syllables).
   - **Subdomain:** `yotocompanion.netlify.app`.

10. **`yoto-station` / `YotoStation`**
    - **Vibe:** Audio station, broadcast station, docking hub.
    - **Pros:** Friendly, evocative of storytelling and radio/audio broadcasts.
    - **Cons:** Slightly longer.
    - **Subdomain:** `yotostation.netlify.app`.

11. **`yoto-works` / `YotoWorks`**
    - **Vibe:** Workshop / creative works.
    - **Pros:** Classic maker brand styling (like "Smallworks", "Metalworks"). Short and punchy.
    - **Cons:** Might sound slightly corporate.
    - **Subdomain:** `yotoworks.netlify.app`.

12. **`yoto-suite` / `YotoSuite`**
    - **Vibe:** All-in-one software suite.
    - **Pros:** Highlights that this isn't just one script, but a full app containing editor, icon search, podcast sync, and remote control.
    - **Cons:** A bit traditional/formal.
    - **Subdomain:** `yotosuite.netlify.app`.

13. **`pixel-yoto` / `PixelYoto`**
    - **Vibe:** Distinctive nod to the iconic 16x16 display and pixel art.
    - **Pros:** Fun, visual, stands out.
    - **Cons:** Suggests the app is *only* about pixel icons, neglecting the audio and playlist features.

14. **`yoto-maker` / `YotoMaker`**
    - **Vibe:** Specifically for the "Make Your Own" (MYO) community.
    - **Pros:** Directly resonates with the MYO card community.
    - **Cons:** Could be confused with Yoto's own MYO branding or physical card makers.

---

## 5. Web & Namespace Clearance Analysis for `yoto-kit`

A thorough web and registry clearance check was conducted:

1. **GitHub (`github.com`):**
   - No active or colliding repositories exist for `yoto-kit` or `yotokit`.
   - Existing community projects use different names: `xkjq/yoto-up`, `bbenkle/YotoBookMaker`, `cdnninja/yoto_api`, `trywait/YotoTools`.
   - `github.com/anitschke/yoto-kit` is completely free to create or rename to.
2. **npm Registry (`npmjs.com`):**
   - The package names `yoto-kit` and `yotokit` are unallocated and available on npm. (Official Yoto packages use `@yotoplay/yoto-sdk`, `@yotoplay/yotolabs-sdk`, `@yotoplay/twee2yoto`).
3. **Netlify Subdomains:**
   - Both `yotokit.netlify.app` and `yoto-kit.netlify.app` return 404 and are available for registration.
4. **General Web / Search Landscape:**
   - In physical searches, "Yoto Kit" is occasionally used colloquially by local public libraries (e.g. "Library of Things" checkout kits containing a physical Yoto Player + headphones + cards).
   - There is no competing software product, web app, or organization using `yoto-kit` / `YotoKit`.

---

## 6. Migration & Renaming Implementation Plan

With **`yoto-kit`** as the chosen target name and **`yk`** as the component/design-token prefix:

1. **Repository & Remotes:**
   - Rename GitHub repository (`anitschke/yoto-tools` $\rightarrow$ `anitschke/yoto-kit`). GitHub provides automatic HTTP redirects for repos, but git remotes, clone URLs, and CI secrets will be updated.
2. **Package & Manifests:**
   - Update `package.json` (`"name": "yoto-kit"`).
   - Update `package-lock.json`.
3. **Domain & Netlify Deployments:**
   - Provision `yoto-kit.netlify.app` (or `yotokit.netlify.app`).
   - Update Netlify OAuth callback redirects (per [RFC 007](docs/rfcs/007-oauth-client-id-and-pr-preview-redirects.md)).
4. **HTML Meta & Web App Manifest:**
   - Update `<title>YotoKit - Unofficial Yoto Power Tools</title>`.
   - Update OpenGraph tags and meta descriptions in `index.html`.
   - Update Web App Manifest (`manifest.json` / PWA configuration) with name "YotoKit".
5. **Widget & CSS Prefixes (`yt-` $\rightarrow$ `yk-`):**
   - Migrate custom element tags from `<yt-*>` to `<yk-*>` (e.g. `<yk-button>`, `<yk-pixel-icon>`, `<yk-dialog>`, `<yk-dropdown>`, `<yk-toast>`).
   - Rename widget files in `src/widgets/` (e.g. `src/widgets/yk-button.ts`, `src/widgets/yk-button.test.ts`).
   - Update CSS custom property tokens from `--yt-*` to `--yk-*` (e.g. `--yk-color-primary`, `--yk-radius-md`, `--yk-font-pixel`).
   - Update documentation in [`src/widgets/AGENTS.md`](file:///home/anitschk/sandbox/yoto-tools/src/widgets/AGENTS.md).
6. **Documentation & RFCs:**
   - Update references in `README.md`, `ARCHITECTURE.md`, `AGENTS.md`, and existing RFCs.

## 7. Accepted Decisions

1. **Official Name:** **`yoto-kit`** / **`YotoKit`**
   - Canonical repository slug: `yoto-kit` (`github.com/anitschke/yoto-kit`).
   - Production web host: `yoto-kit.netlify.app`.
   - Title / Display brand: **YotoKit** ("The Unofficial Power Tools for Yoto").
2. **Component & Design Token Prefix:** **`yk-`**
   - Widgets: `<yk-button>`, `<yk-pixel-icon>`, `<yk-dialog>`, `<yk-dropdown>`, `<yk-toast>`, etc.
   - Design tokens: `--yk-color-primary`, `--yk-font-pixel`, `--yk-radius-md`, etc.
   - Widget catalog and documentation updated in `src/widgets/AGENTS.md`.
3. **Execution Strategy:**
   - Execute the migration on a dedicated branch once infrastructure review on `anitschke/infrastructureImplementation` is completed.
