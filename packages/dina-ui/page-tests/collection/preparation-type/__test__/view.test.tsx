import PreparationTypeDetailsPage from "../../../../pages/collection/preparation-type/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PreparationType } from "../../../../types/collection-api/resources/PreparationType";

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

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the PreparationType details", async () => {
    const wrapper = mountWithAppContext(<PreparationTypeDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      "test preparation type"
    );
  });
});
