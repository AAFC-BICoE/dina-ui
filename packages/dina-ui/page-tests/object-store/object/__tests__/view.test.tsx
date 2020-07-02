import { PersistedResource } from "kitsu";
import { FileView } from "../../../../components/file-view/FileView";
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
  managedAttributeMap: {
    id: "N/A",
    type: "managed-attribute-map",
    values: {
      "0763db31-a0c9-43f8-b7fc-705a783c35df": {
        name: "attr1",
        value: "attr1 value"
      },
      "e5b9765e-1246-4119-b4e4-8d2267175662": {
        name: "attr2",
        value: "attr2 value"
      }
    }
  },
  type: "metadata"
};

const mockGet = jest.fn();
const apiContext: any = { apiClient: { get: mockGet } };

// Pretend the metadata id was passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "b794d633-5a37-4628-977c-3a8c9067f7df" } })
}));

describe("Single Stored Object details page", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async () => ({ data: TEST_METADATA }));
  });

  it("Renders the page.", async () => {
    const wrapper = mountWithAppContext(<MetadataViewPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();
  });

  it("Renders the thumbnail if the metadata is a thumbnail type.", async () => {
    const THUMBNAIL_METADATA = { ...TEST_METADATA, acSubType: "THUMBNAIL" };
    mockGet.mockImplementation(async () => ({ data: THUMBNAIL_METADATA }));

    const wrapper = mountWithAppContext(<MetadataViewPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find(FileView)
        .find("img")
        .prop("src")
    ).toEqual(
      "/api/objectstore-api/file/testbucket/cf99c285-0353-4fed-a15d-ac963e0514f3.thumbnail?access_token=test-token"
    );
  });
});
