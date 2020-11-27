import { OperationsResponse, ResourceSelect } from "common-ui";
import { ChainEditPage } from "../../../../pages/seqdb/workflow/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Chain, ChainTemplate } from "../../../../types/seqdb-api";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async path => {
  if (path === "seqdb-api/chain/5") {
    // The request for the primer returns the test region.
    return { data: TEST_WORKFLOW };
  } else {
    return { data: [] };
  }
});

/** Mock axios for operations requests. */
const mockPatch = jest.fn();

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

const TEST_WORKFLOW: Chain = {
  chainTemplate: { id: "1", type: "chainTemplate" } as ChainTemplate,
  createdOn: "2019-08-16",
  id: "5",
  name: "Mat's chain",
  type: "chain"
};

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

    const wrapper = mountWithAppContext(
      <ChainEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
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

    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "New Workflow" }
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "/seqdb-api/operations",
      [
        {
          op: "POST",
          path: "chain",
          value: {
            attributes: {
              group: "/aafc",
              name: "New Workflow"
            },
            id: "00000000-0000-0000-0000-000000000000",
            relationships: {
              chainTemplate: { data: { id: "1", type: "chainTemplate" } }
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
