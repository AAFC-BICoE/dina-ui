import RegionDetailsPage from "../../../../pages/seqdb/region/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Region } from "../../../../types/seqdb-api/resources/Region";

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

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the gene region details", async () => {
    const wrapper = mountWithAppContext(<RegionDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The region's name should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<div>Test Region</div>)).toEqual(
      true
    );
  });
});
