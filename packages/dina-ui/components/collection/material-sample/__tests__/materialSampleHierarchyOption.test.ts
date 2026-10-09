import {
  HierarchyData,
  HierarchyNode,
  buildHierarchyOption,
  hierarchyNodeFromSource
} from "../materialSampleHierarchyOption";

const MESSAGES = {
  noStorageUnit: "No storage unit",
  destroyedLabel: "Destroyed",
  hierarchyMoreLevels: "{count} more",
  hierarchyShowMoreLevels: "Show {count} more levels",
  field_materialSampleType: "Material Sample Type",
  field_preparationType: "Preparation Type",
  field_materialSampleState: "Material Sample State",
  field_storageUnit: "Storage Unit"
};

const formatMessage = (id: string, values?: Record<string, any>) =>
  (MESSAGES[id] ?? id).replace(/\{(\w+)\}/g, (_m, key) => values?.[key]);

const sample = (id: string, extra: Partial<HierarchyNode> = {}) => ({
  id,
  name: id,
  ...extra
});

const baseData = (extra: Partial<HierarchyData> = {}): HierarchyData => ({
  current: sample("current", { materialSampleType: "WHOLE_ORGANISM" }),
  ancestors: [],
  ancestorTotal: 0,
  children: {},
  unloadedChildCount: {},
  ...extra
});

/** Walks down the first-child path, returning the nodes in order. */
function firstChildPath(node: any): any[] {
  const path = [node];
  while (node.children?.length) {
    node = node.children[0];
    path.push(node);
  }
  return path;
}

const rootOf = (data: HierarchyData, loading?: Set<string>) =>
  buildHierarchyOption(data, formatMessage, loading).option.series[0].data[0];

