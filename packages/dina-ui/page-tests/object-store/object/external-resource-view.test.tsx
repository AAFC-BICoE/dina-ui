import { PersistedResource } from "kitsu";
import ExternalResourceMetadataViewPage from "../../../../dina-ui/pages/object-store/object/external-resource-view";
import { mountWithAppContext } from "../../../../dina-ui/test-util/mock-app-context";
import { Metadata } from "../../../../dina-ui/types/objectstore-api/resources/Metadata";

const TEST_METADATA: PersistedResource<Metadata> = {
  acSubtype: "TEST_SUBTYPE",
  bucket: "testbucket",
  dcType: "Image",
  dcFormat: "jpeg",
  xmpRightsWebStatement:
    "https://open.canada.ca/en/open-government-licence-canada",
  id: "25f81de5-bbee-430c-b5fa-71986b70e612",
  type: "metadata",
  resourceExternalURL: "http://agr.gc.ca",
  acCaption: "test caption"
};

const mockGet = jest.fn();
const apiContext: any = { apiClient: { get: mockGet } };

// Pretend the metadata id was passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "b794d633-5a37-4628-977c-3a8c9067f7df" } })
}));

describe("Stored Object external resource view page", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async () => ({ data: TEST_METADATA }));
  });

  it("Renders the page.", async () => {
    const wrapper = mountWithAppContext(<ExternalResourceMetadataViewPage />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the caption
    expect(wrapper.contains("test caption")).toBeTruthy();

    // Shows the resource URL
    expect(wrapper.contains("http://agr.gc.ca")).toEqual(true);

    // Shows the media format:
    expect(wrapper.contains("jpeg")).toEqual(true);
  });
});
