import WorkflowListPage from "../../../../pages/seqdb/workflow/list";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Chain, ChainTemplate } from "../../../../types/seqdb-api";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_CHAINS: Chain[] = [
  {
    chainTemplate: { name: "Mat's chain template" } as ChainTemplate,
    createdOn: "2019-08-16",
    id: "1",
    name: "Mat's chain 1",
    type: "chain"
  },
  {
    chainTemplate: { name: "Mat's chain template" } as ChainTemplate,
    createdOn: "2019-08-17",
    id: "2",
    name: "Mat's chain 2",
    type: "chain"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_CHAINS
  };
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("Workflow list page.", () => {
  it("Lists workflows.", async () => {
    const wrapper = mountWithAppContext(<WorkflowListPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.containsMatchingElement(<a>Mat's chain 1</a>)).toEqual(true);
    expect(wrapper.containsMatchingElement(<a>Mat's chain 2</a>)).toEqual(true);
    expect(wrapper.contains("Mat's chain template")).toEqual(true);
  });
});
