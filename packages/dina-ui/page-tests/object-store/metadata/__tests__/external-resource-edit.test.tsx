import { PersistedResource } from "kitsu";
import {
  License,
  MediaType,
  Metadata,
  ObjectSubtype
} from "../../../../types/objectstore-api";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import ExternalResourceMetadataPage from "../../../../pages/object-store/metadata/external-resource-edit";
import Select from "react-select/base";
import { ResourceSelectField } from "common-ui";

const mockGet = jest.fn(async (path) => {
  switch (path) {
    case "objectstore-api/metadata/undefined":
      return {};
    case "objectstore-api/metadata/25f81de5-bbee-430c-b5fa-71986b70e612?include=dcCreator,derivatives":
      return { data: TEST_METADATA };
    case "objectstore-api/license":
      return { data: TEST_LICENSES };
    case "objectstore-api/license/open-government-license-canada":
      return { data: TEST_LICENSES[0] };
    case "objectstore-api/object-subtype":
      return { data: TEST_ACSUBTYPE };
    case "objectstore-api/media-type":
      return { data: TEST_MEDIATYPE };
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/metadata/")) {
    return TEST_METADATA;
  }
});

const TEST_MEDIATYPE: PersistedResource<MediaType>[] = [
  {
    id: "image/jpeg",
    mediaType: "image/jpeg",
    type: "media-type"
  },
  {
    id: "image/png",
    mediaType: "image/png",
    type: "media-type"
  }
];

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
  resourceExternalURL: "http://agr.gc.ca ",
  acCaption: "test caption"
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
  });

  it("Lets you add a new external resource metadata.", async () => {
    mockUseRouter.mockReturnValue({
      push: () => undefined,
      query: { id: undefined }
    });

    const wrapper = mountWithAppContext(<ExternalResourceMetadataPage />, {
      apiContext
    });
    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find(".dcFormat-field input").first().prop("value")
    ).toBeFalsy();

    expect(
      wrapper.find(".fileExtension-field input").first().prop("value")
    ).toBeFalsy();

    expect(
      wrapper.find(".resourceExternalURL-field input").first().prop("value")
    ).toBeFalsy();

    expect(
      wrapper.find(".acCaption-field input").first().prop("value")
    ).toBeFalsy();

    // Type a search into the media format search.
    wrapper
      .find(".dcFormat-field input")
      .first()
      .simulate("change", {
        target: {
          value: "image/jpeg"
        }
      });

    await new Promise(setImmediate);
    wrapper.update();

    // Open the dropdown menu.
    wrapper
      .find(".dcFormat-field input")
      .first()
      .simulate("mouseDown", { button: 0 });

    // Select the first result in the list. Should only be one result.
    wrapper.find(".react-select__option").first().simulate("click");

    // Set values:
    wrapper
      .find(".fileExtension-field input")
      .first()
      .simulate("change", {
        target: {
          value: ".jpg"
        }
      });

    wrapper
      .find(".resourceExternalURL-field input")
      .first()
      .simulate("change", {
        target: {
          value: "http://agr.gc.ca"
        }
      });

    wrapper
      .find(".acCaption-field input")
      .first()
      .simulate("change", {
        target: {
          value: "test caption"
        }
      });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).toBeCalledWith(
      [
        {
          resource: {
            bucket: "aafc",
            dcFormat: "image/jpeg",
            fileExtension: ".jpg",
            acSubtype: null,
            acCaption: "test caption",
            resourceExternalURL: "http://agr.gc.ca"
          },
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
  });

  it("Lets you edit an existing external resource metadata.", async () => {
    mockSave.mockImplementation((args) => args.map(({ resource }) => resource));
    mockUseRouter.mockReturnValue({
      push: () => undefined,
      query: {
        id: "25f81de5-bbee-430c-b5fa-71986b70e612"
      }
    });
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
            resourceExternalURL: "http://agr.gc.ca ",
            xmpRightsUsageTerms: "",
            xmpRightsWebStatement:
              "https://open.canada.ca/en/open-government-licence-canada",
            acCaption: "test caption"
          },
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
  });
});
