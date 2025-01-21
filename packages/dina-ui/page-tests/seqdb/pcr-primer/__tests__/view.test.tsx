import PcrPrimerDetailsPage from "../../../../pages/seqdb/pcr-primer/view";
import { mountWithAppContext } from "common-ui";
import { PcrPrimer } from "../../../../types/seqdb-api/resources/PcrPrimer";
import "@testing-library/jest-dom";

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

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Render the PCR primer details", async () => {
    const wrapper = mountWithAppContext(<PcrPrimerDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await wrapper.waitForRequests();

    // expect(wrapper.find(".spinner-border").exists()).toEqual(false);
    expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();

    // The primer's name should be rendered in a FieldView.
    expect(wrapper.getByText(/name/i)).toBeInTheDocument();
    expect(wrapper.getAllByText(/test primer/i)[1]).toBeInTheDocument();
  });
});
