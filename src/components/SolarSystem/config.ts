import type { CSSProperties } from "react";
import { MAX_ORBIT } from "../../data/planets";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Layout (used directly in SVG coordinate math)                              */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Gap from the outermost orbit circle to the SVG viewBox edge (SVG units).
 * viewW = 2 × (MAX_ORBIT + marginX), viewH = 2 × (MAX_ORBIT + marginY).
 */
export const ORBIT_VIEW = {
  marginX: 56,
  marginY: 56,
} as const;

export const LAYOUT = {
  viewW: 2 * (MAX_ORBIT + ORBIT_VIEW.marginX),
  viewH: 2 * (MAX_ORBIT + ORBIT_VIEW.marginY),

  /** Distance from the bottom of a planet's circle to the top of its name. */
  labelOffset: 8,

  /** Extra radius for planet click targets on small bodies (SVG units). */
  clickPad: 8,
  /** Minimum click-target radius regardless of planet size (SVG units). */
  clickMinRadius: 14,
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Outer ring halo — radius gap (halo r = body r + offset, in SVG units)       */
/* ─────────────────────────────────────────────────────────────────────────── */

export const RING = {
  /** Gap between a planet circle and its hover/selected halo. */
  offset: 5,
  /** Sun uses a slightly larger gap. */
  sunOffset: 12,
} as const;

export const SUN_CX = LAYOUT.viewW / 2;
export const SUN_CY = LAYOUT.viewH / 2;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Umbra (rectangular gradient shadow behind each planet)                     */
/* ─────────────────────────────────────────────────────────────────────────── */

export const UMBRA = {
  /** Minimum length in SVG units. */
  minLength: 80,
  /** Length per unit of planet radius. Final length = max(minLength, radius * factor). */
  radiusFactor: 8,

  /** Gradient colour at the planet edge (darkest). */
  startColor: "rgba(0, 0, 0, 0.2)",
  startOpacity: 0.42,
  /** Gradient colour at the far end (fully transparent). */
  endColor: "rgba(31, 31, 31, 0)",
  endOpacity: 0,
} as const;

export const umbraLengthFor = (radius: number): number =>
  Math.max(UMBRA.minLength, radius * UMBRA.radiusFactor);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Tracking mode (camera follow + zoom on a selected planet)                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export const TRACKING = {
  /** Target apparent planet radius (in viewBox units) when tracking. Smaller
   *  planets are zoomed more, so they appear at this consistent visible size. */
  targetApparentRadius: 60,
  /** Hard floor on zoom factor (1 = no zoom). */
  minZoom: 1.5,
  /** Hard ceiling on zoom factor. */
  maxZoom: 9,

  /** Per-frame easing factor for the viewport centre (0..1). */
  panEase: 0.14,
  /** Per-frame easing factor for the zoom level (0..1). */
  zoomEase: 0.09,
  /** Snap threshold — once we're within this distance / zoom delta, lock on. */
  snapEpsilon: 0.01,
} as const;

export const zoomFor = (radius: number): number =>
  Math.min(
    TRACKING.maxZoom,
    Math.max(TRACKING.minZoom, TRACKING.targetApparentRadius / radius)
  );

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Visual tokens (consumed by SolarSystem.module.scss via CSS vars)           */
/*                                                                             */
/*  These are applied to the stage element via `stageStyle` and referenced     */
/*  in SCSS as `var(--ss-*)`. Changing a value here updates the whole view.    */
/* ─────────────────────────────────────────────────────────────────────────── */

export const stageStyle: CSSProperties = {
  /* Orbits */
  "--ss-orbit-stroke": "rgba(255, 255, 255, 1)",
  "--ss-orbit-width": "1px",
  "--ss-orbit-dash": "2 5",

  /* Planet outline (faint border around each circle) */
  "--ss-planet-outline-color": "var(--line)",
  "--ss-planet-outline-width": "1px",
  "--ss-planet-outline-opacity": "0.35",

  /* Outer ring halo (hover + selected) */
  "--ss-ring-fill": "white",
  "--ss-ring-opacity-hover": "0.2",
  "--ss-ring-opacity-selected": "0.3",
  /* Halo radius = body radius + offset (SVG units; see `RING` for TSX math) */
  "--ss-ring-offset": `${RING.offset}`,
  "--ss-ring-sun-offset": `${RING.sunOffset}`,

  /* Night-side semicircle on the planet */
  "--ss-night-fill": "rgba(31, 31, 31, 0.5)",

  /* Label */
  "--ss-label-color": "var(--ink-soft)",
  "--ss-label-color-active": "var(--ink)",
  "--ss-label-size": "12px",
  "--ss-label-weight": "500",
  "--ss-label-spacing": "0.14em",

  /* Sun centre label */
  "--ss-sun-label-color": "var(--paper)",
  "--ss-sun-label-size": "11px",
  "--ss-sun-label-spacing": "0.22em",

  /* Transitions */
  "--ss-transition": "200ms ease",
} as CSSProperties;
