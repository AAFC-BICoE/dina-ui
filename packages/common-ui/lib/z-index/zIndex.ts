/**
 * Global z-index layers, lowest to highest.
 *
 * Use these for anything that stacks against other parts of the page. Small literals (-1 to 20) are fine inside a single component.
 *
 * **Important:** Keep in sync with `z-index.css`. `zIndex.test.ts` checks this.
 */
export const Z_INDEX = {
  /** Sticky bars and columns inside page content. */
  sticky: 100,

  /** Sticky section navigation (e.g. material sample form nav). */
  stickyNav: 1030,

  /** Sticky top button bar. */
  buttonBar: 1045,

  /** Full-screen overlays (full-screen table, full-screen loading). */
  overlay: 1050,

  /** Item being dragged. */
  dragging: 1100,

  /** Modal dialogs. */
  modal: 3000,

  /** All dropdown menus (react-select `menu`/`menuPortal`, nav, popovers). Sits above modals. */
  dropdown: 9000,

  /** Tooltips, including those on dropdown options. */
  tooltip: 9100,

  /** Toast notifications. Sits above everything. */
  toast: 10000
} as const;
