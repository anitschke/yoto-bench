# RFC 021: Project Rebranding & Naming Strategy

- **Date:** 2026-10-15
- **Status:** Proposed
- **Author:** Antigravity Agent & Andrew Nitschke

---

## 1. Summary

The project was originally bootstrapped under the working name `yoto-tools` (`yoto-tools.netlify.app`, GitHub repo `anitschke/yoto-tools`). However, an active open-source community project already exists under the name [**`trywait/YotoTools`**](https://github.com/trywait/YotoTools). To avoid brand confusion, goodwill dilution, or stepping on prior community claims ("trademark" and mindshare), we need to select a distinct, memorable, and short new name that retains clear association with the Yoto ecosystem while standing out on its own.

This RFC outlines naming criteria, evaluates a curated list of candidate names, explores potential prefix/suffix variations, and provides an implementation checklist for renaming the codebase, packages, URLs, and documentation.

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

## 5. Top Recommendations & Comparison Matrix

| Candidate | Length / Brevity | Evocative / Meaning | Collision Risk | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **`yoto-craft`** | Short (9 chars) | High (MYO crafting, hands-on) | Low | **Top Pick (Playful & Maker-oriented)** |
| **`yoto-kit`** | Very Short (7 chars)| High (toolkit, utilities) | Low | **Top Pick (Clean & Developer-friendly)** |
| **`yoto-deck`** | Very Short (8 chars)| High (deck of cards + audio deck) | Low | **Top Pick (Clever double entendre)** |
| **`yoto-studio`**| Moderate (10 chars)| High (all-in-one creation suite) | Medium | Strong contender if not official |
| **`yoto-works`** | Short (9 chars) | Moderate (workshop) | Low | Solid runner-up |

---

## 6. Migration & Renaming Implementation Plan

Once the final name is chosen, the rename requires touching the following surfaces:

1. **Repository & Remotes:**
   - Rename GitHub repository (`anitschke/yoto-tools` $\rightarrow$ `anitschke/<new-name>`). GitHub sets up automatic HTTP redirects for repos, but remotes and CI secrets should be updated.
2. **Package & Manifests:**
   - Update `package.json` (`"name": "<new-name>"`).
   - Update `package-lock.json`.
3. **Domain & Netlify Deployments:**
   - Update Netlify site name / subdomain (`<new-name>.netlify.app`).
   - Update Netlify OAuth callback redirects (per [RFC 007](docs/rfcs/007-oauth-client-id-and-pr-preview-redirects.md)).
4. **HTML Meta & Manifest:**
   - Update `<title>`, OpenGraph tags, and meta description in `index.html`.
   - Update Web App Manifest (`manifest.json` / PWA configuration).
5. **Widget & CSS Prefixes:**
   - *Decision:* Keep `--yt-` and `yt-*` widget prefixes intact! `yt` stands for "Yoto", which remains accurate regardless of the suffix name (e.g., `<yt-button>`, `<yt-pixel-icon>` still make 100% sense).
6. **Documentation & RFCs:**
   - Update references in `README.md`, `ARCHITECTURE.md`, `AGENTS.md`, and existing RFCs via a focused cleanup commit.

---

## 7. Open Questions for Discussion

1. Do you prefer a functional/developer vibe (e.g., **`yoto-kit`**), a maker/crafting vibe (e.g., **`yoto-craft`**), or a card/audio-specific pun (e.g., **`yoto-deck`**)?
2. Would you prefer hyphenated (`yoto-craft`) or single-word (`yotocraft`) as the canonical repository/URL slug?
3. Are there any other specific keywords or metaphors (e.g. tape, cassette, player, track) you would like considered?
