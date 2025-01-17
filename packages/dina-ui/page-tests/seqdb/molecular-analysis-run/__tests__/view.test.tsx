import { mountWithAppContext } from "common-ui";
import MolecularAnalysisRunViewPage from "../../../../pages/seqdb/molecular-analysis-run/view";
import "@testing-library/jest-dom";
import { waitForElementToBeRemoved } from "@testing-library/react";
import {
  QUALITY_CONTROL_1,
  QUALITY_CONTROL_2,
  QUALITY_CONTROL_3,
  STORAGE_UNIT_USAGE_1,
  STORAGE_UNIT_USAGE_2,
  STORAGE_UNIT_USAGE_3,
  TEST_GENERIC_MOLECULAR_ANALYSIS_ITEMS,
  TEST_MATERIAL_SAMPLE_SUMMARY,
  TEST_METADATA,
  TEST_METAGENOMIC_MOLECULAR_ANALYSIS_ITEMS,
  TEST_METAGENOMICS_BATCH_RUN,
  TEST_METAGENOMICS_BATCH_RUN_ID,
  TEST_MOLECULAR_ANALYSIS_RUN,
  TEST_MOLECULAR_ANALYSIS_RUN_GENRIC_ID,
  TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC,
  TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL,
  TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_METAGENOMICS,
  TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS,
  TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS,
  TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS_ID,
  TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL,
  TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL_ID,
  TEST_PCR_BATCH_ITEMS,
  TEST_QUALITY_CONTROL_TYPES,
  TEST_SEQ_REACTION_MOLECULAR_ANALYSIS_ITEMS,
  TEST_SEQ_REACTION_RUN,
  TEST_SEQ_REACTIONS_RUN_ID
} from "../__mocks__/MolecularAnalysisRunViewMocks";

