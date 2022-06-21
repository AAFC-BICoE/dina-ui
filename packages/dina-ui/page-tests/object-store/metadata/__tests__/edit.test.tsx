import { deleteFromStorage, writeStorage } from "@rehooks/local-storage";
import { PersistedResource } from "kitsu";
import { BULK_EDIT_IDS_KEY } from "common-ui";
import Select from "react-select/base";
import {
  BulkMetadataEditRow,
  managedAttributeColumns
} from "../../../../components/object-store";
import { DefaultValuesConfig } from "../../../../components/object-store/metadata-bulk-editor/custom-default-values/model-types";
import EditMetadatasPage from "../../../../pages/object-store/metadata/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { License, Metadata, Person } from "../../../../types/objectstore-api";
import { BULK_ADD_IDS_KEY } from "../../../../pages/object-store/upload";

const TEST_METADATAS: PersistedResource<Metadata>[] = [
  {
    acSubtype: "IMAGE-SUBTYPE",
    dcCreator: {
      displayName: "Mat Poff",
      id: "6e80e42a-bcf6-4062-9db3-946e0f26458f",
      type: "person"
    } as Person,
    acTags: ["tag1"],
    bucket: "testbucket",
    dcType: "Image",
    orientation: 5,
    fileExtension: ".png",
    fileIdentifier: "9a85b858-f8f0-4a97-99a8-07b2cb759766",
    id: "6c524135-3c3e-41c1-a057-45afb4e3e7be",
    type: "metadata"
  },
  {
    acTags: ["tag1", "tag2"],
    bucket: "testbucket",
    dcType: "Image",
    fileExtension: ".png",
    fileIdentifier: "72b4b907-c486-49a8-ab58-d01541d83eff",
    id: "3849de16-fee2-4bb1-990d-a4f5de19b48d",
    managedAttributes: {
      existing_attribute: "existingValue"
    },
    type: "metadata"
  },
  // Only the third test Metadata has a license:
  {
    bucket: "testbucket",
    dcType: "Image",
    fileExtension: ".png",
    fileIdentifier: "54bc37d7-17c4-4f70-8b33-2def722c6e97",
    xmpRightsWebStatement:
      "https://open.canada.ca/en/open-government-licence-canada",
    id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
    type: "metadata"
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

const mockUseRouter = jest.fn();

// Pretend the metadata ids were passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter()
}));

// Mock out the HandsOnTable which should only be rendered in the browser.
jest.mock("next/dynamic", () => () => {
  return function MockHotTable() {
    return <div>Mock Handsontable</div>;
  };
});

const mockBulkGet = jest.fn(async paths => {
  if (paths.length === 0) {
    return [];
  }
  if ((paths[0] as string).startsWith("/metadata/")) {
    return TEST_METADATAS;
  }
  if ((paths[0] as string).startsWith("/managed-attribute/")) {
    return paths.map(() => ({
      id: "a360a695-bbff-4d58-9a07-b6d6c134b208",
      name: "Existing Attribute",
      key: "existing_attribute"
    }));
  }
  if ((paths[0] as string).startsWith("/object-upload/")) {
    return paths.map(() => ({
      id: "b4c8d6a6-0332-4f2a-a7b9-68b7898b6486",
      dateTimeDigitized: "2020-12-17T23:37:45.932Z",
      originalFilename: "test-file.png"
    }));
  }
});

const mockGet = jest.fn(async (path, params) => {
  if (path === "metadata") {
    return { data: TEST_METADATAS };
  } else if (path === "objectstore-api/license") {
    return { data: TEST_LICENSES };
  } else if (
    path === "objectstore-api/managed-attribute" &&
    params?.filter?.key === "existing_attribute"
  ) {
    return {
      data: [
        {
          id: "a360a695-bbff-4d58-9a07-b6d6c134b208",
          name: "Existing Attribute",
          key: "existing_attribute"
        }
      ]
    };
  } else if (path === "objectstore-api/config/default-values") {
    return {
      data: {
        values: [
          {
            type: "metadata",
            attribute: "xmpRightsWebStatement",
            value: "default-value"
          },
          {
            type: "metadata",
            attribute: "dcRights",
            value: "default-value"
          },
          {
            type: "metadata",
            attribute: "xmpRightsOwner",
            value: "default-value"
          },
          {
            type: "metadata",
            attribute: "xmpRightsUsageTerms",
            value: "default-value"
          }
        ]
      }
    };
  } else {
    return { data: [] };
  }
});

