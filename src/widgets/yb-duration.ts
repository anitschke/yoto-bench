// ==============================================================================
// Accessible Audio & Media Duration Widget (<yb-duration>)
// See: AGENTS.md, src/widgets/AGENTS.md, docs/rfcs/005-widgets-and-component-library.md
// ==============================================================================

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

export type DurationFormat = "standard" | "human";

/**
 * Formats a duration in seconds into an ISO 8601 duration string (e.g. PT1H15M30S).
 */
export function formatIsoDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "PT0S";
  }

  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  let iso = "PT";
  if (hours > 0) iso += `${hours}H`;
  if (minutes > 0) iso += `${minutes}M`;
  if (seconds > 0 || (hours === 0 && minutes === 0)) iso += `${seconds}S`;

  return iso;
}

/**
 * Formats a duration in seconds into standard MM:SS or H:MM:SS format.
 */
export function formatStandardDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00";
  }

  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const paddedSeconds = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    const paddedMinutes = minutes.toString().padStart(2, "0");
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

/**
 * Formats a duration in seconds into human-readable compact format (e.g. "1h 15m", "3m 5s", "42s").
 */
export function formatHumanDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0s";
  }

  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * `<yb-duration>`
 * Semantic, accessible display component for audio track and podcast durations.
 * Wraps output in a semantic <time datetime="PT..."> element for WAI-ARIA and screen readers.
 */
@customElement("yb-duration")
export class YbDuration extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      font-variant-numeric: tabular-nums;
    }

    time {
      color: inherit;
      font-family: inherit;
      font-size: inherit;
    }
  `;

  /**
   * Total duration in seconds.
   */
  @property({ type: Number })
  seconds = 0;

  /**
   * Display format:
   * - 'standard': MM:SS or H:MM:SS (default)
   * - 'human': '1h 15m', '3m 5s', '45s'
   */
  @property({ type: String })
  format: DurationFormat = "standard";

  override render() {
    const iso = formatIsoDuration(this.seconds);
    const text =
      this.format === "human"
        ? formatHumanDuration(this.seconds)
        : formatStandardDuration(this.seconds);

    return html`<time datetime=${iso}>${text}</time>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "yb-duration": YbDuration;
  }
}