const mockGet = jest.fn(async (path, params) => {
  switch (path) {
    // Molecular Analysis Run
    case "seqdb-api/molecular-analysis-run/" +
      TEST_MOLECULAR_ANALYSIS_RUN_GENRIC_ID:
      return { data: TEST_MOLECULAR_ANALYSIS_RUN };
    case "seqdb-api/molecular-analysis-run/" +
      TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL_ID:
      return { data: TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL };
    case "seqdb-api/molecular-analysis-run/" +
      TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS_ID:
      return { data: TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS };
    case "seqdb-api/molecular-analysis-run/" + TEST_METAGENOMICS_BATCH_RUN_ID:
      return { data: TEST_METAGENOMICS_BATCH_RUN };
    case "seqdb-api/molecular-analysis-run/" + TEST_SEQ_REACTIONS_RUN_ID:
      return { data: TEST_SEQ_REACTION_RUN };

    // Quality Control Types
    case "seqdb-api/vocabulary/qualityControlType":
      return { data: TEST_QUALITY_CONTROL_TYPES };

    // Quality Controls
    case "seqdb-api/quality-control":
      switch (params?.filter?.rsql) {
        case "molecularAnalysisRunItem.uuid==" +
          TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL[0].id:
          return { data: [QUALITY_CONTROL_1] };
        case "molecularAnalysisRunItem.uuid==" +
          TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL[1].id:
          return { data: [QUALITY_CONTROL_2] };
        case "molecularAnalysisRunItem.uuid==" +
          TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL[2].id:
          return { data: [QUALITY_CONTROL_3] };
      }

    // Molecular Analysis Run Items
    case "seqdb-api/molecular-analysis-run-item":
      switch (params?.filter?.rsql) {
        case "run.uuid==" + TEST_MOLECULAR_ANALYSIS_RUN_GENRIC_ID:
          return {
            data: TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC
          };
        case "run.uuid==" + TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL_ID:
          return {
            data: [
              ...TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC,
              ...TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL
            ]
          };
        case "run.uuid==" + TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS_ID:
          return {
            data: []
          };
        case "run.uuid==" + TEST_METAGENOMICS_BATCH_RUN_ID:
          return {
            data: TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_METAGENOMICS
          };
        case "run.uuid==" + TEST_SEQ_REACTIONS_RUN_ID:
          return {
            data: TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS
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

    // Metageneomic Batch Items
    case "seqdb-api/metagenomics-batch-item?include=pcrBatchItem,molecularAnalysisRunItem&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_METAGENOMICS[0].id:
      return { data: [TEST_METAGENOMIC_MOLECULAR_ANALYSIS_ITEMS[0]] };
    case "seqdb-api/metagenomics-batch-item?include=pcrBatchItem,molecularAnalysisRunItem&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_METAGENOMICS[1].id:
      return { data: [TEST_METAGENOMIC_MOLECULAR_ANALYSIS_ITEMS[1]] };
    case "seqdb-api/metagenomics-batch-item?include=pcrBatchItem,molecularAnalysisRunItem&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_METAGENOMICS[2].id:
      return { data: [TEST_METAGENOMIC_MOLECULAR_ANALYSIS_ITEMS[2]] };

    // Seq Reaction Items
    case "seqdb-api/seq-reaction?include=storageUnitUsage,pcrBatchItem,seqPrimer&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS[0].id:
      return { data: [TEST_SEQ_REACTION_MOLECULAR_ANALYSIS_ITEMS[0]] };
    case "seqdb-api/seq-reaction?include=storageUnitUsage,pcrBatchItem,seqPrimer&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS[1].id:
      return { data: [TEST_SEQ_REACTION_MOLECULAR_ANALYSIS_ITEMS[1]] };
    case "seqdb-api/seq-reaction?include=storageUnitUsage,pcrBatchItem,seqPrimer&filter[rsql]=molecularAnalysisRunItem.uuid==" +
      TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS[2].id:
      return { data: [TEST_SEQ_REACTION_MOLECULAR_ANALYSIS_ITEMS[2]] };

    // Attachments
    case "objectstore-api/metadata":
    case "seqdb-api/molecular-analysis-run/" +
      TEST_MOLECULAR_ANALYSIS_RUN_GENRIC_ID +
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

      // PCR Batch Items
      case "/pcr-batch-item/" +
        TEST_PCR_BATCH_ITEMS[0].id +
        "?include=materialSample":
      case "/pcr-batch-item/" +
        TEST_PCR_BATCH_ITEMS[0].id +
        "?include=materialSample,storageUnitUsage":
        return TEST_PCR_BATCH_ITEMS[0];
      case "/pcr-batch-item/" +
        TEST_PCR_BATCH_ITEMS[1].id +
        "?include=materialSample":
      case "/pcr-batch-item/" +
        TEST_PCR_BATCH_ITEMS[1].id +
        "?include=materialSample,storageUnitUsage":
        return TEST_PCR_BATCH_ITEMS[1];
      case "/pcr-batch-item/" +
        TEST_PCR_BATCH_ITEMS[2].id +
        "?include=materialSample":
      case "/pcr-batch-item/" +
        TEST_PCR_BATCH_ITEMS[2].id +
        "?include=materialSample,storageUnitUsage":
        return TEST_PCR_BATCH_ITEMS[2];

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

let mockRouterId = "b4c78082-61a8-4784-a116-8601f76c85d7";
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: mockRouterId } }),
  withRouter: (fn) => fn
}));