const mockSave = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet,
  save: mockSave
};

const STORAGE_KEY = "metadata_defaultValuesConfigs";

const TEST_CONFIGS: DefaultValuesConfig[] = [
  {
    name: "initial-name",
    createdOn: "test-date",
    defaultValueRules: [
      {
        source: { type: "text", text: "test-caption-text" },
        targetField: "acCaption"
      },
      {
        source: { type: "objectUploadField", field: "originalFilename" },
        targetField: "acTags"
      }
    ]
  }
];

const METADATA_IDS = [
  "6c524135-3c3e-41c1-a057-45afb4e3e7b",
  "3849de16-fee2-4bb1-990d-a4f5de19b48d",
  "31ee7848-b5c1-46e1-bbca-68006d9eda3b"
];

describe("Metadata bulk edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockImplementation(args => args.map(({ resource }) => resource));

    // Reset "local storage":
    deleteFromStorage(STORAGE_KEY);
    deleteFromStorage(BULK_EDIT_IDS_KEY);
    deleteFromStorage(BULK_ADD_IDS_KEY);

    writeStorage(STORAGE_KEY, TEST_CONFIGS);
  });

  it("Renders the bulk edit page (edit existing data mode).", async () => {
    writeStorage(BULK_EDIT_IDS_KEY, METADATA_IDS);
    const wrapper = mountWithAppContext(<EditMetadatasPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // The 3 metadatas should have been loaded into the table.
    expect(wrapper.find("MockHotTable").prop("data")).toEqual([
      {
        dcCreator: "Mat Poff (person/6e80e42a-bcf6-4062-9db3-946e0f26458f)",
        acSubtype: "IMAGE-SUBTYPE",
        acTags: "tag1",
        license: "",
        metadata: expect.objectContaining({
          id: "6c524135-3c3e-41c1-a057-45afb4e3e7be"
        })
      },
      {
        dcCreator: "",
        acSubtype: "",
        acTags: "tag1, tag2",
        license: "",
        metadata: expect.objectContaining({
          id: "3849de16-fee2-4bb1-990d-a4f5de19b48d"
        })
      },
      {
        acSubtype: "",
        dcCreator: "",
        acTags: "",
        license:
          "Open Government Licence - Canada (license/open-government-license-canada)",
        metadata: expect.objectContaining({
          id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b"
        })
      }
    ]);
  });

  it("Renders the managed attribute columns into the editable table (edit existing data mode).", () => {
    writeStorage(BULK_EDIT_IDS_KEY, METADATA_IDS);
    const columns = managedAttributeColumns([
      {
        acceptedValues: ["Holotype", "Paratype", "Syntype"],
        id: "83748696-62b3-4db6-99cc-e4f546e7ecd7",
        managedAttributeType: "STRING",
        name: "SpecimenID",
        key: "Specimen_ID",
        type: "managed-attribute"
      },
      {
        id: "83748696-62b3-4db6-99cc-e4f546e7ecd7",
        managedAttributeType: "STRING",
        name: "Type Status",
        key: "type_status",
        type: "managed-attribute"
      },
      {
        id: "83748696-62b3-4db6-99cc-e4f546e7ecd7",
        managedAttributeType: "STRING",
        name: "Scientific Name",
        key: "scientific_name",
        type: "managed-attribute"
      }
    ]);

    expect(columns).toEqual([
      {
        data: "metadata.managedAttributes.Specimen_ID",
        source: ["Holotype", "Paratype", "Syntype"],
        title: "SpecimenID",
        type: "dropdown"
      },
      {
        data: "metadata.managedAttributes.type_status",
        title: "Type Status"
      },
      {
        data: "metadata.managedAttributes.scientific_name",
        title: "Scientific Name"
      }
    ]);
  });

  it("Initializes the editable managed attributes based on what attributes are set on the metadatas (edit existing data mode).", async () => {
    writeStorage(BULK_EDIT_IDS_KEY, METADATA_IDS);
    const wrapper = mountWithAppContext(<EditMetadatasPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find(".editable-managed-attributes-select")
        .find(Select)
        .prop("value")
    ).toEqual([
      {
        label: "Existing Attribute",
        resource: {
          id: "a360a695-bbff-4d58-9a07-b6d6c134b208",
          name: "Existing Attribute",
          key: "existing_attribute"
        },
        value: "a360a695-bbff-4d58-9a07-b6d6c134b208"
      }
    ]);
  });

  it("Submits the changed values (edit existing data mode).", async () => {
    writeStorage(BULK_EDIT_IDS_KEY, METADATA_IDS);
    const wrapper = mountWithAppContext(<EditMetadatasPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // Get the table data to directly edit it for the test to simulate how the Handsontable would
    // edit the data.
    const tableData = wrapper
      .find("MockHotTable")
      .prop<BulkMetadataEditRow[]>("data");

    // Update the acSubtype field:
    tableData[1].acSubtype = "CHANGED-SUBTYPE (object-subtype/123123123)";

    // Update the metadata creator field:
    tableData[1].dcCreator =
      "Mat (person/63eead51-142f-4a67-a596-68fd35a36ed8)";

    // Update the tags:
    tableData[1].acTags = "newTag1, newTag2";

    // Set new managed attribute value:
    (tableData[1].metadata.managedAttributes as Record<string, string>)[
      "4ed1dc15-c931-414a-ab13-cc766fd6fae2"
    ] = "new attr value";

    wrapper.find("button.bulk-editor-submit-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Only 1 row should have been updated, using 2 operations for the row:
    // - The Metadata is updated with new dcCreator and new tags.
    // - The metadata's managedAttributes is updated with a new attribute value.
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            acSubtype: "CHANGED-SUBTYPE",
            dcCreator: {
              id: "63eead51-142f-4a67-a596-68fd35a36ed8",
              type: "person"
            },
            acTags: ["newTag1", "newTag2"],
            managedAttributes: {
              "4ed1dc15-c931-414a-ab13-cc766fd6fae2": "new attr value",
              existing_attribute: "existingValue"
            },
            id: "3849de16-fee2-4bb1-990d-a4f5de19b48d",
            type: "metadata"
          },
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
  });

  it("Lets you edit the Metadata's license (edit existing data mode).", async () => {
    writeStorage(BULK_EDIT_IDS_KEY, METADATA_IDS);
    const wrapper = mountWithAppContext(<EditMetadatasPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // Get the table data to directly edit it for the test to simulate how the Handsontable would
    // edit the data.
    const tableData = wrapper
      .find("MockHotTable")
      .prop<BulkMetadataEditRow[]>("data");

    // The existing license on test Metadata#3 should be encoded properly into the table row:
    expect(tableData[2].license).toEqual(
      "Open Government Licence - Canada (license/open-government-license-canada)"
    );

    // Change the license:
    tableData[2].license =
      "universal-public-domain-dedication-1 (license/CC0 1.0 Universal (CC0 1.0) Public Domain Dedication)";

    // Submit the spreadsheet:
    wrapper.find("button.bulk-editor-submit-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
            type: "metadata",
            xmpRightsUsageTerms: "",
            xmpRightsWebStatement: "",
            managedAttributes: {}
          },
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
  });

  it("Loads initial Metadata fields and lets you submit new Metadatas (edit new data mode)", async () => {
    writeStorage(BULK_ADD_IDS_KEY, ["b4c8d6a6-0332-4f2a-a7b9-68b7898b6486"]);
    mockUseRouter.mockReturnValue({
      query: {
        group: "example-group"
      }
    });

    mockSave.mockImplementation(args =>
      args.map(({ resource }) => {
        const resourceCopy = { ...resource };
        // When submitting a new resource, give it a new ID:
        if (!resourceCopy.id) {
          resourceCopy.id = "00000000-0000-0000-0000-000000000000";
        }
        return resourceCopy;
      })
    );

    const wrapper = mountWithAppContext(<EditMetadatasPage />, {
      apiContext,
      accountContext: {
        // acMetadataCreator should be set as the logged-in user's agentId:
        agentId: "6ee06232-e801-4cd5-8fc5-127aa14c3ace"
      }
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Get the table data to directly edit it for the test to simulate how the Handsontable would
    // edit the data.
    const tableData = wrapper
      .find("MockHotTable")
      .prop<BulkMetadataEditRow[]>("data");

    // Expect the initial data:
    expect(tableData).toEqual([
      {
        acSubtype: "",
        acTags: "",
        dcCreator: "",
        // Default license is loaded:
        license:
          "Open Government Licence - Canada (license/open-government-license-canada)",
        metadata: {
          acCaption: "test-file.png",
          acDigitizationDate: "2020-12-17T23:37:45+00:00",
          acMetadataCreator: {
            id: "6ee06232-e801-4cd5-8fc5-127aa14c3ace",
            type: "person"
          },
          bucket: "example-group",
          dcRights: "default-value",
          fileIdentifier: "b4c8d6a6-0332-4f2a-a7b9-68b7898b6486",
          originalFilename: "test-file.png",
          // Default rights fields are loaded from the API endpoint:
          xmpRightsOwner: "default-value",
          xmpRightsUsageTerms: "default-value",
          xmpRightsWebStatement: "default-value",
          publiclyReleasable: true, // Default Value
          type: "metadata"
        },
        // The ObjectUpload is included in the initial table data to provide values for Default Values Configs:
        objectUpload: {
          dateTimeDigitized: "2020-12-17T23:37:45.932Z",
          id: "b4c8d6a6-0332-4f2a-a7b9-68b7898b6486",
          originalFilename: "test-file.png"
        }
      }
    ]);

    tableData[0].metadata.acCaption = "test-caption";

    // Submit the spreadsheet:
    wrapper.find("button.bulk-editor-submit-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              acCaption: "test-caption",
              acDigitizationDate: "2020-12-17T23:37:45+00:00",
              acMetadataCreator: {
                id: "6ee06232-e801-4cd5-8fc5-127aa14c3ace",
                type: "person"
              },
              dcRights: "default-value",
              bucket: "example-group",
              fileIdentifier: "b4c8d6a6-0332-4f2a-a7b9-68b7898b6486",
              originalFilename: "test-file.png",
              xmpRightsOwner: "default-value",
              xmpRightsUsageTerms: "default-value",
              xmpRightsWebStatement: "default-value",
              publiclyReleasable: true, // Default Value
              type: "metadata"
            },
            type: "metadata"
          }
        ],
        {
          apiBaseUrl: "/objectstore-api"
        }
      ]
    ]);
  });

  it("Lets you set custom values from a pre-made config", async () => {
    writeStorage(BULK_ADD_IDS_KEY, ["b4c8d6a6-0332-4f2a-a7b9-68b7898b6486"]);
    mockUseRouter.mockReturnValue({
      query: {
        group: "example-group",

        // The index of the Config to use:
        defaultValuesConfig: "0"
      }
    });

    const wrapper = mountWithAppContext(<EditMetadatasPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // Get the table data to directly edit it for the test to simulate how the Handsontable would
    // edit the data.
    const tableData = wrapper
      .find("MockHotTable")
      .prop<BulkMetadataEditRow[]>("data");

    expect(tableData).toEqual([
      // Custom default values should be set here:
      expect.objectContaining({
        acCaption: "test-caption-text",
        acTags: "test-file.png"
      })
    ]);
  });
});
