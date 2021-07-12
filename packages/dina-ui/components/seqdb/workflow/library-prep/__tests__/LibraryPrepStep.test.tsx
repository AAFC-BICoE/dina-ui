import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import { Chain, ChainStepTemplate } from "../../../../../types/seqdb-api";
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
  const step = { id: "10", type: "chain-step-template" };
  const steps = [{ id: "8", type: "chain-step-template" }, {}, step];

  return mountWithAppContext(
    <LibraryPrepStep
      chain={{ id: "5", type: "chain" } as PersistedResource<Chain>}
      step={step as PersistedResource<ChainStepTemplate>}
      chainStepTemplates={steps as PersistedResource<ChainStepTemplate>[]}
    />,
    { apiContext: mockCtx as any }
  );
}

function mockExistingBatch() {
  mockGet.mockImplementation(async path => {
    if (path === "seqdb-api/step-resource") {
      return {
        data: [
          {
            id: "15",
            libraryPrepBatch: {
              id: "1",
              notes: "new notes"
            },
            type: "step-resource"
          }
        ]
      };
    }

    return { data: [] };
  });
}

function mockNoExistingBatch() {
  mockGet.mockImplementation(async path => {
    if (path === "seqdb-api/step-resource") {
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

    wrapper.find(".notes-field textarea").simulate("change", {
      target: { name: "seq", value: "new notes" }
    });

    mockSave.mockImplementation(async ops => {
      if (ops[0].type === "library-prep-batch") {
        return [{ id: "2", type: "library-prep-batch" }];
      }
      if (ops[0].type === "step-resource") {
        return [{ id: "100", type: "step-resource" }];
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

    expect(wrapper.find(".notes-field .field-view").text()).toEqual(
      "new notes"
    );

    // This details state should also show the library prep sub-steps:
    expect(wrapper.contains("Substep 1: Library Prep Details Table")).toEqual(
      true
    );
  });

  it("Provides an edit button to edit the batch details.", async () => {
    mockExistingBatch();
    const wrapper = getWrapper();

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".notes-field .field-view").text()).toEqual(
      "new notes"
    );

    wrapper.find("button[children='Edit Batch Details']").simulate("click");
    wrapper.update();

    expect(wrapper.find(".notes-field textarea").prop("value")).toEqual(
      "new notes"
    );
  });
});
