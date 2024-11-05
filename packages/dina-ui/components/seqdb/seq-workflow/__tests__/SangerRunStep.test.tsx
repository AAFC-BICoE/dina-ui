import { mountWithAppContext2 } from "../../../../../dina-ui/test-util/mock-app-context";
import { SangerRunStep } from "../SangerRunStep";
import { noop } from "lodash";
import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SeqBatch } from "packages/dina-ui/types/seqdb-api";
import { SEQ_REACTIONS_MULTIPLE } from "../__mocks__/SangerRunStepMocks";

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

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        get: mockGet
      }
    }
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

    screen.logTestingPlaygroundURL();
  });
});
