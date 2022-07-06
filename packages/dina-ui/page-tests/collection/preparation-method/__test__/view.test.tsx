import PreparationMethodDetailsPage from "../../../../pages/collection/preparation-method/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PreparationMethod } from "../../../../types/collection-api/resources/PreparationMethod";

/** Test preparation-type with all fields defined. */
const TEST_PREPARATION_METHOD: PreparationMethod = {
  id: "1",
  name: "test preparation method",
  type: "preparation-method"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn<any, any>(async model => {
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

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the PreparationMethod details", async () => {
    const wrapper = mountWithAppContext(<PreparationMethodDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      "test preparation method"
    );
  });
});
