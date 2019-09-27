import { mount } from "enzyme";
import NumberFormat from "react-number-format";
import { ApiClientContext } from "../../..";
import { Chain, ChainStepTemplate } from "../../../../types/seqdb-api";
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
  return mount(
    <ApiClientContext.Provider value={mockCtx as any}>
      <LibraryPrepBatchForm
        chain={{ id: "5", type: "chain" } as Chain}
        step={{ id: "10", type: "chainStepTemplate" } as ChainStepTemplate}
        onSuccess={mockOnSuccess}
        {...propsOverride}
      />
    </ApiClientContext.Provider>
  );
}

describe("Library Prep Batch form", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Lets you create a new library prep batch.", async () => {
    // Mock success response:
    mockSave.mockImplementation(async ops => {
      if (ops[0].type === "libraryPrepBatch") {
        return [{ id: "2", type: "libraryPrepBatch" }];
      }
      if (ops[0].type === "stepResource") {
        return [{ id: "100", type: "stepResource" }];
      }
    });

    const wrapper = getWrapper();
    wrapper
      .find(".totalLibraryYieldNm-field")
      .find(NumberFormat)
      .prop<any>("onValueChange")({
      floatValue: 2.5
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              totalLibraryYieldNm: 2.5
            },
            type: "libraryPrepBatch"
          }
        ]
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
                type: "chainStepTemplate"
              },
              libraryPrepBatch: {
                id: "2",
                type: "libraryPrepBatch"
              },
              type: "INPUT",
              value: "LIBRARY_PREP_BATCH"
            },
            type: "stepResource"
          }
        ]
      ]
    ]);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  it("Lets you edit an existing library prep batch.", async () => {
    // Mock success response:
    mockSave.mockImplementation(async ops => {
      if (ops[0].type === "libraryPrepBatch") {
        return [{ id: "2", type: "libraryPrepBatch" }];
      }
    });

    const wrapper = getWrapper({
      libraryPrepBatch: {
        id: "2",
        notes: "test notes",
        totalLibraryYieldNm: 2.5,
        type: "libraryPrepBatch"
      }
    });

    expect(wrapper.find(".notes-field input").prop("value")).toEqual(
      "test notes"
    );

    wrapper.find(".notes-field input").simulate("change", {
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
              totalLibraryYieldNm: 2.5,
              type: "libraryPrepBatch"
            },
            type: "libraryPrepBatch"
          }
        ]
      ]
    ]);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});
