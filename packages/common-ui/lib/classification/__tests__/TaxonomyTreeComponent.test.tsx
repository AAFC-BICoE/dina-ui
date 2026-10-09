import * as echarts from "echarts";
import { Activity } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import TaxonomyTree from "../TaxonomyTree";

// jsdom has no canvas or layout, so render the real chart to SVG at a fixed size.
jest.mock("echarts", () => {
  const actual = jest.requireActual("echarts");
  return {
    ...actual,
    init: (dom, theme, opts) =>
      actual.init(dom, theme, {
        renderer: "svg",
        width: 1000,
        height: 460,
        ...opts
      })
  };
});

const RANKS = ["kingdom", "phylum", "class"];

const mockGet = jest.fn(async () => ({
  data: {
    id: "taxonomicRank",
    type: "vocabulary",
    vocabularyElements: RANKS.map((rank) => ({
      key: rank,
      name: rank,
      multilingualTitle: { titles: [{ lang: "en", title: rank }] }
    }))
  }
}));

const BUCKETS = {
  kingdom: [
    { key: "Animalia", doc_count: 3 },
    { key: "Plantae", doc_count: 1 }
  ],
  // An unconventionally cased value, which must be shown and queried exactly as stored.
  phylum: [
    { key: "Arthropoda", doc_count: 2 },
    { key: "incertae sedis", doc_count: 1 }
  ],
  class: [{ key: "Insecta", doc_count: 2 }]
};

const mockPost = jest.fn(async (_path, query: any) => {
  const rank = Object.keys(query.aggs)[0].replace("taxonomy_", "");
  return {
    data: {
      aggregations: { [`sterms#taxonomy_${rank}`]: { buckets: BUCKETS[rank] } }
    }
  };
});

const requestedRanks = () =>
  mockPost.mock.calls.map(([, query]: any) => Object.keys(query.aggs)[0]);

function getChart(container: HTMLElement) {
  const chart = echarts.getInstanceByDom(
    container.querySelector("[_echarts_instance_]") as HTMLElement
  );
  if (!chart) throw new Error("Chart not rendered");
  return chart;
}

/** Node names, minus ECharts' virtual root at index 0. */
const nodeNames = (chart: echarts.ECharts) => {
  const data = (chart as any).getModel().getSeriesByIndex(0).getData();
  return Array.from({ length: data.count() - 1 }, (_, i) =>
    data.getName(i + 1)
  );
};

/** Clicks a tree node the way a user does, through zrender's click event. */
function clickNode(chart: echarts.ECharts, name: string) {
  const data = (chart as any).getModel().getSeriesByIndex(0).getData();
  const target = data.getItemGraphicEl(data.indexOfName(name)).getSymbolPath();
  act(() => chart.getZr().trigger("click", { target }));
}

const testCtx = {
  apiContext: { apiClient: { get: mockGet, axios: { post: mockPost } } as any }
};

async function mountTree() {
  const result = mountWithAppContext(
    <Activity mode="visible">
      <TaxonomyTree />
    </Activity>,
    testCtx
  );
  await screen.findByText("Aggregated from primary determinations · 4 records");
  return result;
}

describe("TaxonomyTree component", () => {
  beforeEach(jest.clearAllMocks);

  it("Refreshes back to the top rank after drilling down", async () => {
    const { container } = await mountTree();
    const chart = getChart(container);
    expect(nodeNames(chart)).toEqual(["All", "Animalia", "Plantae"]);

    clickNode(chart, "Animalia");
    await waitFor(() =>
      expect(nodeNames(getChart(container))).toContain("Arthropoda")
    );

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(requestedRanks()).toEqual([
        "taxonomy_kingdom",
        "taxonomy_phylum",
        "taxonomy_kingdom"
      ])
    );
    await waitFor(() =>
      expect(nodeNames(getChart(container))).toEqual([
        "All",
        "Animalia",
        "Plantae"
      ])
    );

    // The tree still drills down after a refresh.
    clickNode(getChart(container), "Animalia");
    await waitFor(() =>
      expect(nodeNames(getChart(container))).toContain("Arthropoda")
    );
  });

  it("Keeps working after its effects re-run, as with Fast Refresh or a hidden tab", async () => {
    const { container, rerender } = await mountTree();

    // Hiding then showing re-runs every effect while keeping state and refs.
    for (const mode of ["hidden", "visible"] as const) {
      rerender(
        <Activity mode={mode}>
          <TaxonomyTree />
        </Activity>
      );
    }
    // Showing it again re-runs the data effect, which reloads the top rank.
    await waitFor(() => expect(requestedRanks().length).toEqual(2));

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(requestedRanks()).toEqual([
        "taxonomy_kingdom",
        "taxonomy_kingdom",
        "taxonomy_kingdom"
      ])
    );
    const chart = getChart(container);
    expect(chart.isDisposed()).toBeFalsy();
    expect(nodeNames(chart)).toEqual(["All", "Animalia", "Plantae"]);
  });

  it("Capitalizes the rank headers from the lowercase vocabulary", async () => {
    const { container } = await mountTree();
    const headers = () =>
      (getChart(container).getZr() as any).storage
        .getDisplayList(true)
        .map((el) => el.style?.text)
        .filter((text) => /^(kingdom|phylum|class)$/i.test(text ?? ""));

    await waitFor(() => expect(headers()).toEqual(["Kingdom"]));
    clickNode(getChart(container), "Animalia");
    await waitFor(() => expect(headers()).toEqual(["Kingdom", "Phylum"]));
  });

  it("Shows and queries taxon names exactly as stored", async () => {
    const { container } = await mountTree();
    clickNode(getChart(container), "Animalia");
    await waitFor(() =>
      expect(nodeNames(getChart(container))).toEqual([
        "All",
        "Animalia",
        "Arthropoda",
        "incertae sedis",
        "Plantae"
      ])
    );
    const data = (getChart(container) as any)
      .getModel()
      .getSeriesByIndex(0)
      .getData();
    const label = data
      .getItemGraphicEl(data.indexOfName("incertae sedis"))
      .getSymbolPath()
      .getTextContent();
    expect(label.style.text).toEqual("{n|incertae sedis} {c|1}");

    clickNode(getChart(container), "incertae sedis");
    await waitFor(() =>
      expect(requestedRanks()).toEqual([
        "taxonomy_kingdom",
        "taxonomy_phylum",
        "taxonomy_class"
      ])
    );
    const [, classQuery] = mockPost.mock.calls[2] as any;
    expect(classQuery.query.bool.must).toEqual([
      {
        term: {
          "data.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification.kingdom.keyword":
            "Animalia"
        }
      },
      {
        term: {
          "data.attributes.targetIdentifiableEntitySummary.primaryDetermination.classification.phylum.keyword":
            "incertae sedis"
        }
      }
    ]);
  });
});
