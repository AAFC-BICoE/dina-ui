import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { CollectionMethod } from "../../../../types/collection-api/resources/CollectionMethod";
import { CollecitonMethodDetailsPage } from "../../../../pages/collection/collection-method/view";

/** Test collection-method with all fields defined. */
const TEST_COLLECTION_METHOD: CollectionMethod = {
  id: "1",
  name: "test collection method",
  type: "collection-method"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn<any, any>(async model => {
  // The get request will return the existing collection-method.
  if (model === "collection-api/collection-method/100") {
    return { data: TEST_COLLECTION_METHOD };
  }
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext = {
  apiClient: { get: mockGet }
};

describe("CollectionMethod details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(
      <CollecitonMethodDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the CollectionMethod details", async () => {
    const wrapper = mountWithAppContext(
      <CollecitonMethodDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      "test collection method"
    );
  });
});