describe("Molecular Analysis Run View", () => {
  it("Renders initially with a loading spinner.", () => {
    mockRouterId = TEST_MOLECULAR_ANALYSIS_RUN_GENRIC_ID;
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });

    // Test loading spinner to render
    expect(wrapper.getByText(/loading\.\.\./i));
  });

  it("Renders the molecular analysis run details for generic molecular analysis", async () => {
    mockRouterId = TEST_MOLECULAR_ANALYSIS_RUN_GENRIC_ID;
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

  it("Renders the molecular analysis run details for generic molecular analysis with quality controls", async () => {
    mockRouterId = TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL_ID;
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Ensure the title is displayed of the run.
    expect(
      wrapper.getAllByText("Quality Control Run Name 1")[0]
    ).toBeInTheDocument();

    // Ensure the quality control section is displayed.
    expect(
      wrapper.getByRole("heading", { name: "Sequencing Quality Control:" })
    );

    // Expect Quality Control 1 to be displayed:
    expect(wrapper.getByText("Quality Control 1")).toBeInTheDocument();
    expect(wrapper.getByText("Reserpine Standard")).toBeInTheDocument();

    // Expect Quality Control 2 to be displayed:
    expect(wrapper.getByText("Quality Control 2")).toBeInTheDocument();
    expect(wrapper.getByText("ACN Blank")).toBeInTheDocument();

    // Expect Quality Control 3 to be displayed:
    expect(wrapper.getByText("Quality Control 3")).toBeInTheDocument();
    expect(wrapper.getByText("MEOH Blank")).toBeInTheDocument();
  });

  it("Renders the molecular analysis run details for generic molecular analysis with no run items", async () => {
    mockRouterId = TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS_ID;
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    expect(wrapper.getAllByText("No run items")[0]).toBeInTheDocument();
    expect(wrapper.getAllByText("No Rows Found").length).toBe(2);
  });

  it("Renders the molecular analysis run details for metagenomics batch items", async () => {
    mockRouterId = TEST_METAGENOMICS_BATCH_RUN_ID;
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Run Name is displayed:
    expect(
      wrapper.getAllByText("Metagenomics Batch Run")[0]
    ).toBeInTheDocument();

    // Ensure Molecular Analysis Run Items are displayed:
    expect(wrapper.getByRole("link", { name: "Sample 1" })).toBeInTheDocument();
    expect(wrapper.getByRole("link", { name: "Sample 2" })).toBeInTheDocument();
    expect(wrapper.getByRole("link", { name: "Sample 3" })).toBeInTheDocument();

    // Ensure Run Item Names are displayed:
    expect(wrapper.getByText("Metagenomic Run Item 1")).toBeInTheDocument();
    expect(
      wrapper.queryByText("Metagenomic Run Item 2")
    ).not.toBeInTheDocument();
    expect(
      wrapper.queryByText("Metagenomic Run Item 3")
    ).not.toBeInTheDocument();

    // Ensure Well Coordinates are displayed:
    expect(wrapper.getByText("A1")).toBeInTheDocument();
    expect(wrapper.getByText("A2")).toBeInTheDocument();
    expect(wrapper.getByText("A3")).toBeInTheDocument();
  });

  it("Renders the molecular analysis run details for seq reaction items", async () => {
    mockRouterId = TEST_SEQ_REACTIONS_RUN_ID;
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Run Name is displayed:
    expect(wrapper.getAllByText("Seq Reactions Run")[0]).toBeInTheDocument();

    // Ensure Molecular Analysis Run Items are displayed:
    expect(wrapper.getByRole("link", { name: "Sample 1" })).toBeInTheDocument();
    expect(wrapper.getByRole("link", { name: "Sample 2" })).toBeInTheDocument();
    expect(wrapper.getByRole("link", { name: "Sample 3" })).toBeInTheDocument();

    // Ensure Run Item Names are displayed:
    expect(wrapper.getByText("Seq Reaction Run Item 1")).toBeInTheDocument();
    expect(wrapper.getByText("Seq Reaction Run Item 2")).toBeInTheDocument();
    expect(wrapper.getByText("Seq Reaction Run Item 3")).toBeInTheDocument();

    // Ensure Well Coordinates are displayed:
    expect(wrapper.getByText("A1")).toBeInTheDocument();
    expect(wrapper.getByText("A2")).toBeInTheDocument();
    expect(wrapper.getByText("A3")).toBeInTheDocument();
  });
});
