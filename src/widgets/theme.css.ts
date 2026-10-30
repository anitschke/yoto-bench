import { css } from "lit";

// ==============================================================================
// Design Tokens & Shared CSS Custom Properties
// See: docs/rfcs/005-widgets-and-component-library.md
//      docs/rfcs/017-typography-and-font-selection.md
// ==============================================================================

export const themeStyles = css`
  :root {
    /* Brand Accents */
    --yb-color-primary: #ff5c35; /* Yoto orange */
    --yb-color-primary-hover: #e04b25;
    --yb-color-primary-light: #fff2ed;
    --yb-color-surface: #ffffff;
    --yb-color-surface-subtle: #f8f9fa;
    --yb-color-surface-dark: #12161a; /* Dark canvas for pixel icon contrast */
    --yb-color-border: #e2e8f0;
    --yb-color-border-focus: #ff5c35;
    --yb-color-text: #1a202c;
    --yb-color-text-muted: #718096;
    --yb-color-text-inverse: #ffffff;

    /* Semantic Status Colors */
    --yb-color-success: #10b981;
    --yb-color-success-subtle: #ecfdf5;
    --yb-color-warning: #f59e0b;
    --yb-color-warning-subtle: #fffbeb;
    --yb-color-danger: #ef4444;
    --yb-color-danger-hover: #dc2626;
    --yb-color-danger-subtle: #fef2f2;
    --yb-color-neutral: #64748b;
    --yb-color-neutral-subtle: #f1f5f9;

    /* Typography */
    --yb-font-family:
      system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif;
    --yb-font-family-mono:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --yb-font-size-xs: 0.75rem;
    --yb-font-size-sm: 0.875rem;
    --yb-font-size-md: 1rem;
    --yb-font-size-lg: 1.125rem;
    --yb-font-size-xl: 1.25rem;
    --yb-font-size-2xl: 1.5rem;

    /* Radii */
    --yb-radius-sm: 6px;
    --yb-radius-md: 10px;
    --yb-radius-lg: 16px;
    --yb-radius-full: 9999px;

    /* Shadows */
    --yb-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --yb-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --yb-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --yb-shadow-modal: 0 20px 25px -5px rgba(0, 0, 0, 0.15);

    /* Transitions */
    --yb-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --yb-transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

// Automatically adopt theme styles into document root if running in a browser environment
if (typeof document !== "undefined") {
  try {
    if (document.adoptedStyleSheets && themeStyles.styleSheet) {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        themeStyles.styleSheet,
      ];
    }
  } catch {
    const styleEl = document.createElement("style");
    styleEl.textContent = themeStyles.cssText;
    document.head.appendChild(styleEl);
  }
}
