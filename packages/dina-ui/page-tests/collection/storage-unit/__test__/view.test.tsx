import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { StorageUnitDetailsPage } from "../../../../pages/collection/storage-unit/view";

const TEST_STRORAGE_DATA = {
  id: "200",
  type: "storage-unit",
  storageUnitChildren: [
    {
      id: "201",
      type: "storage-unit",
      storageUnitChildren: [],
      parentStorageUnit: {
        id: "200",
        type: "storage-unit"
      },
      createdOn: "2021-06-29T18:57:11.937832Z",
      createdBy: "cnc-cm",
      group: "cnc",
      name: "firstLevelChild"
    }
  ],
  createdOn: "2021-06-29T18:56:54.85647Z",
  createdBy: "cnc-cm",
  group: "cnc",
  name: "root"
};

// const mockGet = jest.fn();

const mockGet = jest.fn<any, any>(async (path, params = {}) => {
  switch (path) {
    case "collection-api/storage-unit":
    case "collection-api/storage-unit/200":
      if (params.filter?.rsql === "") {
        return {
          data: [],
          meta: { totalResourceCount: 0 }
        };
      } else if (params.include === "storageUnitChildren,parentStorageUnit") {
        return {
          data: [TEST_STRORAGE_DATA],
          meta: { totalResourceCount: 1 }
        };
      } else if (params.filter?.parentStorageUnit === null) {
        return {
          data: [],
          meta: { totalResourceCount: 0 }
        };
      } else {
        return {
          data: [],
          meta: { totalResourceCount: 0 }
        };
      }

    case "user-api/group":
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders initially with a loading spinner.", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitDetailsPage router={{ query: { id: "200" } } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Shows the data in a tree structure.", async () => {
    const wrapper = mountWithAppContext(
      <StorageUnitDetailsPage router={{ query: { id: "200" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // Initially show only the root node
    expect(wrapper.find(".storage-collapser-icon").text()).toContain("root");

    wrapper.find(".storage-collapser-icon").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Show the first level node after click on root node
    expect(wrapper.find(".storage-collapser-icon").text()).toContain(
      "firstLevelChild"
    );
  });
});
