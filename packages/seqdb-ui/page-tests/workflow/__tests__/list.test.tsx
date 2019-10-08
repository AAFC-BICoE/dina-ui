import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import WorkflowListPage from "../../../pages/workflow/list";
import { Chain, ChainTemplate, Group } from "../../../types/seqdb-api";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_CHAINS: Chain[] = [
  {
    chainTemplate: { name: "Mat's chain template" } as ChainTemplate,
    dateCreated: "2019-08-16",
    group: { groupName: "poffm" } as Group,
    id: "1",
    name: "Mat's chain 1",
    type: "chain"
  },
  {
    chainTemplate: { name: "Mat's chain template" } as ChainTemplate,
    dateCreated: "2019-08-17",
    group: { groupName: "poffm" } as Group,
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

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

function mountWithContext(element: JSX.Element) {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      {element}
    </ApiClientContext.Provider>
  );
}

describe("Workflow list page.", () => {
  it("Lists workflows.", async () => {
    const wrapper = mountWithContext(<WorkflowListPage />);

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.containsMatchingElement(<a>Mat's chain 1</a>)).toEqual(true);
    expect(wrapper.containsMatchingElement(<a>Mat's chain 2</a>)).toEqual(true);

    expect(wrapper.containsMatchingElement(<div>poffm</div>)).toEqual(true);
    expect(
      wrapper.containsMatchingElement(<div>Mat's chain template</div>)
    ).toEqual(true);
  });
});
