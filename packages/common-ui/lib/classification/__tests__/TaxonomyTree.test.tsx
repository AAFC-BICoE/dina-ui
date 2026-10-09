import * as echarts from "echarts";
import { createIntl } from "react-intl";
import { DINAUI_MESSAGES_ENGLISH } from "../../../../dina-ui/intl/dina-ui-en";
import {
  bindRankColumns,
  buildRankGraphics,
  buildTaxonomyTreeOption
} from "../TaxonomyTree";

const RANKS = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species"
];
const RANK_LABELS = Object.fromEntries(
  RANKS.map((rank) => [rank, rank.charAt(0).toUpperCase() + rank.slice(1)])
);
const { formatMessage } = createIntl({
  locale: "en",
  messages: DINAUI_MESSAGES_ENGLISH
});

const node = (name: string, rank: string, value: number, children = []) => ({
  name,
  rank,
  value,
  id: `${rank}_${name}`,
  children
});

const TREE = {
  name: "Kingdom",
  value: 2,
  children: [
    node("Animalia", "kingdom", 2, [
      node("Arthropoda", "phylum", 2, [
        node("Insecta", "class", 2, [
          node("Hymenoptera", "order", 2, [
            node("Apidae", "family", 2, [
              node("Apis", "genus", 2, [
                node("Apis mellifera", "species", 1)
              ] as any)
            ] as any)
          ] as any)
        ] as any)
      ] as any)
    ] as any)
  ]
};

function buildOption(tree: any = TREE) {
  return buildTaxonomyTreeOption({
    tree,
    ranks: RANKS,
    rankLabels: RANK_LABELS,
    formatMessage
  }) as any;
}

/** Renders the option server-side and returns the tree's laid-out nodes. */
function renderTree(option: any, width: number, height = 460) {
  const chart = echarts.init(null, null, {
    renderer: "svg",
    ssr: true,
    width,
    height
  });
  chart.setOption(option);
  const series = (chart as any).getModel().getSeriesByIndex(0);
  const data = series.getData();
  const nodes: any[] = [];
  data.tree.root.children[0].eachNode((treeNode) => {
    nodes.push(treeNode); // Returning a truthy value would skip the children.
  });
  return { chart, data, nodes, offsetX: series.layoutInfo.x };
}

describe("TaxonomyTree option builder", () => {
  it("Labels the root 'All' and flags genus and species as italic", () => {
    const root = buildOption().series[0].data[0];
    const apidae =
      root.children[0].children[0].children[0].children[0].children[0];
    const apis = apidae.children[0];

    expect(root.name).toEqual("All");
    expect(root.value).toEqual(2);
    expect(root.it).toEqual(false);
    expect(apidae).toMatchObject({ rankLabel: "Family", it: false });
    expect(apis).toMatchObject({ rankLabel: "Genus", it: true });
    expect(apis.children[0]).toMatchObject({ rankLabel: "Species", it: true });
  });

  it("Shows the rank, an italic name and the share of records in the tooltip", () => {
    const { formatter } = buildOption().tooltip;
    const species = { ...node("Apis mellifera", "species", 1), it: true };

    expect(formatter({ data: { ...species, rankLabel: "Species" } })).toEqual(
      'Species<br/><b style="font-style:italic">Apis mellifera</b><br/>1 records · 50% of all'
    );
    expect(formatter({ data: { name: "All", value: 2 } })).toEqual(
      "All primary determinations<br/>2 records · 100% of all"
    );
  });

  it.each([1000, 1400, 1920])(
    "Puts every node on its rank column at %ipx wide",
    (width) => {
      const { chart, nodes, offsetX } = renderTree(buildOption(), width);
      const columnLines = buildRankGraphics(width, 460, RANKS).filter(
        (el) => el.type === "line"
      );

      expect(nodes.length).toEqual(8);
      for (const treeNode of nodes.filter((it) => it.depth > 1)) {
        const columnX = (columnLines[treeNode.depth - 2] as any).shape.x1;
        expect(offsetX + treeNode.getLayout().x).toBeCloseTo(columnX);
      }
      chart.dispose();
    }
  );

  const families = Array.from({ length: 32 }, (_, i) =>
    node(`Familyname${i}`, "family", 1)
  );
  it.each([
    [
      "30+ leaves",
      {
        name: "Kingdom",
        value: 32,
        children: [node("Animalia", "kingdom", 32, families as any)]
      },
      32 * 46,
      34
    ],
    ["a 7 rank deep chain", TREE, 460, 8]
  ])("Doesn't overlap labels in %s", (_, tree, height, count) => {
    const { chart, data, nodes } = renderTree(buildOption(tree), 1000, height);

    const labelRects = nodes.map((treeNode) => {
      const label = data
        .getItemGraphicEl(treeNode.dataIndex)
        .getSymbolPath()
        .getTextContent();
      const rect = label.getBoundingRect().clone();
      rect.applyTransform(label.getComputedTransform());
      return rect;
    });
    expect(labelRects.length).toEqual(count);
    labelRects.forEach((rect, i) =>
      labelRects
        .slice(i + 1)
        .forEach((other) => expect(rect.intersect(other)).toEqual(false))
    );
    chart.dispose();
  });

  it("Draws the rank columns after rendering and redraws them on collapse", async () => {
    // A browser-like chart: setOption renders synchronously, unlike SSR mode.
    const chart = echarts.init(document.createElement("div"), null, {
      renderer: "svg",
      width: 1000,
      height: 460
    });
    const rankNames = Object.values(RANK_LABELS);
    // Node labels are rich text ("{n|Animalia}  {c|2}"), so only headers match a rank name.
    const headers = () =>
      (chart.getZr() as any).storage
        .getDisplayList(true)
        .map((el) => el.style?.text)
        .filter((text) => rankNames.includes(text));
    const nextFrames = () => new Promise((resolve) => setTimeout(resolve, 50));
    const treeData = () =>
      (chart as any).getModel().getSeriesByIndex(0).getData();

    bindRankColumns(chart, rankNames);
    chart.setOption(buildOption(), true);
    await nextFrames();
    expect(headers()).toEqual(rankNames);

    const insecta = treeData().indexOfName("Insecta");
    chart.dispatchAction({
      type: "treeExpandAndCollapse",
      seriesIndex: 0,
      dataIndex: insecta
    });
    await nextFrames();
    expect(headers()).toEqual(["Kingdom", "Phylum", "Class"]);
    // Redrawing the columns must not rebuild the tree and re-expand it.
    expect(treeData().tree.getNodeByDataIndex(insecta).isExpand).toEqual(false);
    chart.dispose();
  });
});
