import { mountWithAppContext } from "common-ui";
import { act, fireEvent, waitFor } from "@testing-library/react";
import { MaterialSample } from "../../../../types/collection-api";
import { MaterialSampleHierarchySection } from "../MaterialSampleHierarchySection";

const mockChart = jest.fn();
const mockCanvasClick = jest.fn();
jest.mock("echarts-for-react", () => (props: any) => {
  mockChart(props);
  return require("react").createElement("div", {
    "data-testid": "chart",
    onClick: mockCanvasClick
  });
});

// jsdom has no PointerEvent; a MouseEvent with pointerType is enough for these handlers.
class MockPointerEvent extends MouseEvent {
  pointerType: string;
  constructor(type: string, init: any = {}) {
    super(type, init);
    this.pointerType = init.pointerType;
  }
}
(window as any).PointerEvent ??= MockPointerEvent;

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush })
}));

// Lineage: p7 > ... > p1 > current > c1 > ... > c7
const PARENT = {
  p1: "p2",
  p2: "p3",
  p3: "p4",
  p4: "p5",
  p5: "p6",
  p6: "p7",
  c1: "current",
  c2: "c1",
  c3: "c2",
  c4: "c3",
  c5: "c4",
  c6: "c5",
  c7: "c6"
};
/** Descendants returned for each searched root, within 5 generations. */
const DESCENDANTS = {
  current: ["c1", "c2", "c3", "c4", "c5"],
  c5: ["c6", "c7"]
};

const hit = (id: string) => ({
  _source: {
    data: {
      id,
      attributes: {
        materialSampleName: id,
        hierarchy: [{ uuid: PARENT[id], rank: 2 }]
      }
    }
  }
});

const mockPost = jest.fn(async (_path: string, body: any) => {
  if (body.query.terms) {
    return { data: { hits: { hits: body.query.terms["data.id"].map(hit) } } };
  }
  const rootId =
    body.query.nested.query.bool.must[0].term["data.attributes.hierarchy.uuid"];
  if (body.size === 0) {
    // Generation 6 under "current" is c6, a child of c5.
    const buckets = rootId === "current" ? [{ key: "c5", doc_count: 1 }] : [];
    return {
      data: {
        aggregations: {
          "nested#parents": { "filter#direct": { "sterms#ids": { buckets } } }
        }
      }
    };
  }
  return { data: { hits: { hits: (DESCENDANTS[rootId] ?? []).map(hit) } } };
});

const materialSample = {
  id: "current",
  type: "material-sample",
  materialSampleName: "current",
  hierarchy: [
    { uuid: "current", name: "current", rank: 1 },
    ...["p1", "p2", "p3", "p4", "p5", "p6", "p7"].map((uuid, i) => ({
      uuid,
      name: uuid,
      rank: i + 2
    }))
  ]
} as MaterialSample;

const lastProps = () => mockChart.mock.lastCall[0];

/** Ids along the first-child path of the rendered tree; expanders show as "+". */
function visiblePath() {
  let node = lastProps().option.series[0].data[0];
  const path = [node.raw?.id ?? "+"];
  while (node.children?.length) {
    node = node.children[0];
    path.push(node.raw?.id ?? "+");
  }
  return path;
}

const click = (data: any) => act(() => lastProps().onEvents.click({ data }));

describe("MaterialSampleHierarchySection", () => {
  beforeEach(jest.clearAllMocks);

  it("Shows 5 levels each way and expands 5 more per (+) click", async () => {
    mountWithAppContext(
      <MaterialSampleHierarchySection materialSample={materialSample} />,
      { apiContext: { apiClient: { axios: { post: mockPost } } as any } }
    );

    await waitFor(() => expect(mockChart).toHaveBeenCalled());
    expect(visiblePath()).toEqual([
      "+",
      "p5",
      "p4",
      "p3",
      "p2",
      "p1",
      "current",
      "c1",
      "c2",
      "c3",
      "c4",
      "c5",
      "+"
    ]);

    // Up: the last 2 ancestors load and the (+) goes away.
    await click({ kind: "expander", direction: "up", parentId: "up" });
    await waitFor(() => expect(visiblePath()[0]).toEqual("p7"));

    // Down: c5's descendants load and its (+) goes away.
    await click({ kind: "expander", direction: "down", parentId: "c5" });
    await waitFor(() =>
      expect(visiblePath().slice(-3)).toEqual(["c5", "c6", "c7"])
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("Opens another sample's view page on click, but not the current one", async () => {
    mountWithAppContext(
      <MaterialSampleHierarchySection materialSample={materialSample} />,
      { apiContext: { apiClient: { axios: { post: mockPost } } as any } }
    );
    await waitFor(() => expect(mockChart).toHaveBeenCalled());

    await click({ raw: { id: "current" } });
    expect(mockPush).not.toHaveBeenCalled();

    await click({ raw: { id: "c3" } });
    expect(mockPush).toHaveBeenCalledWith(
      "/collection/material-sample/view?id=c3"
    );
  });

  it("Opens the scroll box centred on the current sample", async () => {
    const { container } = mountWithAppContext(
      <MaterialSampleHierarchySection materialSample={materialSample} />,
      { apiContext: { apiClient: { axios: { post: mockPost } } as any } }
    );
    await waitFor(() => expect(mockChart).toHaveBeenCalled());

    const box = container.querySelector<HTMLDivElement>(
      "div[style*='overflow: auto']"
    )!;
    Object.defineProperty(box, "clientWidth", { value: 800 });
    Object.defineProperty(box, "clientHeight", { value: 500 });
    const layout = { current: { x: 1500, y: 900 } };
    lastProps().onChartReady({
      getModel: () => ({
        getSeriesByIndex: () => ({
          layoutInfo: { x: 120, y: 30 },
          getData: () => ({
            tree: { getNodeById: (id) => ({ getLayout: () => layout[id] }) }
          })
        })
      })
    });

    expect(box.style.maxHeight).toEqual("500px");
    expect(box.scrollLeft).toEqual(120 + 1500 - 400);
    expect(box.scrollTop).toEqual(30 + 900 - 250);
  });

  it("Pans by dragging, without opening the card under the cursor", async () => {
    const { getByTestId } = mountWithAppContext(
      <MaterialSampleHierarchySection materialSample={materialSample} />,
      { apiContext: { apiClient: { axios: { post: mockPost } } as any } }
    );
    await waitFor(() => expect(mockChart).toHaveBeenCalled());
    const chart = getByTestId("chart");
    const box = chart.parentElement!;

    fireEvent.pointerDown(chart, {
      pointerType: "mouse",
      clientX: 100,
      clientY: 100
    });
    fireEvent.pointerMove(chart, { buttons: 1, clientX: 60, clientY: 70 });
    fireEvent.click(chart);
    expect([box.scrollLeft, box.scrollTop]).toEqual([40, 30]);
    expect(mockCanvasClick).not.toHaveBeenCalled();

    // A plain click still reaches the chart.
    fireEvent.pointerDown(chart, {
      pointerType: "mouse",
      clientX: 10,
      clientY: 10
    });
    fireEvent.click(chart);
    expect(mockCanvasClick).toHaveBeenCalledTimes(1);
  });
});
