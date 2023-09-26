import PcrPrimerDetailsPage from "../../../../pages/seqdb/pcr-primer/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PcrPrimer } from "../../../../types/seqdb-api/resources/PcrPrimer";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PRIMER: PcrPrimer = {
  id: "5",
  lotNumber: 1,
  name: "Test Primer",
  seq: "test seq",
  type: "PRIMER"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PRIMER
  };
});

// Mock Kitsu, the client class that talks to the backend.
const apiContext: any = {
  apiClient: {
    get: mockGet
  }
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } }),
  withRouter: (fn) => fn
}));

describe("PcrPrimer details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<PcrPrimerDetailsPage />, {
      apiContext
    });

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the PCR primer details", async () => {
    const wrapper = mountWithAppContext(<PcrPrimerDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The primer's name should be rendered in a FieldView.
    expect(wrapper.find(".name-field-header").exists()).toEqual(true);
    expect(wrapper.containsMatchingElement(<div>Test Primer</div>)).toEqual(
      true
    );
  });
});
