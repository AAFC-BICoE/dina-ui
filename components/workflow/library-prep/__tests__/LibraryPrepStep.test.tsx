import { mount } from "enzyme";
import { ApiClientContext } from "../../..";
import { Chain, ChainStepTemplate } from "../../../../types/seqdb-api";
import { LibraryPrepStep } from "../LibraryPrepStep";

const mockGet = jest.fn();
const mockSave = jest.fn();

const mockCtx = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

function getWrapper() {
  const step = { id: "10", type: "chainStepTemplate" };
  const steps = [{ id: "8", type: "chainStepTemplate" }, {}, step];

  return mount(
    <ApiClientContext.Provider value={mockCtx as any}>
      <LibraryPrepStep
        chain={{ id: "5", type: "chain" } as Chain}
        step={step as ChainStepTemplate}
        chainStepTemplates={steps as ChainStepTemplate[]}
      />
    </ApiClientContext.Provider>
  );
}

function mockExistingBatch() {
  mockGet.mockImplementation(async path => {
    if (path === "stepResource") {
      return {
        data: [
          {
            id: "15",
            libraryPrepBatch: {
              id: "1",
              notes: "new notes"
            },
            type: "stepResource"
          }
        ]
      };
    }

    return { data: [] };
  });
}

function mockNoExistingBatch() {
  mockGet.mockImplementation(async path => {
    if (path === "stepResource") {
      return { data: [] };
    }

    return { data: [] };
  });
}

describe("LibraryPrepStepDetails component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Renders initially with a loading spinner.", () => {
    mockNoExistingBatch();

    const wrapper = getWrapper();
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Renders the library prep batch form and then the library prep batch details.", async () => {
    mockNoExistingBatch();

    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".notes-field input").simulate("change", {
      target: { name: "seq", value: "new notes" }
    });

    mockSave.mockImplementation(async ops => {
      if (ops[0].type === "libraryPrepBatch") {
        return [{ id: "2", type: "libraryPrepBatch" }];
      }
      if (ops[0].type === "stepResource") {
        return [{ id: "100", type: "stepResource" }];
      }
    });

    mockExistingBatch();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              notes: "new notes"
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

    expect(wrapper.find(".notes-field p").text()).toEqual("new notes");

    // This details state should also show the library prep sub-steps:
    expect(wrapper.contains("Substep 1: Library Prep Edit Table")).toEqual(
      true
    );
  });

  it("Provides an edit button to edit the batch details.", async () => {
    mockExistingBatch();
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".notes-field p").text()).toEqual("new notes");

    wrapper.find("button[children='Edit Batch Details']").simulate("click");
    wrapper.update();

    expect(wrapper.find(".notes-field input").prop("value")).toEqual(
      "new notes"
    );
  });
});
