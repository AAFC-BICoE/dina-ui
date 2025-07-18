import PreparationMethodDetailsPage from "../../../../pages/collection/preparation-method/view";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { PreparationMethod } from "../../../../types/collection-api/resources/PreparationMethod";
import "@testing-library/jest-dom";

/** Test preparation-type with all fields defined. */
const TEST_PREPARATION_METHOD: PreparationMethod = {
  id: "1",
  name: "test preparation method",
  type: "preparation-method"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn<any, any>(async (model) => {
  // The get request will return the existing preparation-method.
  if (model === "collection-api/preparation-method/100") {
    return { data: TEST_PREPARATION_METHOD };
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

describe("PreparationMethod details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<PreparationMethodDetailsPage />, {
      apiContext
    });

    // expect(wrapper.find(".spinner-border").exists()).toEqual(true);
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Render the PreparationMethod details", async () => {
    const wrapper = mountWithAppContext(<PreparationMethodDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await waitForLoadingToDisappear();

    // Test for Preparation Method Name value
    expect(
      wrapper.getAllByText(/test preparation method/i)[1]
    ).toBeInTheDocument();
  });
});
