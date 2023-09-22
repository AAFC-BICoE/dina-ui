import CollectionDetailsPage from "../../../pages/collection/collection/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Collection } from "../../../types/collection-api";

const TEST_COLLECTION: Collection = {
  id: "123",
  type: "collection",
  name: "test collection",
  code: "test-code",
  group: "cnc",
  institution: { id: "1", type: "institution", name: "test institution" }
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collection/123":
      return { data: TEST_COLLECTION };
    case "user-api/group":
      return [];
  }
});

// Mock API requests:
const apiContext = {
  apiClient: { get: mockGet }
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "123" } })
}));

describe("Collection view page", () => {
  it("Renders the Collection details", async () => {
    const wrapper = mountWithAppContext(<CollectionDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".name-field .field-view").text()).toEqual(
      "test collection"
    );
  });
});
