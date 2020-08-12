import { QueryTable } from "common-ui";
import ProtocolListPage from "../../../pages/protocol/list";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  Protocol,
  protocolTypeLabels
} from "../../../types/seqdb-api/resources/Protocol";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PROTOCALS: Protocol[] = [
  {
    description: "desc1 ",
    equipment: "equip1",
    id: "4",
    name: "Test Protocol 1",
    notes: "notes1",
    reference: "ref1",
    steps: "steps1",
    type: protocolTypeLabels.COLLECTION_EVENT,
    version: "1"
  },
  {
    description: "desc2 ",
    equipment: "equip2",
    id: "5",
    name: "Test Protocol 2",
    notes: "notes2",
    reference: "ref2",
    steps: "steps2",
    type: protocolTypeLabels.DNA_EXTRACTION,
    version: "2"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PROTOCALS
  };
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("Protocol list page", () => {
  it("Renders the list page.", async () => {
    const wrapper = mountWithAppContext(<ProtocolListPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // Check that the table contains the links to protocol details pages.
    expect(wrapper.containsMatchingElement(<a>Test Protocol 1</a>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<a>Test Protocol 2</a>)).toEqual(
      true
    );
  });

  it("Allows a filterable search.", async () => {
    const wrapper = mountWithAppContext(<ProtocolListPage />, { apiContext });

    // Wait for the default search to finish.
    await new Promise(setImmediate);
    wrapper.update();

    // Enter a search value.
    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "Funnel trap" } });

    // Submit the search form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();
    expect(mockGet).lastCalledWith(
      "protocol",
      expect.objectContaining({ filter: { rsql: "name=='*Funnel trap*'" } })
    );
    expect(wrapper.find(QueryTable).prop("filter")).toEqual({
      rsql: "name=='*Funnel trap*'"
    });
  });
});
