import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { StorageUnitDetailsPage } from "../../../../pages/collection/storage-unit/view";

const TEST_STRORAGE_DATA = {
  id: "100",
  name: "root",
  type: "storage-unit",
  storageUnitChildren: [
    {
      type: "storage-unit",
      name: "firstLevelChild",
      storageUnitChildren: [
        {
          type: "storage-unit",
          name: "secLevelChild"
        }
      ]
    }
  ]
};
/** Mock Kitsu "get" method. */
const mockGet = jest.fn<any, any>(async model => {
  // The get request will return the existing storage unit
  if (model === "collection-api/storage-unit/100") {
    return { data: TEST_STRORAGE_DATA };
  } else if (model === "user-api/group") {
    return [];
  }
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext = {
  apiClient: { get: mockGet }
};

describe("view page test", () => {
  it("Renders initially with a loading spinner.", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Shows the data in a tree structure.", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // Initially show only the root node
    expect(wrapper.find(".storageUnitTree NodeHeader").text()).toContain(
      "root"
    );

    wrapper.find(".storageUnitTree NodeHeader").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Show the first level node after click on root node
    expect(wrapper.find(".storageUnitTree Drawer Header").text()).toContain(
      "firstLevelChild"
    );
  });
});
