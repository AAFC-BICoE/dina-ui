import { PersistedResource } from "kitsu";
import ExternalResourceMetadataViewPage from "../../../../dina-ui/pages/object-store/object/external-resource-view";
import { mountWithAppContext } from "common-ui";
import { Metadata } from "../../../../dina-ui/types/objectstore-api/resources/Metadata";
import "@testing-library/jest-dom";

const TEST_METADATA: PersistedResource<Metadata> = {
  acSubtype: "TEST_SUBTYPE",
  bucket: "testbucket",
  dcType: "IMAGE",
  dcFormat: "jpeg",
  xmpRightsWebStatement:
    "https://open.canada.ca/en/open-government-licence-canada",
  id: "25f81de5-bbee-430c-b5fa-71986b70e612",
  type: "metadata",
  resourceExternalURL: "http://agr.gc.ca",
  acCaption: "test caption"
};

const mockGet = jest.fn(async (path) => {
  if (
    path === "objectstore-api/metadata/b794d633-5a37-4628-977c-3a8c9067f7df"
  ) {
    return { data: TEST_METADATA };
  } else if (path === "objectstore-api/managed-attribute?fields=key,name") {
    return { data: [{ managedAttributeKey1: "Value 1" }] };
  } else if (
    path ===
    "objectstore-api/license?filter[url]=https://open.canada.ca/en/open-government-licence-canada"
  ) {
    return {
      data: [
        {
          id: "open-government-licence-canada",
          type: "license",
          url: "https://open.canada.ca/en/open-government-licence-canada",
          titles: {
            en: "Open Government Licence - Canada",
            fr: "Licence du gouvernement ouvert – Canada"
          }
        }
      ]
    };
  }
});
const apiContext: any = {
  apiClient: {
    get: mockGet
  }
};

// Pretend the metadata id was passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "b794d633-5a37-4628-977c-3a8c9067f7df" } })
}));

describe("Stored Object external resource view page", () => {
  it("Renders the page.", async () => {
    const wrapper = mountWithAppContext(<ExternalResourceMetadataViewPage />, {
      apiContext
    });

    await new Promise(setImmediate);

    // Shows the caption
    expect(
      wrapper.getByRole("cell", { name: /test caption/i })
    ).toBeInTheDocument();

    // Shows the resource URL
    expect(
      wrapper.getByRole("cell", { name: /http:\/\/agr\.gc\.ca/i })
    ).toBeInTheDocument();

    // Shows the media format:
    expect(wrapper.getByRole("cell", { name: /jpeg/i })).toBeInTheDocument();
  });
});
