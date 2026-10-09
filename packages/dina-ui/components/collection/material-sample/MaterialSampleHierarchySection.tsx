import {
  CollapsibleSection,
  LoadingSpinner,
  useApiClient,
  useCollapsibleSection
} from "common-ui";
import ReactECharts from "echarts-for-react";
import _ from "lodash";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaDownload } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import {
  HIERARCHY_FONT,
  HIERARCHY_LEVELS,
  HierarchyData,
  HierarchyNode,
  TYPE_COLOR,
  buildHierarchyOption,
  hierarchyNodeFromSource
} from "./materialSampleHierarchyOption";

// shortcut: one search returns at most this many samples per (+) expansion.
const MAX_SAMPLES = 1000;

/** Fixed height of the scroll box; the chart inside keeps its full size. */
const VIEWPORT_HEIGHT = 500;

const SOURCE_FIELDS = [
  "data.id",
  "data.attributes.materialSampleName",
  "data.attributes.materialSampleType",
  "data.attributes.materialSampleState",
  "data.attributes.hierarchy",
  "included.type",
  "included.attributes.name",
  "included.attributes.storageUnitName"
];

/** Matches samples that have `ancestorId` at the given rank(s) of their hierarchy (1 = self, 2 = parent). */
function ancestorRankQuery(
  ancestorId: string,
  rank: { gte: number; lte: number }
) {
  return {
    nested: {
      path: "data.attributes.hierarchy",
      query: {
        bool: {
          must: [
            { term: { "data.attributes.hierarchy.uuid": ancestorId } },
            { range: { "data.attributes.hierarchy.rank": rank } }
          ]
        }
      }
    }
  };
}

/** Search responses prefix aggregation names with their type, e.g. "nested#parents". */
const agg = (obj: any, name: string) =>
  obj?.[name] ??
  obj?.[_.findKey(obj, (_v, key) => key.endsWith(`#${name}`)) ?? ""];

const byName = (a: HierarchyNode, b: HierarchyNode) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

export interface MaterialSampleHierarchySectionProps {
  materialSample: MaterialSample;
}

/** Collapsible lineage diagram: the sample, its ancestors (left) and descendants (right). */
export function MaterialSampleHierarchySection({
  materialSample
}: MaterialSampleHierarchySectionProps) {
  return (
    <CollapsibleSection
      id="material-sample-hierarchy"
      headerKey="materialSampleHierarchy"
      defaultOpen={true}
    >
      <MaterialSampleHierarchyChart materialSample={materialSample} />
    </CollapsibleSection>
  );
}

