import { mountWithAppContext } from "common-ui";
import { SangerPcrBatchStep } from "../SangerPcrBatchStep";
import _ from "lodash";
import { PcrBatch } from "../../../../types/seqdb-api";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

const PCR_BATCH_ID = "test-batch-id";
const PCR_BATCH_NAME = "test-batch";

const PCR_BATCH: PcrBatch = {
  name: PCR_BATCH_NAME,
  type: "pcr-batch",
  id: PCR_BATCH_ID,
  createdBy: "test-user",
  isCompleted: false
};

const mockOnSaved = jest.fn();
const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "seqdb-api/pcr-primer":
    case "objectstore-api/metadata":
    case "seqdb-api/region":
    case "agent-api/person":
    case "seqdb-api/thermocycler-profile":
    case "user-api/group":
    case "seqdb-api/pcr-batch-item":
    case "seqdb-api/pcr-batch/" + PCR_BATCH_ID + "/attachment":
      return { data: [] };
    case "seqdb-api/pcr-batch/" + PCR_BATCH_ID:
      return {
        data: {
          createdBy: "test-user",
          id: PCR_BATCH_ID,
          name: PCR_BATCH_NAME,
          type: "pcr-batch"
        }
      };
  }
});
const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: "11111111-1111-1111-1111-111111111111"
  }))
);

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    },
    save: mockSave
  }
};

describe("SangerPcrBatchStep component", () => {
  beforeEach(jest.clearAllMocks);

  it("Creates a new PcrBatch", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchStep
        onSaved={mockOnSaved}
        editMode={true}
        setEditMode={_.noop}
        performSave={false}
        setPerformSave={_.noop}
      />,
      testCtx
    );
    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /name/i })
      ).toBeInTheDocument();
    });

    userEvent.type(
      wrapper.getByRole("textbox", { name: /name/i }),
      PCR_BATCH_NAME
    );

    userEvent.click(wrapper.getByRole("button"));

    await waitFor(() => {
      expect(mockOnSaved).lastCalledWith(1, {
        storageUnit: {
          id: null,
          type: "storage-unit"
        },
        createdBy: "test-user",
        id: "11111111-1111-1111-1111-111111111111",
        name: PCR_BATCH_NAME,
        relationships: {
          attachment: {
            data: []
          }
        },
        type: "pcr-batch"
      });
    });
  });

  it("Edits an existing PcrBatch", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchStep
        onSaved={mockOnSaved}
        pcrBatchId={PCR_BATCH_ID}
        pcrBatch={PCR_BATCH}
        editMode={false}
        setEditMode={_.noop}
        performSave={false}
        setPerformSave={_.noop}
      />,
      testCtx
    );

    // The form is initially in read-only mode:
    await waitFor(() => {
      expect(wrapper.getByText(/test\-batch/i)).toBeInTheDocument();
    });
    wrapper.unmount();

    // Go to edit mode:
    const wrapper2 = mountWithAppContext(
      <SangerPcrBatchStep
        onSaved={mockOnSaved}
        pcrBatchId={PCR_BATCH_ID}
        pcrBatch={PCR_BATCH}
        editMode={true}
        setEditMode={_.noop}
        performSave={false}
        setPerformSave={_.noop}
      />,
      testCtx
    );

    // Edit a field:
    await waitFor(() => {
      expect(
        wrapper2.getByRole("textbox", { name: /objective/i })
      ).toBeInTheDocument();
    });
    userEvent.type(
      wrapper2.getByRole("textbox", { name: /objective/i }),
      "test-objective"
    );

    userEvent.click(wrapper2.getByRole("button"));

    await waitFor(() => {
      expect(mockOnSaved).lastCalledWith(1, {
        storageUnit: {
          id: null,
          type: "storage-unit"
        },
        createdBy: "test-user",
        id: "11111111-1111-1111-1111-111111111111",
        name: PCR_BATCH_NAME,
        isCompleted: false,
        objective: "test-objective",
        relationships: {
          attachment: {
            data: []
          }
        },
        type: "pcr-batch"
      });
    });
  });
});
