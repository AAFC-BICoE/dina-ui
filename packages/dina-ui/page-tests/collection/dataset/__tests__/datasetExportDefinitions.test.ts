import {
  DATASET_EXPORT_DEFINITIONS,
  getDatasetExportDefinition
} from "../../../../components/collection/dataset/datasetExportDefinitions";

describe("Dataset export definitions", () => {
  it("defines the current DWCA export in one place", () => {
    expect(getDatasetExportDefinition("DWCA")).toEqual({
      exportType: "DWCA",
      source: "dina_material_sample_index",
      indexName: "dina_material_sample_index"
    });
  });

  it("defaults datasets without a type to the only currently supported format", () => {
    expect(getDatasetExportDefinition()).toBe(DATASET_EXPORT_DEFINITIONS.DWCA);
  });
});
