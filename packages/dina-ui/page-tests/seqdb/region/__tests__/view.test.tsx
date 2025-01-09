import RegionDetailsPage from "../../../../pages/seqdb/region/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Region } from "../../../../types/seqdb-api/resources/Region";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_REGION: Region = {
  description: "test region",
  id: "5",
  name: "Test Region",
  symbol: "symbol",
  type: "region"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_REGION
  };
});

const apiContext: any = { apiClient: { get: mockGet } };

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } }),
  withRouter: (fn) => fn
}));

describe("Region details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<RegionDetailsPage />, {
      apiContext
    });

    // Test loading spinner to render
    expect(wrapper.getByText(/loading\.\.\./i));
  });

  it("Render the gene region details", async () => {
    const wrapper = mountWithAppContext(<RegionDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);

    // Expect loading spinner to not be in the UI
    expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();

    // The region's name should be rendered in a FieldView.
    expect(wrapper.getAllByText(/test region/i)[1]).toBeInTheDocument();
  });
});
