import _ from "lodash";

/** How many levels are shown on load, and added by each (+) click. */
export const HIERARCHY_LEVELS = 5;

export interface HierarchyNode {
  id: string;
  name: string;
  materialSampleType?: string;
  materialSampleState?: string;
  preparationType?: string;
  storageUnit?: string;
}

export interface HierarchyData {
  current: HierarchyNode;
  /** Loaded ancestors, parent first. */
  ancestors: HierarchyNode[];
  /** Number of ancestors in the whole lineage, loaded or not. */
  ancestorTotal: number;
  /** Loaded children by parent id. */
  children: Record<string, HierarchyNode[]>;
  /** Direct child count of nodes whose children are not loaded yet. */
  unloadedChildCount: Record<string, number>;
}

type FormatMessage = (id: any, values?: Record<string, any>) => string;

const NAVY = "#335075";
const MUTED = "#6c757d";
const BORDER = "#dee2e6";
const DESTROYED_BORDER = "#adb5bd";

export const TYPE_COLOR: Record<string, string> = {
  WHOLE_ORGANISM: NAVY,
  ORGANISM_PART: "#117c8d",
  MOLECULAR_SAMPLE: "#61a1fe",
  OTHER: "#adb5bd"
};

export const HIERARCHY_FONT =
  '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

const CARD_ROW_HEIGHT = 76;
const COLUMN_WIDTH = 290;
// Cards hang to the right of their node, so the right margin must fit a whole card (196 + padding + border).
const MARGIN_RIGHT = 230;
// Room for the "{n} more" label left of the topmost (+), with French headroom.
const MARGIN_LEFT = 90;

export const dotKey = (type?: string) =>
  type && TYPE_COLOR[type] ? type : "OTHER";

export const isDestroyed = (state?: string) =>
  state?.toLowerCase() === "destroyed";

const RICH = {
  id: {
    color: "#333",
    fontWeight: 600,
    fontSize: 13,
    fontFamily: HIERARCHY_FONT,
    lineHeight: 20
  },
  idMuted: {
    color: MUTED,
    fontWeight: 600,
    fontSize: 13,
    fontFamily: HIERARCHY_FONT,
    lineHeight: 20
  },
  t: { color: MUTED, fontSize: 12, fontFamily: HIERARCHY_FONT, lineHeight: 18 },
  ..._.mapValues(
    _.mapKeys(TYPE_COLOR, (_c, k) => `d_${k}`),
    (color) => ({
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: color
    })
  )
};

const svgSymbol = (inner: string) =>
  "image://data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="11.5" fill="#fff" stroke="${BORDER}"/>${inner}</svg>`
  );

const PLUS_SYMBOL = svgSymbol(
  `<path d="M12 7v10M7 12h10" stroke="${NAVY}" stroke-width="2.5" stroke-linecap="round"/>`
);
// shortcut: canvas can't animate, so the "spinner" is a static ellipsis.
const LOADING_SYMBOL = svgSymbol(
  `<g fill="${MUTED}"><circle cx="7" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="17" cy="12" r="1.6"/></g>`
);

// Rich text can't escape "}", so drop braces from user-entered text.
const richSafe = (text: string) => text.replace(/[{}]/g, "");

/**
 * Builds the ECharts tree option for the lineage, plus the size the chart needs.
 *
 * @param loading ids of (+) expanders that are loading: "up" or the parent id.
 */
