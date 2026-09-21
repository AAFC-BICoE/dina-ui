import { PersistedResource } from "kitsu";
import { datasetFilterFn } from "../../../../pages/collection/dataset/list";
import { Dataset } from "../../../../types/collection-api";

function dataset(attrs: Partial<Dataset>): PersistedResource<Dataset> {
  return {
    id: "1",
    type: "dataset",
    ...attrs
  } as PersistedResource<Dataset>;
}

const ANTS_DATASET = dataset({
  group: "aafc",
  datasetType: "DWCA",
  datasetVersion: "1.0",
  multilingualTitle: {
    titles: [
      { lang: "en", title: "Ants of Canada" },
      { lang: "fr", title: "Fourmis du Canada" }
    ]
  }
});

describe("datasetFilterFn", () => {
  it("Matches with no filters applied", () => {
    expect(datasetFilterFn({}, ANTS_DATASET)).toEqual(true);
  });

  it("Matches the free-text search against the English title", () => {
    expect(
      datasetFilterFn({ filterBuilderModel: { value: "ants" } }, ANTS_DATASET)
    ).toEqual(true);
  });

  it("Matches the free-text search against a non-English title", () => {
    expect(
      datasetFilterFn(
        { filterBuilderModel: { value: "fourmis" } },
        ANTS_DATASET
      )
    ).toEqual(true);
  });

  it("Matches the free-text search against the dataset version", () => {
    expect(
      datasetFilterFn({ filterBuilderModel: { value: "1.0" } }, ANTS_DATASET)
    ).toEqual(true);
  });

  it("Is case-insensitive", () => {
    expect(
      datasetFilterFn({ filterBuilderModel: { value: "ANTS" } }, ANTS_DATASET)
    ).toEqual(true);
  });

  it("Excludes datasets that don't match the free-text search", () => {
    expect(
      datasetFilterFn(
        { filterBuilderModel: { value: "spiders" } },
        ANTS_DATASET
      )
    ).toEqual(false);
  });

  it("Filters by group", () => {
    expect(datasetFilterFn({ group: "aafc" }, ANTS_DATASET)).toEqual(true);
    expect(datasetFilterFn({ group: "other-group" }, ANTS_DATASET)).toEqual(
      false
    );
  });

  it("Filters by dataset type", () => {
    expect(datasetFilterFn({ datasetType: "DWCA" }, ANTS_DATASET)).toEqual(
      true
    );
  });

  it("Requires every active filter to match", () => {
    expect(
      datasetFilterFn(
        {
          filterBuilderModel: { value: "ants" },
          group: "aafc",
          datasetType: "DWCA"
        },
        ANTS_DATASET
      )
    ).toEqual(true);

    expect(
      datasetFilterFn(
        {
          filterBuilderModel: { value: "ants" },
          group: "other-group"
        },
        ANTS_DATASET
      )
    ).toEqual(false);
  });

  it("Handles a dataset with no title or version", () => {
    const blank = dataset({});
    expect(
      datasetFilterFn({ filterBuilderModel: { value: "ants" } }, blank)
    ).toEqual(false);
    expect(datasetFilterFn({}, blank)).toEqual(true);
  });
});
