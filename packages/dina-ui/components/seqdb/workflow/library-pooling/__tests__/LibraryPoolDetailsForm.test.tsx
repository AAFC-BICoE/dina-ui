import { mountWithAppContext } from "../../../../../test-util/mock-app-context";
import { Chain, ChainStepTemplate } from "../../../../../types/seqdb-api";
import {
  LibraryPoolDetailsForm,
  LibraryPoolDetailsFormProps
} from "../LibraryPoolDetailsForm";

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

function getWrapper(propsOverride: Partial<LibraryPoolDetailsFormProps> = {}) {
  return mountWithAppContext(
    <LibraryPoolDetailsForm
      chain={{ id: "5", type: "chain" } as Chain}
      step={{ id: "10", type: "chain-step-template" } as ChainStepTemplate}
      onSuccess={mockOnSuccess}
      {...propsOverride}
    />,
    { apiContext: mockCtx as any }
  );
}

describe("LibraryPoolDetailsForm component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Lets you create a new library pool.", async () => {
    // Mock success response:
    mockSave.mockImplementation(async ops => {
      if (ops[0].type === "library-pool") {
        return [{ id: "2", type: "library-pool" }];
      }
      if (ops[0].type === "step-resource") {
        return [{ id: "100", type: "step-resource" }];
      }
    });

    const wrapper = getWrapper();

    wrapper
      .find(".name-field")
      .find("input")
      .simulate("change", {
        target: { name: "name", value: "new library pool" }
      });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              name: "new library pool"
            },
            type: "library-pool"
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
              libraryPool: {
                id: "2",
                type: "library-pool"
              },
              type: "step-resource",
              value: "LIBRARY_POOL"
            },
            type: "step-resource"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      ]
    ]);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  it("Lets you edit an existing library pool.", async () => {
    // Mock success response:
    mockSave.mockImplementation(async ops => {
      if (ops[0].type === "library-pool") {
        return [{ id: "2", type: "library-pool" }];
      }
    });

    const wrapper = getWrapper({
      libraryPool: {
        id: "2",
        name: "existing test library pool",
        type: "library-pool"
      }
    });

    expect(wrapper.find(".name-field input").prop("value")).toEqual(
      "existing test library pool"
    );

    // Change the name:
    wrapper
      .find(".name-field")
      .find("input")
      .simulate("change", {
        target: { name: "name", value: "edited name" }
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
              name: "edited name",
              type: "library-pool"
            },
            type: "library-pool"
          }
        ],
        { apiBaseUrl: "/seqdb-api" }
      ]
    ]);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});
