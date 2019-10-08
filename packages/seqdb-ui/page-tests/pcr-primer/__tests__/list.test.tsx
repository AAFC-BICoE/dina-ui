import { mount } from "enzyme";
import {
  ApiClientContext,
  createContextValue,
  QueryTable
} from "../../../components";
import PcrPrimerListPage from "../../../pages/pcr-primer/list";
import { PcrPrimer } from "../../../types/seqdb-api/resources/PcrPrimer";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PRIMERS: PcrPrimer[] = [
  {
    group: { id: "1", groupName: "Test Group", type: "group" },
    id: "4",
    lotNumber: 1,
    name: "Test Primer 1",
    seq: "test seq",
    type: "PRIMER"
  },
  {
    group: { id: "1", groupName: "Test Group", type: "group" },
    id: "5",
    lotNumber: 1,
    name: "Test Primer 2",
    seq: "test seq",
    type: "PRIMER"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PRIMERS
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

describe("PcrPrimer list page", () => {
  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  it("Renders the list page.", async () => {
    const wrapper = mountWithContext(<PcrPrimerListPage />);

    await new Promise(setImmediate);
    wrapper.update();

    // Check that the table contains the links to primer details pages.
    expect(wrapper.containsMatchingElement(<a>Test Primer 1</a>)).toEqual(true);
    expect(wrapper.containsMatchingElement(<a>Test Primer 2</a>)).toEqual(true);
  });

  it("Allows a filterable search.", async () => {
    const wrapper = mountWithContext(<PcrPrimerListPage />);

    // Wait for the default search to finish.
    await new Promise(setImmediate);
    wrapper.update();

    // Enter a search value.
    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "101F" } });

    // Submit the search form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet).lastCalledWith(
      "pcrPrimer",
      expect.objectContaining({ filter: { rsql: "name==*101F*" } })
    );
    expect(wrapper.find(QueryTable).prop("filter")).toEqual({
      rsql: "name==*101F*"
    });
  });
});
