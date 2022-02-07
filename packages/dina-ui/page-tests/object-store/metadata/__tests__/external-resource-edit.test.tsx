import { PersistedResource } from "kitsu";
import {
  License,
  Metadata,
  ObjectSubtype
} from "../../../../types/objectstore-api";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import ExternalResourceMetadataPage from "../../../../pages/object-store/metadata/external-resource-edit";

const mockGet = jest.fn(async path => {
  switch (path) {
    case "objectstore-api/metadata/25f81de5-bbee-430c-b5fa-71986b70e612":
      return { data: TEST_METADATA };
    case "objectstore-api/license":
      return { data: TEST_LICENSES };
    case "objectstore-api/license/open-government-license-canada":
      return { data: TEST_LICENSES[0] };
    case "objectstore-api/object-subtype":
      return { data: TEST_ACSUBTYPE };
  }
});

const mockBulkGet = jest.fn(async paths => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/metadata/")) {
    return TEST_METADATA;
  }
});

const TEST_ACSUBTYPE: PersistedResource<ObjectSubtype>[] = [
  {
    dcType: "Moving Image",
    acSubtype: "MOVING_IMAGE",
    type: "object-subtype",
    uuid: "83efee8e-3091-4ae5-b55f-73589f8d586e",
    id: "1"
  }
];

const TEST_LICENSES: PersistedResource<License>[] = [
  {
    id: "open-government-license-canada",
    type: "license",
    url: "https://open.canada.ca/en/open-government-licence-canada",
    titles: {
      en: "Open Government Licence - Canada",
      fr: "Licence du gouvernement ouvert – Canada"
    }
  }
];

const TEST_METADATA: PersistedResource<Metadata> = {
  acSubtype: "TEST_SUBTYPE",
  bucket: "testbucket",
  dcType: "Image",
  xmpRightsWebStatement:
    "https://open.canada.ca/en/open-government-licence-canada",
  id: "25f81de5-bbee-430c-b5fa-71986b70e612",
  type: "metadata",
  resourceExternalURI: "http://agr.gc.ca "
};

const mockSave = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet,
  save: mockSave
};

const mockUseRouter = jest.fn();

// Pretend the metadata ids were passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter()
}));

describe("Metadata external resource edit page.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockImplementation(args => args.map(({ resource }) => resource));
    mockUseRouter.mockReturnValue({
      push: () => undefined,
      query: {
        id: "25f81de5-bbee-430c-b5fa-71986b70e612"
      }
    });
  });

  it("Lets you edit the Metadata.", async () => {
    const wrapper = mountWithAppContext(<ExternalResourceMetadataPage />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Check for the right initial values:
    expect(wrapper.find(".acSubtype-field Select").prop<any>("value")).toEqual({
      label: "TEST_SUBTYPE",
      resource: {
        acSubtype: "TEST_SUBTYPE",
        id: "id-unavailable",
        type: "object-subtype"
      },
      value: "id-unavailable"
    });

    expect(wrapper.find(".dcType-field Select").prop("value")).toEqual({
      label: "Image",
      value: "Image"
    });

    // Set new values:
    wrapper.find(".dcType-field Select").prop<any>("onChange")({
      value: "MOVING_IMAGE"
    });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            acSubtype: "TEST_SUBTYPE",
            bucket: "testbucket",
            dcType: "MOVING_IMAGE",
            id: "25f81de5-bbee-430c-b5fa-71986b70e612",
            type: "metadata",
            resourceExternalURI: "http://agr.gc.ca ",
            xmpRightsUsageTerms: "",
            xmpRightsWebStatement:
              "https://open.canada.ca/en/open-government-licence-canada"
          },
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
  });
});
