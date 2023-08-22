import { QueryTable } from "common-ui";
import PcrPrimerListPage from "../../../../pages/seqdb/pcr-primer/list";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PcrPrimer } from "../../../../types/seqdb-api/resources/PcrPrimer";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PRIMERS: PcrPrimer[] = [
  {
    id: "4",
    lotNumber: 1,
    name: "Test Primer 1",
    seq: "test seq",
    type: "PRIMER"
  },
  {
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

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("PcrPrimer list page", () => {
  it("Renders the list page.", async () => {
    const wrapper = mountWithAppContext(<PcrPrimerListPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // Check that the table contains the links to primer details pages.
    expect(wrapper.containsMatchingElement(<a>Test Primer 1</a>)).toEqual(true);
    expect(wrapper.containsMatchingElement(<a>Test Primer 2</a>)).toEqual(true);
  });

  it("Allows a filterable search.", async () => {
    const wrapper = mountWithAppContext(<PcrPrimerListPage />, { apiContext });

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

    expect(mockGet).toHaveBeenCalledWith(
      "seqdb-api/pcr-primer",
      expect.objectContaining({ filter: { rsql: "name==*101F*" } })
    );
    expect(wrapper.find(QueryTable).prop("filter")).toEqual({
      rsql: "name==*101F*"
    });
  });
});
