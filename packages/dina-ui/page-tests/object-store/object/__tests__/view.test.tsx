import { PersistedResource } from "kitsu";
import MetadataViewPage from "../../../../pages/object-store/object/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Metadata } from "../../../../types/objectstore-api";

const TEST_METADATA: PersistedResource<Metadata> = {
  acTags: ["tag1", "tag2"],
  bucket: "testbucket",
  dcType: "Image",
  fileExtension: ".png",
  fileIdentifier: "cf99c285-0353-4fed-a15d-ac963e0514f3",
  id: "232eda40-dc97-4255-91c4-f30485e2c707",
  acCaption: "Test Caption",
  managedAttributes: {
    "0763db31-a0c9-43f8-b7fc-705a783c35df": "attr1 value",
    "e5b9765e-1246-4119-b4e4-8d2267175662": "attr2 value"
  },
  type: "metadata"
};

const TEST_MANAGED_ATTRIBUTES = [
  {
    id: "2c854835-f5b0-4258-8475-16c986810083",
    type: "managed-attribute",
    name: "attr1 value",
    key: "0763db31-a0c9-43f8-b7fc-705a783c35df"
  },
  {
    id: "f04cff05-50d8-4544-a620-30993ed44736",
    type: "managed-attribute",
    name: "attr2 value",
    key: "e5b9765e-1246-4119-b4e4-8d2267175662"
  }
];

const mockBulkGet = jest.fn(async (paths) =>
  paths.map((path) => {
    switch (path) {
      case "object-upload/cf99c285-0353-4fed-a15d-ac963e0514f3":
        return {
          id: "cf99c285-0353-4fed-a15d-ac963e0514f3",
          type: "object-upload",
          exif: {
            Flash: "Flash did not fire"
          }
        };
    }
  })
);

const mockGet = jest.fn(async (path) => {
  if (path.startWith("objectstore-api/managed-attribute"))
    return { data: TEST_MANAGED_ATTRIBUTES };
  else return { data: TEST_METADATA };
});
const apiContext: any = { apiClient: { get: mockGet }, bulkGet: mockBulkGet };

// Pretend the metadata id was passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "b794d633-5a37-4628-977c-3a8c9067f7df" } })
}));

describe("Single Stored Object details page", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async (path: string) => {
      if (path.startsWith("objectstore-api/managed-attribute"))
        return { data: TEST_MANAGED_ATTRIBUTES };
      else return { data: TEST_METADATA };
    });
  });

  it("Renders the page.", async () => {
    const wrapper = mountWithAppContext(
      <MetadataViewPage reloadLastSearch={false} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".metadata-caption").text()).toEqual(
      "Caption: Test Caption"
    );

    // Shows the EXIF data:
    expect(wrapper.contains("Flash did not fire")).toEqual(true);
  });
});
