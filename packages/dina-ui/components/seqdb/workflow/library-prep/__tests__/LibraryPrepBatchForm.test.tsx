import { ResourceSelect } from "common-ui";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import { Chain, ChainStepTemplate } from "../../../../../types/seqdb-api";
import { LibraryPrepBatchForm } from "../LibraryPrepBatchForm";

const mockSave = jest.fn();
const mockCtx = {
  apiClient: {
    async get() {
      return { data: [] };
    }
  },
  save: mockSave
};

const mockOnSuccess = jest.fn();
function getWrapper(propsOverride = {}) {
  return mountWithAppContext(
    <LibraryPrepBatchForm
      chain={{ id: "5", type: "chain" } as Chain}
      step={{ id: "10", type: "chain-step-template" } as ChainStepTemplate}
      onSuccess={mockOnSuccess}
      {...propsOverride}
    />,
    { apiContext: mockCtx as any }
  );
}

describe("Library Prep Batch form", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Lets you create a new library prep batch.", async () => {
    // Mock success response:
    mockSave.mockImplementation(async ops => {
      if (ops[0].type === "library-prep-batch") {
        return [{ id: "2", type: "library-prep-batch" }];
      }
      if (ops[0].type === "step-resource") {
        return [{ id: "100", type: "step-resource" }];
      }
    });

    const wrapper = getWrapper();
    wrapper
      .find(".totalLibraryYieldNm-field input")
      .simulate("change", { target: { value: "2.5" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              totalLibraryYieldNm: "2.5"
            },
            type: "library-prep-batch"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      ],
      [
        [
          {
            resource: {
              chain: {
                id: "5",
                type: "chain"
              },
              chainStepTemplate: {
                id: "10",
                type: "chain-step-template"
              },
              libraryPrepBatch: {
                id: "2",
                type: "library-prep-batch"
              },
              type: "step-resource",
              value: "LIBRARY_PREP_BATCH"
            },
            type: "step-resource"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      ]
    ]);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  it("Lets you edit an existing library prep batch.", async () => {
    // Mock success response:
    mockSave.mockImplementation(async ops => {
      if (ops[0].type === "library-prep-batch") {
        return [{ id: "2", type: "library-prep-batch" }];
      }
    });

    const wrapper = getWrapper({
      libraryPrepBatch: {
        id: "2",
        notes: "test notes",
        totalLibraryYieldNm: 2.5,
        type: "library-prep-batch"
      }
    });

    expect(wrapper.find(".notes-field textarea").prop("value")).toEqual(
      "test notes"
    );

    // Change the product and protocol
    wrapper.find(".product-field").find(ResourceSelect).prop<any>("onChange")({
      id: "100"
    });
    wrapper.find(".protocol-field").find(ResourceSelect).prop<any>("onChange")({
      id: "200"
    });

    wrapper.find(".notes-field textarea").simulate("change", {
      target: { name: "seq", value: "new notes" }
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "2",
              notes: "new notes",
              product: {
                id: "100",
                type: "product"
              },
              protocol: {
                id: "200",
                type: "protocol"
              },
              totalLibraryYieldNm: 2.5,
              type: "library-prep-batch"
            },
            type: "library-prep-batch"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      ]
    ]);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});
