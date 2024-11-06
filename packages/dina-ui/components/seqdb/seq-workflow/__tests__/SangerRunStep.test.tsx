import { mountWithAppContext2 } from "../../../../../dina-ui/test-util/mock-app-context";
import { SangerRunStep } from "../SangerRunStep";
import { noop } from "lodash";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SeqBatch } from "packages/dina-ui/types/seqdb-api";
import {
  MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_1,
  MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_2,
  MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_3,
  SEQ_REACTIONS_MULTIPLE,
  STORAGE_UNIT_USAGE_1,
  STORAGE_UNIT_USAGE_2,
  STORAGE_UNIT_USAGE_3
} from "../__mocks__/SangerRunStepMocks";

const SEQ_BATCH_ID = "d107d371-79cc-4939-9fcc-990cb7089fa4";
const SEQ_BATCH_ID_MULTIPLE_RUNS = "d8a276bd-48b3-4642-a4f6-a6eb974de1e9";

const SEQ_BATCH: SeqBatch = {
  isCompleted: false,
  id: SEQ_BATCH_ID,
  name: "Test-Seq-Batch",
  type: "seq-batch",
  sequencingType: "Sanger",
  storageUnit: {
    id: "0192fcdf-4274-742c-ad44-978f08532025",
    type: "storage-unit"
  }
};

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "/seqdb-api/seq-reaction":
      switch (params.filter.rsql) {
        case "seqBatch.uuid==" + SEQ_BATCH_ID_MULTIPLE_RUNS:
          return SEQ_REACTIONS_MULTIPLE;
      }
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path: string) => {
    switch (path) {
      // Molecular Analyis Run Item Requests
      case "/molecular-analysis-run-item/d21066cc-c4e3-4263-aeba-8e6bc6badb36?include=molecularAnalysisRun":
        return MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_1;
      case "/molecular-analysis-run-item/83d21135-51eb-4637-a202-e5b73f7a8ff9?include=molecularAnalysisRun":
        return MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_2;
      case "/molecular-analysis-run-item/9a836ab0-f0ae-4d6a-aa48-b386ea6af2cf?include=molecularAnalysisRun":
        return MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_3;

      // Storage Unit Usage Requests
      case "/storage-unit-usage/0192fd01-90a6-75a2-a7a3-daf1a4718471":
        return STORAGE_UNIT_USAGE_1;
      case "/storage-unit-usage/0192fd01-90c2-7e45-95a2-a5614f68052f":
        return STORAGE_UNIT_USAGE_2;
      case "/storage-unit-usage/0192fd01-9104-72fa-a18f-80d97da0c935":
        return STORAGE_UNIT_USAGE_3;
    }
  });
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        get: mockGet
      }
    },
    bulkGet: mockBulkGet
  }
} as any;

describe("Sanger Run Step from Sanger Workflow", () => {
  beforeEach(jest.clearAllMocks);

  it("Loading spinner is displayed on first load", async () => {
    const wrapper = mountWithAppContext2(
      <SangerRunStep
        editMode={false}
        performSave={false}
        seqBatch={SEQ_BATCH}
        seqBatchId={SEQ_BATCH_ID}
        setEditMode={noop}
        setPerformSave={noop}
      />
    );

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Multiple runs exist for one seq-batch, display warning to user", async () => {
    const wrapper = mountWithAppContext2(
      <SangerRunStep
        editMode={false}
        performSave={false}
        seqBatch={SEQ_BATCH}
        seqBatchId={SEQ_BATCH_ID_MULTIPLE_RUNS} // Use the SeqBatch ID with multiple runs
        setEditMode={noop}
        setPerformSave={noop}
      />,
      testCtx
    );

    // Wait for loading to be finished.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Alert should exist indicating that multiple runs exist.
    expect(wrapper.getByRole("alert")).toBeInTheDocument();
  });
});
