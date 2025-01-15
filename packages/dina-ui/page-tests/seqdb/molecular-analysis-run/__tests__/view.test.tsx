import { mountWithAppContext } from "common-ui";
import MolecularAnalysisRunViewPage from "../../../../pages/seqdb/molecular-analysis-run/view";
import "@testing-library/jest-dom";
import { waitForElementToBeRemoved } from "@testing-library/react";
import {
  STORAGE_UNIT_USAGE_1,
  STORAGE_UNIT_USAGE_2,
  STORAGE_UNIT_USAGE_3,
  TEST_GENERIC_MOLECULAR_ANALYSIS_ITEMS,
  TEST_MATERIAL_SAMPLE_SUMMARY,
  TEST_METADATA,
  TEST_MOLECULAR_ANALYSIS_RUN,
  TEST_MOLECULAR_ANALYSIS_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC,
  TEST_QUALITY_CONTROL_TYPES
} from "../__mocks__/MolecularAnalysisRunViewMocks";

const mockGet = jest.fn(async (path, params) => {
  switch (path) {
    // Molecular Analysis Run
    case "seqdb-api/molecular-analysis-run/" + TEST_MOLECULAR_ANALYSIS_RUN_ID:
      return { data: TEST_MOLECULAR_ANALYSIS_RUN };

    // Quality Control Types
    case "seqdb-api/vocabulary/qualityControlType":
      return { data: TEST_QUALITY_CONTROL_TYPES };

    // Molecular Analysis Run Items
    case "seqdb-api/molecular-analysis-run-item":
      switch (params?.filter?.rsql) {
        case "run.uuid==" + TEST_MOLECULAR_ANALYSIS_RUN_ID:
          return {
            data: TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC
          };
      }

    // Generic Molecular Analysis Items
    case "seqdb-api/generic-molecular-analysis-item?include=storageUnitUsage,materialSample,molecularAnalysisRunItem&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC[0].id:
      return { data: [TEST_GENERIC_MOLECULAR_ANALYSIS_ITEMS[0]] };
    case "seqdb-api/generic-molecular-analysis-item?include=storageUnitUsage,materialSample,molecularAnalysisRunItem&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC[1].id:
      return { data: [TEST_GENERIC_MOLECULAR_ANALYSIS_ITEMS[1]] };
    case "seqdb-api/generic-molecular-analysis-item?include=storageUnitUsage,materialSample,molecularAnalysisRunItem&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC[2].id:
      return { data: [TEST_GENERIC_MOLECULAR_ANALYSIS_ITEMS[2]] };

    // Attachments
    case "objectstore-api/metadata":
    case "seqdb-api/molecular-analysis-run/" +
      TEST_MOLECULAR_ANALYSIS_RUN_ID +
      "/attachments":
      return {
        data: [TEST_METADATA]
      };

    // Blob storage
    case "":
      return {};

    default:
      return { data: [] };
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path: string) => {
    switch (path) {
      // Material Sample Summary
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[0].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[0];
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[1].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[1];
      case "/material-sample-summary/" + TEST_MATERIAL_SAMPLE_SUMMARY[2].id:
        return TEST_MATERIAL_SAMPLE_SUMMARY[2];

      // Storage Unit Usages
      case "/storage-unit-usage/" + STORAGE_UNIT_USAGE_1.id:
        return STORAGE_UNIT_USAGE_1;
      case "/storage-unit-usage/" + STORAGE_UNIT_USAGE_2.id:
        return STORAGE_UNIT_USAGE_2;
      case "/storage-unit-usage/" + STORAGE_UNIT_USAGE_3.id:
        return STORAGE_UNIT_USAGE_3;

      // Attachments
      case "metadata/7f3eccfa-3bc1-412f-9385-bb00e2319ac6?include=derivatives":
      case "metadata/7f3eccfa-3bc1-412f-9385-bb00e2319ac6?include=acMetadataCreator,derivatives":
        return TEST_METADATA;
    }
  });
});

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "b4c78082-61a8-4784-a116-8601f76c85d7" } }),
  withRouter: (fn) => fn
}));

describe("Molecular Analysis Run View", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });

    // Test loading spinner to render
    expect(wrapper.getByText(/loading\.\.\./i));
  });

  it("Renders the molecular analysis run details for generic molecular analysis", async () => {
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Ensure the title is displayed of the run.
    expect(wrapper.getAllByText(/run name 1/i)[0]).toBeInTheDocument();

    // Ensure Molecular Analysis Run Items are displayed:
    expect(wrapper.getByRole("link", { name: "Sample 1" })).toBeInTheDocument();
    expect(wrapper.getByRole("link", { name: "Sample 2" })).toBeInTheDocument();
    expect(wrapper.getByRole("link", { name: "Sample 3" })).toBeInTheDocument();

    // Ensure Run Item Names are displayed:
    expect(wrapper.getByText("Run Item 1")).toBeInTheDocument();
    expect(wrapper.getByText("Run Item 2")).toBeInTheDocument();
    expect(wrapper.getByText("Run Item 3")).toBeInTheDocument();

    // Ensure Well Coordinates are displayed:
    expect(wrapper.getByText("A1")).toBeInTheDocument();
    expect(wrapper.getByText("A2")).toBeInTheDocument();
    expect(wrapper.getByText("A3")).toBeInTheDocument();

    // Ensure the attachment appears.
    expect(
      wrapper.getByRole("heading", {
        name: /sequencing run attachments \(1\)/i
      })
    ).toBeInTheDocument();
  });
});