export function buildHierarchyOption(
  data: HierarchyData,
  formatMessage: FormatMessage,
  loading: ReadonlySet<string> = new Set()
) {
  const typesPresent = new Set<string>();
  let hasDestroyed = false;

  const card = (node: HierarchyNode) => {
    const isCurrent = node.id === data.current.id;
    const destroyed = isDestroyed(node.materialSampleState);
    const type = dotKey(node.materialSampleType);
    typesPresent.add(type);
    hasDestroyed = hasDestroyed || destroyed;

    const sub =
      (node.storageUnit ?? formatMessage("noStorageUnit")) +
      (destroyed ? ` · ${formatMessage("destroyedLabel")}` : "");

    return {
      id: node.id,
      name: node.name,
      raw: node,
      label: {
        show: true,
        position: "inside",
        backgroundColor: "#fff",
        borderRadius: 6,
        padding: [8, 12],
        width: 196,
        align: "left",
        overflow: "truncate",
        rich: RICH,
        borderColor: isCurrent ? NAVY : destroyed ? DESTROYED_BORDER : BORDER,
        borderWidth: isCurrent ? 2 : 1,
        borderType: destroyed ? "dashed" : "solid",
        formatter:
          `{${destroyed ? "idMuted" : "id"}|${richSafe(node.name)}}\n` +
          `{d_${type}|}{t|  ${richSafe(sub)}}`
      }
    };
  };

  const expander = (
    direction: "up" | "down",
    parentId: string,
    count: number
  ) => ({
    name: "",
    kind: "expander",
    direction,
    parentId,
    symbol: loading.has(parentId) ? LOADING_SYMBOL : PLUS_SYMBOL,
    symbolSize: 24,
    label: {
      show: true,
      position: direction === "up" ? "left" : "right",
      color: MUTED,
      fontSize: 12,
      fontFamily: HIERARCHY_FONT,
      formatter:
        direction === "up"
          ? formatMessage("hierarchyMoreLevels", { count })
          : `+${count}`
    }
  });

  const descendants = (id: string): any[] => {
    const kids: any[] = (data.children[id] ?? []).map((child) => ({
      ...card(child),
      children: descendants(child.id)
    }));
    const unloaded = data.unloadedChildCount[id];
    if (unloaded) {
      kids.push(expander("down", id, unloaded));
    }
    return kids;
  };

  let root: any = {
    ...card(data.current),
    children: descendants(data.current.id)
  };
  for (const ancestor of data.ancestors) {
    root = { ...card(ancestor), children: [root] };
  }
  const hiddenUp = data.ancestorTotal - data.ancestors.length;
  if (hiddenUp > 0) {
    root = { ...expander("up", "up", hiddenUp), children: [root] };
  }

  // Leaves set the height (one card row each); edge depth sets the width.
  const measure = (node: any, depth: number): [number, number] =>
    node.children?.length
      ? node.children
          .map((child) => measure(child, depth + 1))
          .reduce(([l1, d1], [l2, d2]) => [l1 + l2, Math.max(d1, d2)])
      : [1, depth];
  const [leafCount, depth] = measure(root, 0);

  const tooltipRow = (labelKey: string, value?: string) =>
    `${_.escape(formatMessage(labelKey))}: ${_.escape(value || "—")}`;

  const option = {
    animation: false,
    tooltip: {
      trigger: "item",
      backgroundColor: "#fff",
      borderColor: BORDER,
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { color: "#333", fontSize: 13, fontFamily: HIERARCHY_FONT },
      extraCssText:
        "box-shadow:0 .5rem 1rem rgba(0,0,0,.15);border-radius:.375rem;",
      formatter: (params: any) => {
        const item = params.data;
        if (item?.kind === "expander") {
          return _.escape(
            formatMessage("hierarchyShowMoreLevels", {
              count: HIERARCHY_LEVELS
            })
          );
        }
        const node: HierarchyNode | undefined = item?.raw;
        if (!node) return "";
        return [
          `<b>${_.escape(node.name)}</b>`,
          tooltipRow("field_materialSampleType", node.materialSampleType),
          tooltipRow("field_preparationType", node.preparationType),
          tooltipRow("field_materialSampleState", node.materialSampleState),
          tooltipRow("field_storageUnit", node.storageUnit)
        ].join("<br/>");
      }
    },
    series: [
      {
        type: "tree",
        orient: "LR",
        left: MARGIN_LEFT,
        right: MARGIN_RIGHT,
        top: 30,
        bottom: 30,
        roam: false,
        animation: false,
        expandAndCollapse: false,
        initialTreeDepth: -1,
        symbol: "circle",
        symbolSize: 1,
        edgeShape: "polyline",
        edgeForkPosition: "50%",
        lineStyle: { color: "#ced4da", width: 1.5 },
        itemStyle: { color: "#ced4da", borderWidth: 0 },
        emphasis: {
          focus: "ancestor",
          lineStyle: { color: NAVY, width: 2 }
        },
        data: [root]
      }
    ]
  };

  return {
    option,
    height: Math.max(240, leafCount * CARD_ROW_HEIGHT),
    width: depth * COLUMN_WIDTH + MARGIN_LEFT + MARGIN_RIGHT,
    typesPresent: [...typesPresent],
    hasDestroyed
  };
}

/** Converts a dina_material_sample_index hit _source into a node and its parent id. */
export function hierarchyNodeFromSource(source: any): {
  node: HierarchyNode;
  parentId?: string;
} {
  const attributes = source?.data?.attributes ?? {};
  const included = (type: string) =>
    source?.included?.find((item) => item?.type === type)?.attributes;
  return {
    node: {
      id: source.data.id,
      name: attributes.materialSampleName || source.data.id,
      materialSampleType: attributes.materialSampleType ?? undefined,
      materialSampleState: attributes.materialSampleState ?? undefined,
      preparationType: included("preparation-type")?.name,
      storageUnit: included("storage-unit-usage")?.storageUnitName
    },
    parentId: attributes.hierarchy?.find((item) => item.rank === 2)?.uuid
  };
}
