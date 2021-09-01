import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { SangerSampleSelectionStep } from "../SangerSampleSelectionStep";

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "seqdb-api/pcr-batch-item":
      return {
        data: [
          {
            id: "1",
            type: "pcr-batch-item",
            pcrBatch: {
              id: "test-batch-id",
              type: "pcr-batch",
              name: "test-batch"
            },
            sample: {
              id: "1",
              type: "molecular-sample",
              name: "sample-1"
            }
          },
          {
            id: "2",
            type: "pcr-batch-item",
            pcrBatch: {
              id: "test-batch-id",
              type: "pcr-batch",
              name: "test-batch"
            },
            sample: {
              id: "2",
              type: "molecular-sample",
              name: "sample-3"
            }
          },
          {
            id: "3",
            type: "pcr-batch-item",
            pcrBatch: {
              id: "test-batch-id",
              type: "pcr-batch",
              name: "test-batch"
            },
            sample: {
              id: "3",
              type: "molecular-sample",
              name: "sample-3"
            }
          }
        ],
        meta: { totalResourceCount: 3 }
      };
    case "seqdb-api/molecular-sample":
      return {
        data: [
          { id: "4", type: "molecular-sample", name: "sample-4" },
          { id: "5", type: "molecular-sample", name: "sample-5" },
          { id: "6", type: "molecular-sample", name: "sample-6" }
        ]
      };
    case "seqdb-api/pcr-batch/test-batch-id":
      return {
        data: {
          id: "test-batch-id",
          type: "pcr-batch",
          group: "sanger-test-group"
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

describe("SangerSampleSelectionStep component", () => {
  it("Lets you deselect and select Samples", async () => {
    const wrapper = mountWithAppContext(
      <SangerSampleSelectionStep pcrBatchId="test-batch-id" />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.edit-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Remove all 3 selected samples:
    wrapper
      .find(".selected-samples input.check-all-checkbox")
      .prop<any>("onClick")({
      target: { checked: true }
    });
    wrapper.update();
    wrapper.find("button.deselect-all-checked-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    // 3 pcr-batch-items deleted:
    expect(mockSave).lastCalledWith(
      [
        { delete: { id: "1", type: "pcr-batch-item" } },
        { delete: { id: "2", type: "pcr-batch-item" } },
        { delete: { id: "3", type: "pcr-batch-item" } }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    // Add all 3 available samples:
    wrapper
      .find(".available-samples input.check-all-checkbox")
      .prop<any>("onClick")({
      target: { checked: true }
    });
    wrapper.update();
    wrapper.find("button.select-all-checked-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    // 3 pcr-batch-items added:
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            createdBy: "test-user",
            group: "sanger-test-group",
            pcrBatch: {
              id: "test-batch-id",
              type: "pcr-batch"
            },
            sample: {
              id: "4",
              type: "molecular-sample"
            },
            type: "pcr-batch-item"
          },
          type: "pcr-batch-item"
        },
        {
          resource: {
            createdBy: "test-user",
            group: "sanger-test-group",
            pcrBatch: {
              id: "test-batch-id",
              type: "pcr-batch"
            },
            sample: {
              id: "5",
              type: "molecular-sample"
            },
            type: "pcr-batch-item"
          },
          type: "pcr-batch-item"
        },
        {
          resource: {
            createdBy: "test-user",
            group: "sanger-test-group",
            pcrBatch: {
              id: "test-batch-id",
              type: "pcr-batch"
            },
            sample: {
              id: "6",
              type: "molecular-sample"
            },
            type: "pcr-batch-item"
          },
          type: "pcr-batch-item"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
  });
});
