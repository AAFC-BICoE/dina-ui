import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { SangerPcrBatchStep } from "../SangerPcrBatchStep";

const mockOnSaved = jest.fn();
const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "seqdb-api/pcr-primer":
    case "objectstore-api/metadata":
    case "seqdb-api/region":
    case "agent-api/person":
    case "seqdb-api/thermocycler-profile":
    case "user-api/group":
    case "seqdb-api/pcr-batch/test-batch-id/attachment":
      return { data: [] };
    case "seqdb-api/pcr-batch/test-batch-id":
      return {
        data: {
          createdBy: "test-user",
          id: "test-batch-id",
          name: "test-batch",
          type: "pcr-batch"
        }
      };
  }
});
const mockSave = jest.fn(ops =>
  ops.map(op => ({
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
      <SangerPcrBatchStep onSaved={mockOnSaved} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test-batch" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSaved).lastCalledWith({
      createdBy: "test-user",
      id: "11111111-1111-1111-1111-111111111111",
      name: "test-batch",
      relationships: {},
      type: "pcr-batch"
    });
  });

  it("Edits an existing PcrBatch", async () => {
    const wrapper = mountWithAppContext(
      <SangerPcrBatchStep onSaved={mockOnSaved} pcrBatchId={"test-batch-id"} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // The form is initially in read-only mode:
    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      "test-batch"
    );

    // Go to edit mode:
    wrapper.find("button.edit-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Edit a field:
    wrapper
      .find(".objective-field input")
      .simulate("change", { target: { value: "test-objective" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSaved).lastCalledWith({
      createdBy: "test-user",
      id: "11111111-1111-1111-1111-111111111111",
      name: "test-batch",
      objective: "test-objective",
      relationships: {},
      type: "pcr-batch"
    });

    // The form is now in read-only mode:
    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      "test-batch"
    );
  });
});
