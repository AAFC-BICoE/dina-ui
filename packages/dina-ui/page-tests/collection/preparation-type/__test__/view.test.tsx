import PreparationTypeDetailsPage from "../../../../pages/collection/preparation-type/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PreparationType } from "../../../../types/collection-api/resources/PreparationType";
import "@testing-library/jest-dom";

/** Test preparation-type with all fields defined. */
const TEST_PREPARATION_TYPE: PreparationType = {
  id: "1",
  name: "test preparation type",
  type: "preparation-type"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn<any, any>(async (model) => {
  // The get request will return the existing preparation-type.
  if (model === "collection-api/preparation-type/100") {
    return { data: TEST_PREPARATION_TYPE };
  }
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext = {
  apiClient: { get: mockGet }
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } })
}));

describe("PreparationType details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<PreparationTypeDetailsPage />, {
      apiContext
    });

    // Test for spinner to render while page is loading
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Render the PreparationType details", async () => {
    const wrapper = mountWithAppContext(<PreparationTypeDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);

    // Test that the spinner does not render once page has loaded
    expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();

    // Test that Preparation Type Name field is populated with the proper output
    expect(
      wrapper.getAllByText(/test preparation type/i)[1]
    ).toBeInTheDocument();
  });
});
