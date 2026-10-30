# RFC 022: Developer Tools & Widget Component Gallery ("Devtools")

- **Date:** 2026-10-30
- **Status:** Proposed
- **Author:** Antigravity Agent & Andrew Nitschke
- **Related RFCs:**
  - [RFC 003: Client-Side Single-Page Application (SPA) & Routing Strategy](file:///home/anitschk/sandbox/yoto-bench/docs/rfcs/003-client-spa-and-routing-strategy.md)
  - [RFC 005: Design System & Reusable Widget Component Library](file:///home/anitschk/sandbox/yoto-bench/docs/rfcs/005-widgets-and-component-library.md)
  - [RFC 021: Project Rebranding & Naming Strategy](file:///home/anitschk/sandbox/yoto-bench/docs/rfcs/021-project-rebranding-and-naming-strategy.md)

---

## 1. Summary

This RFC specifies the architecture, routing model, access mechanism, and component gallery layout for a dedicated, "hidden" developer tools suite (**Devtools**) in `yoto-bench`.

The primary feature of Devtools is an **Isolated Component Sandbox / Widget Workbench** allowing designers and developers to inspect, stress-test, and iterate on every reusable design system primitive (`src/widgets/`) across all visual variants, interactive states (hover, focus, disabled, loading, error), theme tokens, and edge cases without needing to navigate complex application flows or trigger real backend API calls.

This document also provides a technical evaluation of our client-side routing library ([`@lit-labs/router`](https://www.npmjs.com/package/@lit-labs/router)) regarding support for nested subpages vs. top-level routes, concluding with an architecture recommendation.

---

## 2. Motivation & Problem Statement

Currently, developing or refining UI elements requires manually navigating through live views:
1. **Coupled to Application State:** Testing `<yb-button loading>` or error toasts requires either mocking API failures or temporarily hardcoding transient component state inside business logic views like `card-view.ts` or `library-view.ts`.
2. **Hidden State Variants:** Primitives like `<yb-dialog>`, `<yb-badge>`, `<yb-text-input>`, `<yb-number-input>`, and `<yb-pixel-icon>` support diverse variants (e.g. `danger`, `warning`, `indeterminate`, `invalid`, broken image fallback), yet many variants appear rarely in normal production workflows, making them prone to regressions during CSS refactoring.
3. **Lack of Design System Overview:** While `src/widgets/AGENTS.md` and `RFC 005` document the inventory in markdown, there is no live visual index or interactive playground to test theme tokens (`--yb-*`), typography scaling, or accessibility contracts (focus rings, ARIA announce regions).
4. **Third-Party Dependency Constraints:** Pulling in heavy external tooling like Storybook would add hundreds of megabytes of `node_modules`, bespoke Webpack/Vite build steps, and maintenance drag that contradicts our principle of static / serverless simplicity (RFC 001, RFC 002).

A lightweight, built-in Devtools page provides an in-app living styleguide and sandbox with zero external bundle overhead.

---

## 3. Router Capability Analysis: Does `@lit-labs/router` Support Subpages?

A key design question is whether our router easily supports nested subpages (`/devtools/widgets/:name`), or if we must flatten everything into top-level pages.

### Evaluation of `@lit-labs/router` (v0.1.x)

`@lit-labs/router` provides two core primitives:
1. **`Router` (Root Controller):** Extends `Routes`. It attaches global `click` and `popstate` listeners to the `window` and `document` to intercept browser navigation. There can only be **one** `Router` instance per application.
2. **`Routes` (Subroute / Nested Controller):** Designed specifically for child views and nested routing. It connects to the parent router via custom DOM bubbling events (`lit-routes-connected`). When a parent route pattern includes a trailing wildcard (e.g. `/devtools/*`), the parent passes the remaining tail pathname to child `Routes` controllers.

### Route Architecture Comparison

| Dimension | Option A: Native Nested Subroutes (`Routes` in subview) | Option B: Top-Level App Route with Wildcard Parameter (`/devtools/:section?/:widget?`) | Option C: Flat Top-Level Routes (`/devtools`, `/devtools-widgets`) |
| :--- | :--- | :--- | :--- |
| **URL Hierarchy** | `/devtools/widgets/buttons` | `/devtools/widgets/buttons` | `/devtools`, `/widgets-demo` |
| **Router Implementation** | Uses `Routes` child controller inside `<yb-devtools-view>` matching `/*`. | Uses a single root `Router` entry: `/devtools/:section?/:subpage?` or `/devtools/*`. | Multiple disjoint entries in root router table. |
| **Deep-linking & Reload** | Works with Netlify SPA wildcard redirect. | Works with Netlify SPA wildcard redirect. | Works with Netlify SPA wildcard redirect. |
| **Complexity & Overhead** | Requires coordinating `RoutesConnectedEvent` lifecycle in Lit child component. | **Minimal.** Single router table; parent view receives URL params or listens to history changes, rendering master-detail navigation. | Clutters root `app.ts` router table with dev-only paths. |
| **Shareable URLs** | Yes (direct link to specific widget demo). | Yes (direct link to specific widget demo). | Yes. |

### Technical Decision

**Option B (Top-Level Wildcard Route with View-Level Subpage Matching) is recommended as the primary architectural pattern, with Option A as an alternative.**

By configuring the route in `src/app.ts` as:
```typescript
{
  path: "/devtools/*",
  render: () => html`<yb-devtools-view></yb-devtools-view>`,
}
```
`<yb-devtools-view>` can inspect the relative path (`window.location.pathname.replace(/^\/devtools\/?/, "")`) or instantiate a local child `Routes` controller. This keeps `src/app.ts` clean while allowing `<yb-devtools-view>` to manage subpages (`/devtools/widgets`, `/devtools/widgets/buttons`, `/devtools/storage`, `/devtools/icons`) seamlessly.

---

## 4. Discoverability & "Hidden" Access Mechanism

Because Devtools is intended for development, debugging, and design review, it should not clutter the primary navigation header for standard end-users, but must remain effortlessly accessible without special build-time flags.

### Access Channels
1. **Direct Deep Link:** Navigating directly to `/devtools` (or `/devtools/widgets`) loads the view directly.
2. **Subtle Semi-Transparent Footer Icon:** 
   - A black and white unicode hammer and wrench symbol (`🛠`, `U+1F6E0` with text variation selector `\uFE0E` to enforce monochrome rendering: `&#x1F6E0;&#xFE0E;` or `🛠︎`) placed discreetly in the global `<footer>`.
   - **Styling:** Styled to be almost entirely transparent by default (e.g. `opacity: 0.08` to `0.12`), subtly blending into the footer background so normal users do not notice it. On `:hover` or `:focus-visible`, it smoothly transitions to full opacity (`opacity: 0.8`), revealing its purpose.
   - **Tooltip & Accessibility:** Includes a native `title="devtools"` tooltip and an accessible `aria-label="devtools"` attribute.
3. **Console Helper (Optional):** Executing `window.yotoBench?.openDevtools()` from the browser developer console.

---

## 5. Devtools Information Architecture & Views

Devtools is organized as a dashboard shell featuring a persistent sidebar with category navigation:

```
/devtools
├── /widgets (Component Sandbox & Gallery)
│   ├── /all            -> All widgets in a single scrollable showcase
│   ├── /buttons        -> <yb-button> (variants, sizes, loading, slot icons)
│   ├── /dialogs        -> <yb-dialog> (modal states, slot projection, focus trap)
│   ├── /dropdowns      -> <yb-dropdown> (option formats, badges, keyboard nav)
│   ├── /inputs         -> <yb-text-input>, <yb-number-input> (validation, steppers)
│   ├── /badges         -> <yb-badge> (status colors, chips, counter badges)
│   ├── /progress       -> <yb-progress-bar> (determinate, indeterminate, animations)
│   ├── /pixel-icons    -> <yb-pixel-icon> (presets, scale factors, broken src fallbacks)
│   ├── /toasts         -> <yb-toast>, <yb-toast-manager> (interactive dispatch sandbox)
│   └── /auth-prompts   -> <yb-please-sign-in> (empty-state configurations)
├── /state & storage    -> Inspect localStorage, OPFS cache, mock AuthSession toggles
└── /theme              -> Color tokens, dark canvas contrast tests, typography scale
```

---

## 6. Widget Component Sandbox Specification (`/devtools/widgets/*`)

Each widget subpage in the gallery adheres to a uniform structure:

### 1. Interactive Control Panel (Props Matrix)
- Live controls to toggle reactive attributes: `variant`, `size`, `disabled`, `loading`, `error`, `indeterminate`.
- Custom text fields to dynamically test slot projection (`header`, `footer`, icon slots).

### 2. State & Variant Grid
A visual showcase displaying all variant permutations side-by-side simultaneously:
- **Default / Resting**
- **Hover / Active / Focus-visible**
- **Disabled State**
- **Loading / Busy State**
- **Dark vs. Light Surface Backgrounds** (verifying WCAG AA contrast against `--yb-color-surface`, `--yb-color-surface-subtle`, and `--yb-color-surface-dark`)

### 3. Event Log & Interaction Spy
- Real-time event log panel capturing dispatched custom events (e.g. `yb-click`, `yb-change`, `yb-toast`, `yb-dialog-close`).
- Displays event payloads and timestamps to verify event contracts without cluttering the browser console.

### 4. Accessibility & Keyboard Inspection
- Visualized focus rings and tab order indicators.
- Live ARIA attribute inspector displaying active `role`, `aria-expanded`, `aria-valuenow`, and `aria-live` bindings.

---

## 7. Implementation Plan

### Step 1: Route Setup in `src/app.ts`
- Register the `/devtools/*` wildcard route in `src/app.ts`.
- Add the subtle, near-transparent monochrome `🛠︎` icon link in the global footer (`opacity: 0.1` -> `0.8` on hover/focus) with `title="devtools"` tooltip.

### Step 2: Devtools Shell (`src/views/devtools-view.ts`)
- Implement two-pane layout: responsive sidebar navigation (left) and dynamic subpage outlet (right).
- Implement subroute handling for `/devtools/widgets/:component?`.

### Step 3: Widget Demo Catalog & Pages (`src/views/devtools/`)
- Create dedicated demo modules for each widget primitive:
  - `demo-button.ts`
  - `demo-dialog.ts`
  - `demo-dropdown.ts`
  - `demo-inputs.ts`
  - `demo-badge.ts`
  - `demo-progress.ts`
  - `demo-pixel-icon.ts`
  - `demo-toast.ts`
- Group them into an "All Widgets" scrollable showcase and individual deep-linkable views.

### Step 4: Documentation & Testing
- Update `src/widgets/AGENTS.md` and `docs/ARCHITECTURE.md` referencing RFC 022 and the `/devtools/widgets` testing URL.
- Write unit tests for `<yb-devtools-view>` verifying subpage route rendering.

---

## 8. Privacy & Security Considerations

- Devtools operates entirely client-side; no telemetry or data is dispatched to external servers.
- Devtools does not expose or log real auth tokens or user card payloads unless already loaded into the client's own `localStorage`.
- In accordance with [RFC 015](file:///home/anitschk/sandbox/yoto-bench/docs/rfcs/015-privacy-first-telemetry-and-analytics.md), opening or using Devtools will never generate external analytics tracking events.
