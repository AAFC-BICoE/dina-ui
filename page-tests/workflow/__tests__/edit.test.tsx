import { mount } from "enzyme";
import {
  ApiClientContext,
  createContextValue,
  ResourceSelect
} from "../../../components";
import { OperationsResponse } from "../../../components/api-client/jsonapi-types";
import { ChainEditPage } from "../../../pages/workflow/edit";
import { Chain, ChainTemplate, Group } from "../../../types/seqdb-api";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  if (model === "chain/5") {
    // The request for the primer returns the test region.
    return { data: TEST_WORKFLOW };
  } else {
    return [];
  }
});

/** Mock axios for operations requests. */
const mockPatch = jest.fn();

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
      public axios = {
        patch: mockPatch
      };
    }
);

const TEST_WORKFLOW: Chain = {
  chainTemplate: { id: "1", type: "chainTemplate" } as ChainTemplate,
  dateCreated: "2019-08-16",
  group: { id: "100", type: "group" } as Group,
  id: "5",
  name: "Mat's chain",
  type: "chain"
};

function mountWithContext(element: JSX.Element) {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      {element}
    </ApiClientContext.Provider>
  );
}

describe("Workflow edit page.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a Workflow.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "100",
            type: "chain"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <ChainEditPage router={{ query: {}, push: mockPush } as any} />
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Input form data.
    (wrapper
      .find(".chainTemplate-field")
      .find(ResourceSelect)
      .prop("onChange") as any)({
      id: "1",
      type: "chainTemplate"
    });

    (wrapper
      .find(".group-field")
      .find(ResourceSelect)
      .prop("onChange") as any)({
      id: "200",
      type: "group"
    });

    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "New Workflow" }
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    const today = new Date().toISOString().split("T")[0];

    expect(mockPatch).lastCalledWith(
      "operations",
      [
        {
          op: "POST",
          path: "chain",
          value: {
            attributes: {
              dateCreated: today,
              name: "New Workflow"
            },
            id: -100,
            relationships: {
              chainTemplate: { data: { id: "1", type: "chainTemplate" } },
              group: { data: { id: "200", type: "group" } }
            },
            type: "chain"
          }
        }
      ],
      expect.anything()
    );

    expect(mockPush).lastCalledWith("/workflow/view?id=100");
  });
});
