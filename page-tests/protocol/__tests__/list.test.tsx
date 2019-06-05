import { mount } from "enzyme";
import {
  ApiClientContext,
  createContextValue,
  QueryTable
} from "../../../components";
import ProtocolListPage from "../../../pages/protocol/list";
import { Protocol } from "../../../types/seqdb-api/resources/Protocol";
import { ProtocolTypes } from "../../../types/seqdb-api/resources/ProtocolTypes";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PROTOCALS: Protocol[] = [
  {
    group: { id: "1", groupName: "Test Group", type: "group" },
    id: "4",
    name: "Test Protocol 1",
    version: "1",
    type: ProtocolTypes.COLLECTION_EVENT,
    description: "desc1 ",
    steps: "steps1",
    notes: "notes1",
    reference: "ref1",
    equipment: "equip1"
  },
  {
    group: { id: "2", groupName: "Test Group", type: "group" },
    id: "5",
    name: "Test Protocol 2",
    type: ProtocolTypes.DNA_EXTRACTION,
    version: "2",
    description: "desc2 ",
    steps: "steps2",
    notes: "notes2",
    reference: "ref2",
    equipment: "equip2"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PROTOCALS
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

describe("Protocol list page", () => {
  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  it("Renders the list page.", async () => {
    const wrapper = mountWithContext(<ProtocolListPage />);

    await Promise.resolve();
    wrapper.update();

    // Check that the table contains the links to protocol details pages.
    expect(wrapper.containsMatchingElement(<a>Test Protocol 1</a>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<a>Test Protocol 2</a>)).toEqual(
      true
    );
  });

  it("Allows a filterable search.", async done => {
    const wrapper = mountWithContext(<ProtocolListPage />);

    // Wait for the default search to finish.
    await Promise.resolve();
    wrapper.update();

    // Enter a search value.
    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "Funnel trap" } });

    // Submit the search form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(mockGet).lastCalledWith(
        "protocol",
        expect.objectContaining({ filter: { rsql: "name=='*Funnel trap*'" } })
      );
      expect(wrapper.find(QueryTable).props().filter).toEqual({
        rsql: "name=='*Funnel trap*'"
      });
      done();
    });
  });
});