describe("buildHierarchyOption", () => {
  it("Gives the current sample a 2px navy border and others a 1px grey one", () => {
    const root = rootOf(baseData({ children: { current: [sample("child")] } }));

    expect(root.raw.id).toEqual("current");
    // The id lets the section find the current card to scroll to it.
    expect(root.id).toEqual("current");
    expect(root.label).toMatchObject({
      borderColor: "#335075",
      borderWidth: 2,
      borderType: "solid"
    });
    expect(root.children[0].label).toMatchObject({
      borderColor: "#dee2e6",
      borderWidth: 1,
      borderType: "solid"
    });
  });

  it("Shows destroyed samples dashed and muted with a Destroyed suffix", () => {
    const { option, hasDestroyed } = buildHierarchyOption(
      baseData({
        children: {
          current: [sample("gone", { materialSampleState: "destroyed" })]
        }
      }),
      formatMessage
    );
    const destroyed = option.series[0].data[0].children[0];

    expect(hasDestroyed).toEqual(true);
    expect(destroyed.label).toMatchObject({
      borderColor: "#adb5bd",
      borderType: "dashed"
    });
    expect(destroyed.label.formatter).toEqual(
      "{idMuted|gone}\n{d_OTHER|}{t|  No storage unit · Destroyed}"
    );
  });

  it("Colours the type dot by material sample type and lists the types present", () => {
    const { option, typesPresent, hasDestroyed } = buildHierarchyOption(
      baseData({
        children: {
          current: [
            sample("part", { materialSampleType: "ORGANISM_PART" }),
            sample("dna", { materialSampleType: "MOLECULAR_SAMPLE" }),
            sample("mix", { materialSampleType: "MIXED_ORGANISMS" })
          ]
        }
      }),
      formatMessage
    );
    const root = option.series[0].data[0];
    const dots = [root, ...root.children].map(
      (node) => node.label.formatter.match(/\{(d_\w+)\|\}/)[1]
    );

    expect(dots).toEqual([
      "d_WHOLE_ORGANISM",
      "d_ORGANISM_PART",
      "d_MOLECULAR_SAMPLE",
      "d_OTHER"
    ]);
    expect(root.label.rich.d_WHOLE_ORGANISM.backgroundColor).toEqual("#335075");
    expect(root.label.rich.d_ORGANISM_PART.backgroundColor).toEqual("#117c8d");
    expect(root.label.rich.d_MOLECULAR_SAMPLE.backgroundColor).toEqual(
      "#61a1fe"
    );
    expect(root.label.rich.d_OTHER.backgroundColor).toEqual("#adb5bd");
    expect(typesPresent.sort()).toEqual([
      "MOLECULAR_SAMPLE",
      "ORGANISM_PART",
      "OTHER",
      "WHOLE_ORGANISM"
    ]);
    expect(hasDestroyed).toEqual(false);
  });

  it("Shows the storage unit on line 2, or 'No storage unit'", () => {
    const root = rootOf(
      baseData({
        current: sample("current", {
          materialSampleType: "WHOLE_ORGANISM",
          storageUnit: "Drawer 12"
        }),
        children: { current: [sample("child")] }
      })
    );

    expect(root.label.formatter).toEqual(
      "{id|current}\n{d_WHOLE_ORGANISM|}{t|  Drawer 12}"
    );
    expect(root.children[0].label.formatter).toEqual(
      "{id|child}\n{d_OTHER|}{t|  No storage unit}"
    );
  });

  it("Places a (+) left of the topmost loaded ancestor and right of unloaded children", () => {
    // 12-level lineage: 5 of 7 ancestors loaded, 5 generations of descendants loaded.
    const ancestors = ["p1", "p2", "p3", "p4", "p5"].map((id) => sample(id));
    const children = {
      current: [sample("c1")],
      c1: [sample("c2")],
      c2: [sample("c3")],
      c3: [sample("c4")],
      c4: [sample("c5")]
    };
    const root = rootOf(
      baseData({
        ancestors,
        ancestorTotal: 7,
        children,
        unloadedChildCount: { c5: 3 }
      })
    );
    const path = firstChildPath(root);

    // (+), 5 ancestors (topmost first), current, 5 descendants, (+).
    expect(path.map((node) => node.raw?.id ?? node.kind)).toEqual([
      "expander",
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
      "expander"
    ]);

    const up = path[0];
    expect(up).toMatchObject({
      kind: "expander",
      direction: "up",
      parentId: "up",
      symbolSize: 24
    });
    expect(up.label).toMatchObject({ position: "left", formatter: "2 more" });

    const down = path[path.length - 1];
    expect(down).toMatchObject({
      kind: "expander",
      direction: "down",
      parentId: "c5",
      symbolSize: 24
    });
    expect(down.label).toMatchObject({ position: "right", formatter: "+3" });
  });

  it("Has no (+) once the whole lineage is loaded", () => {
    const root = rootOf(
      baseData({
        ancestors: [sample("p1")],
        ancestorTotal: 1,
        children: { current: [sample("c1")] }
      })
    );
    const path = firstChildPath(root);

    expect(path.map((node) => node.raw.id)).toEqual(["p1", "current", "c1"]);
  });

  it("Swaps the (+) symbol while that direction is loading", () => {
    const data = baseData({ ancestors: [], ancestorTotal: 3 });

    expect(rootOf(data, new Set(["up"])).symbol).not.toEqual(
      rootOf(data).symbol
    );
  });

  it("Sizes the chart from the visible leaves and depth", () => {
    const small = buildHierarchyOption(
      baseData({ children: { current: [sample("c1")] } }),
      formatMessage
    );
    expect(small.height).toEqual(240);
    expect(small.width).toEqual(1 * 290 + 90 + 230);

    const wide = buildHierarchyOption(
      baseData({
        children: {
          current: Array.from({ length: 40 }, (_v, i) => sample(`c${i}`))
        }
      }),
      formatMessage
    );
    expect(wide.height).toEqual(40 * 76);
  });

  it("Escapes HTML in the tooltip", () => {
    const { option } = buildHierarchyOption(
      baseData({
        current: sample("<img src=x onerror=alert(1)>", {
          preparationType: "Pinned"
        })
      }),
      formatMessage
    );
    const html = option.tooltip.formatter({
      data: option.series[0].data[0]
    });

    expect(html).toContain("<b>&lt;img src=x onerror=alert(1)&gt;</b>");
    expect(html).toContain("Preparation Type: Pinned");
    expect(html).toContain("Storage Unit: —");
  });
});

describe("hierarchyNodeFromSource", () => {
  it("Reads the node fields and parent id from a search hit", () => {
    const { node, parentId } = hierarchyNodeFromSource({
      data: {
        id: "child-id",
        attributes: {
          materialSampleName: "CNC-1-A",
          materialSampleType: "ORGANISM_PART",
          materialSampleState: "destroyed",
          hierarchy: [
            { uuid: "child-id", rank: 1 },
            { uuid: "parent-id", rank: 2 }
          ]
        }
      },
      included: [
        { type: "project", attributes: { name: "Project A" } },
        { type: "preparation-type", attributes: { name: "Pinned" } },
        { type: "storage-unit-usage", attributes: { storageUnitName: "Box 3" } }
      ]
    });

    expect(node).toEqual({
      id: "child-id",
      name: "CNC-1-A",
      materialSampleType: "ORGANISM_PART",
      materialSampleState: "destroyed",
      preparationType: "Pinned",
      storageUnit: "Box 3"
    });
    expect(parentId).toEqual("parent-id");
  });
});
