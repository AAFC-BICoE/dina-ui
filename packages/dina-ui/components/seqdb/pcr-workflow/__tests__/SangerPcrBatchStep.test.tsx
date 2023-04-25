import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { SangerPcrBatchStep } from "../SangerPcrBatchStep";
import { noop } from "lodash";
import { PcrBatch } from "../../../../types/seqdb-api";

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
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: PCR_BATCH_NAME } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSaved).lastCalledWith(1, {
      createdBy: "test-user",
      id: "11111111-1111-1111-1111-111111111111",
      name: PCR_BATCH_NAME,
      storageUnit: {
        id: null,
        type: "storage-unit"
      },
      storageUnitType: {
        id: null,
        type: "storage-unit-type"
      },
      relationships: {
        attachment: {
          data: []
        }
      },
      type: "pcr-batch"
    });
  });

  it("Edits an existing PcrBatch", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchStep
        onSaved={mockOnSaved}
        pcrBatchId={PCR_BATCH_ID}
        pcrBatch={PCR_BATCH}
        editMode={false}
        setEditMode={noop}
        performSave={false}
        setPerformSave={noop}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // The form is initially in read-only mode:
    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      PCR_BATCH_NAME
    );

    wrapper.update();

    // Go to edit mode:
    wrapper.setProps({
      children: (
        <SangerPcrBatchStep
          onSaved={mockOnSaved}
          pcrBatchId={PCR_BATCH_ID}
          pcrBatch={PCR_BATCH}
          editMode={true} // Change to edit mode.
          setEditMode={noop}
          performSave={false}
          setPerformSave={noop}
        />
      )
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Edit a field:
    wrapper
      .find(".objective-field input")
      .simulate("change", { target: { value: "test-objective" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSaved).lastCalledWith(1, {
      createdBy: "test-user",
      id: "11111111-1111-1111-1111-111111111111",
      name: PCR_BATCH_NAME,
      isCompleted: false,
      objective: "test-objective",
      storageUnit: {
        id: null,
        type: "storage-unit"
      },
      storageUnitType: {
        id: null,
        type: "storage-unit-type"
      },
      relationships: {
        attachment: {
          data: []
        }
      },
      type: "pcr-batch"
    });
  });
});
