import { PersistedResource } from "kitsu";
import { License, Metadata, Person } from "../../../../types/objectstore-api";
import MetadataEditPage from "../../../../pages/object-store/metadata/single-record-edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";

const mockGet = jest.fn(async path => {
  if (
    path === "objectstore-api/metadata/25f81de5-bbee-430c-b5fa-71986b70e612"
  ) {
    return { data: TEST_METADATA };
  } else if (path === "objectstore-api/license") {
    return { data: TEST_LICENSES };
  } else if (
    path === "objectstore-api/license/open-government-license-canada"
  ) {
    return { data: TEST_LICENSES[0] };
  } else {
    return { data: [] };
  }
});

const mockBulkGet = jest.fn(async paths => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/metadata/")) {
    return TEST_METADATA;
  }
  if ((paths[0] as string).startsWith("/managed-attribute/")) {
    return paths.map(() => ({
      id: "a360a695-bbff-4d58-9a07-b6d6c134b208",
      name: "test-managed-attribute",
      managedAttributeType: "STRING"
    }));
  }
  if ((paths[0] as string).startsWith("/object-upload/")) {
    return paths.map(() => ({
      id: "b4c8d6a6-0332-4f2a-a7b9-68b7898b6486",
      dateTimeDigitized: "2020-12-17T23:37:45.932Z",
      originalFilename: "test-file.png"
    }));
  }
  if (
    (paths[0] as string).startsWith(
      "person/6e80e42a-bcf6-4062-9db3-946e0f26458f"
    )
  ) {
    return paths.map(() => ({
      id: "6e80e42a-bcf6-4062-9db3-946e0f26458f",
      type: "person",
      displayName: "Mat Poff"
    }));
  }
});

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
  dcCreator: {
    displayName: "Mat Poff",
    id: "6e80e42a-bcf6-4062-9db3-946e0f26458f",
    type: "person"
  } as Person,
  acTags: ["tag1", "tag2", "tag3"],
  bucket: "testbucket",
  dcType: "Image",
  orientation: 5,
  fileExtension: ".png",
  fileIdentifier: "9a85b858-f8f0-4a97-99a8-07b2cb759766",
  originalFilename: "test-file.png",
  xmpRightsWebStatement:
    "https://open.canada.ca/en/open-government-licence-canada",
  id: "25f81de5-bbee-430c-b5fa-71986b70e612",
  type: "metadata",
  managedAttributeValues: {
    "a360a695-bbff-4d58-9a07-b6d6c134b208": "test-managed-attribute-value"
  }
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

describe("Metadata single record edit page.", () => {
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
    const wrapper = mountWithAppContext(<MetadataEditPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // Check for the right initial values:
    expect(wrapper.find(".originalFilename-field input").prop("value")).toEqual(
      "test-file.png"
    );
    expect(wrapper.find(".acTags-field textarea").prop("value")).toEqual(
      "tag1, tag2, tag3"
    );
    expect(
      wrapper.find(".managed-attributes-editor input").last().prop("value")
    ).toEqual("test-managed-attribute-value");

    // Set new values:
    wrapper.find(".acTags-field textarea").simulate("change", {
      target: { name: "acTags", value: "new tag 1, new tag 2" }
    });
    wrapper
      .find(".managed-attributes-editor input")
      .last()
      .simulate("change", {
        target: {
          name: "managedAttributeMap.values.39558b3c-02e9-476e-a9c8-7946f8bbff63.value",
          value: "new-managed-attribute-value"
        }
      });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            acTags: ["new tag 1", "new tag 2"],
            bucket: "testbucket",
            dcCreator: {
              displayName: "Mat Poff",
              id: "6e80e42a-bcf6-4062-9db3-946e0f26458f",
              type: "person"
            },
            dcType: "Image",
            orientation: 5,
            fileExtension: ".png",
            fileIdentifier: "9a85b858-f8f0-4a97-99a8-07b2cb759766",
            id: "25f81de5-bbee-430c-b5fa-71986b70e612",
            managedAttributeValues: {
              "a360a695-bbff-4d58-9a07-b6d6c134b208":
                "new-managed-attribute-value"
            },
            originalFilename: "test-file.png",
            type: "metadata",
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