function MaterialSampleHierarchyChart({
  materialSample
}: MaterialSampleHierarchySectionProps) {
  const { apiClient } = useApiClient();
  const { formatMessage, locale } = useDinaIntl();
  const router = useRouter();
  const [isOpen] = useCollapsibleSection();
  const chartRef = useRef<ReactECharts>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startY: number; x: number; y: number }>(
    undefined
  );

  const [data, setData] = useState<HierarchyData>();
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<Error>();

  /** Ancestor ids, parent first. */
  const lineage = useMemo(
    () =>
      _.sortBy(
        (materialSample.hierarchy ?? []).filter((item) => (item.rank ?? 0) > 1),
        "rank"
      ),
    [materialSample.hierarchy]
  );

  async function search(body: any) {
    const response = await apiClient.axios.post(
      "search-api/search-ws/search",
      body,
      { params: { indexName: "dina_material_sample_index" } }
    );
    return response.data;
  }

  /** Loads the next ancestors, falling back to the hierarchy name when a sample is not indexed. */
  async function fetchAncestors(from: number): Promise<HierarchyNode[]> {
    const items = lineage.slice(from, from + HIERARCHY_LEVELS);
    if (!items.length) return [];
    const result = await search({
      size: items.length,
      _source: { includes: SOURCE_FIELDS },
      query: { terms: { "data.id": items.map((item) => item.uuid) } }
    });
    const found = _.keyBy(
      result.hits.hits.map((hit) => hierarchyNodeFromSource(hit._source).node),
      "id"
    );
    return items.map(
      (item) => found[item.uuid] ?? { id: item.uuid, name: item.name }
    );
  }

  /** Loads HIERARCHY_LEVELS generations below rootId, plus child counts of the last generation. */
  async function fetchDescendants(rootId: string) {
    const [result, nextGeneration] = await Promise.all([
      search({
        size: MAX_SAMPLES,
        _source: { includes: SOURCE_FIELDS },
        query: ancestorRankQuery(rootId, { gte: 2, lte: HIERARCHY_LEVELS + 1 })
      }),
      search({
        size: 0,
        query: ancestorRankQuery(rootId, {
          gte: HIERARCHY_LEVELS + 2,
          lte: HIERARCHY_LEVELS + 2
        }),
        aggs: {
          parents: {
            nested: { path: "data.attributes.hierarchy" },
            aggs: {
              direct: {
                filter: { term: { "data.attributes.hierarchy.rank": 2 } },
                aggs: {
                  ids: {
                    terms: {
                      field: "data.attributes.hierarchy.uuid",
                      size: MAX_SAMPLES
                    }
                  }
                }
              }
            }
          }
        }
      })
    ]);

    const children: Record<string, HierarchyNode[]> = {};
    for (const hit of result.hits.hits) {
      const { node, parentId } = hierarchyNodeFromSource(hit._source);
      if (parentId) {
        children[parentId] = [...(children[parentId] ?? []), node];
      }
    }
    Object.values(children).forEach((list) => list.sort(byName));

    const buckets =
      agg(agg(agg(nextGeneration.aggregations, "parents"), "direct"), "ids")
        ?.buckets ?? [];
    const childCount = Object.fromEntries(
      buckets.map((bucket) => [bucket.key, bucket.doc_count])
    );
    return { children, childCount };
  }

  // Initial load: HIERARCHY_LEVELS up and down.
  useEffect(() => {
    let stale = false;
    const current: HierarchyNode = {
      id: materialSample.id ?? "",
      name: materialSample.materialSampleName || (materialSample.id ?? ""),
      materialSampleType: materialSample.materialSampleType ?? undefined,
      materialSampleState: materialSample.materialSampleState ?? undefined,
      preparationType: materialSample.preparationType?.name,
      storageUnit: materialSample.storageUnit?.name
    };
    setData(undefined);
    setError(undefined);
    Promise.all([fetchAncestors(0), fetchDescendants(current.id)])
      .then(([ancestors, { children, childCount }]) => {
        if (stale) return;
        setData({
          current,
          ancestors,
          ancestorTotal: lineage.length,
          children,
          unloadedChildCount: childCount
        });
      })
      .catch((err) => !stale && setError(err));
    return () => {
      stale = true;
    };
  }, [materialSample.id]);

  async function expand(direction: "up" | "down", parentId: string) {
    if (!data || loading.has(parentId)) return;
    setLoading((prev) => new Set(prev).add(parentId));
    try {
      if (direction === "up") {
        const more = await fetchAncestors(data.ancestors.length);
        setData(
          (prev) => prev && { ...prev, ancestors: [...prev.ancestors, ...more] }
        );
      } else {
        const { children, childCount } = await fetchDescendants(parentId);
        setData(
          (prev) =>
            prev && {
              ...prev,
              children: { ...prev.children, ...children },
              unloadedChildCount: {
                ..._.omit(prev.unloadedChildCount, parentId),
                ...childCount
              }
            }
        );
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  }

  // ECharts only rebinds handlers when onEvents changes, so keep it stable and read the latest closure.
  const onClickRef = useRef<(params: any) => void>(undefined);
  onClickRef.current = (params) => {
    const item = params?.data;
    if (item?.kind === "expander") {
      expand(item.direction, item.parentId);
    } else if (item?.raw && item.raw.id !== materialSample.id) {
      router.push(`/collection/material-sample/view?id=${item.raw.id}`);
    }
  };
  const onEvents = useMemo(
    () => ({ click: (params) => onClickRef.current?.(params) }),
    []
  );

  // formatMessage is a new function every render; key on locale so unrelated renders reuse the option.
  const view = useMemo(
    () => data && buildHierarchyOption(data, formatMessage, loading),
    [data, loading, locale]
  );

  // The chart has no size while its section is collapsed.
  useEffect(() => {
    if (isOpen) chartRef.current?.getEchartsInstance().resize();
  }, [isOpen]);

  /** Opens the scroll box on the current sample, so upstream and downstream are both in view. */
  function scrollToCurrent(chart: any) {
    // Same internal tree API as TaxonomicChart; the tree group sits at layoutInfo (the left/top box).
    const series = chart.getModel().getSeriesByIndex(0);
    const node = series?.getData().tree.getNodeById(materialSample.id);
    const box = scrollRef.current;
    if (!node || !box) return;
    const { x, y } = node.getLayout();
    box.scrollLeft = series.layoutInfo.x + x - box.clientWidth / 2;
    box.scrollTop = series.layoutInfo.y + y - box.clientHeight / 2;
  }

  function download() {
    const url = chartRef.current
      ?.getEchartsInstance()
      .getDataURL({ type: "png", backgroundColor: "#fff", pixelRatio: 2 });
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      materialSample.materialSampleName || materialSample.id
    }-hierarchy.png`;
    link.click();
  }

  if (error) {
    return <div className="alert alert-danger">{`${error.message}. `}</div>;
  }
  if (!view) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <div style={{ fontFamily: HIERARCHY_FONT }}>
      <div className="d-flex align-items-center flex-wrap gap-3 mb-2">
        {view.typesPresent.map((type) => (
          <span key={type} className="d-flex align-items-center gap-1 small">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: TYPE_COLOR[type]
              }}
            />
            {type === "OTHER" ? formatMessage("hierarchyOtherType") : type}
          </span>
        ))}
        {view.hasDestroyed && (
          <span className="d-flex align-items-center gap-1 small">
            <span
              style={{
                width: 14,
                height: 10,
                borderRadius: 2,
                border: "1px dashed #adb5bd"
              }}
            />
            <DinaMessage id="destroyedLabel" />
          </span>
        )}
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm ms-auto"
          onClick={download}
        >
          <FaDownload className="me-1" />
          <DinaMessage id="downloadFile" />
        </button>
      </div>
      <div
        ref={scrollRef}
        style={{ overflow: "auto", maxHeight: VIEWPORT_HEIGHT }}
        // Drag to pan with the mouse; touch scrolls natively and the scrollbars (target = box) still work.
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.target !== e.currentTarget) {
            drag.current = {
              startX: e.clientX,
              startY: e.clientY,
              x: e.clientX,
              y: e.clientY
            };
          }
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !e.buttons) return;
          e.currentTarget.scrollLeft += d.x - e.clientX;
          e.currentTarget.scrollTop += d.y - e.clientY;
          d.x = e.clientX;
          d.y = e.clientY;
        }}
        // A drag that ends on a card must not open it (the canvas moves with the cursor, so ECharts can't tell).
        onClickCapture={(e) => {
          const d = drag.current;
          if (d && Math.hypot(d.x - d.startX, d.y - d.startY) > 4) {
            e.stopPropagation();
          }
          drag.current = undefined;
        }}
      >
        <ReactECharts
          ref={chartRef}
          option={view.option}
          notMerge={true}
          onEvents={onEvents}
          onChartReady={scrollToCurrent}
          // Fixed size so columns stay 290px apart instead of stretching to the box.
          style={{ height: view.height, width: view.width, margin: "0 auto" }}
        />
      </div>
    </div>
  );
}
