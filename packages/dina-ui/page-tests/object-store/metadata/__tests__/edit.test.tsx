import { PersistedResource } from "kitsu";
import Select from "react-select/base";
import EditMetadatasPage, {
  BulkMetadataEditRow,
  managedAttributeColumns
} from "../../../../pages/object-store/metadata/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  ManagedAttributeMap,
  Metadata,
  Person,
  License
} from "../../../../types/objectstore-api";

const TEST_METADATAS: PersistedResource<Metadata>[] = [
  {
    acMetadataCreator: {
      displayName: "Mat Poff",
      id: "6e80e42a-bcf6-4062-9db3-946e0f26458f",
      type: "person"
    } as Person,
    acTags: ["tag1"],
    bucket: "testbucket",
    dcType: "Image",
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
    managedAttributeMap: {
      id: "N/A",
      type: "managed-attribute-map",
      values: {
        "a360a695-bbff-4d58-9a07-b6d6c134b208": {
          name: "existing-attribute",
          value: "existingValue"
        }
      }
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

// Pretend the metadata ids were passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => ({
    query: {
      id:
        "6c524135-3c3e-41c1-a057-45afb4e3e7be,3849de16-fee2-4bb1-990d-a4f5de19b48d,31ee7848-b5c1-46e1-bbca-68006d9eda3b"
    }
  })
}));

// Mock out the HandsOnTable which should only be rendered in the browser.
jest.mock("next/dynamic", () => () => {
  return function MockHotTable() {
    return <div>Mock Handsontable</div>;
  };
});

const mockBulkGet = jest.fn(async paths => {
  if ((paths[0] as string).startsWith("/metadata/")) {
    return TEST_METADATAS;
  }
  if ((paths[0] as string).startsWith("/managed-attribute/")) {
    return paths.map(() => ({
      id: "a360a695-bbff-4d58-9a07-b6d6c134b208",
      name: "existing-attribute"
    }));
  }
});

const mockGet = jest.fn(async path => {
  if (path === "metadata") {
    return { data: TEST_METADATAS };
  } else if (path === "objectstore-api/license") {
    return { data: TEST_LICENSES };
  } else {
    return { data: [] };
  }
});

const mockSave = jest.fn(args => args.map(({ resource }) => resource));

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet,
  save: mockSave
};

describe("Metadata bulk edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders the bulk edit page.", async () => {
    const wrapper = mountWithAppContext(<EditMetadatasPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // The 3 metadatas should have been loaded into the table.
    expect(wrapper.find("MockHotTable").prop("data")).toEqual([
      {
        acMetadataCreator:
          "Mat Poff (person/6e80e42a-bcf6-4062-9db3-946e0f26458f)",
        acTags: "tag1",
        dcCreator: "",
        license: "",
        metadata: expect.objectContaining({
          id: "6c524135-3c3e-41c1-a057-45afb4e3e7be"
        })
      },
      {
        acMetadataCreator: "",
        acTags: "tag1, tag2",
        dcCreator: "",
        license: "",
        metadata: expect.objectContaining({
          id: "3849de16-fee2-4bb1-990d-a4f5de19b48d"
        })
      },
      {
        acMetadataCreator: "",
        acTags: "",
        dcCreator: "",
        license:
          "Open Government Licence - Canada (license/open-government-license-canada)",
        metadata: expect.objectContaining({
          id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b"
        })
      }
    ]);
  });

  it("Renders the managed attribute columns into the editable table.", () => {
    const columns = managedAttributeColumns([
      {
        acceptedValues: ["Holotype", "Paratype", "Syntype"],
        id: "83748696-62b3-4db6-99cc-e4f546e7ecd7",
        managedAttributeType: "STRING",
        name: "SpecimenID",
        type: "managed-attribute"
      },
      {
        id: "83748696-62b3-4db6-99cc-e4f546e7ecd7",
        managedAttributeType: "STRING",
        name: "Type Status",
        type: "managed-attribute"
      },
      {
        id: "83748696-62b3-4db6-99cc-e4f546e7ecd7",
        managedAttributeType: "STRING",
        name: "Scientific Name",
        type: "managed-attribute"
      }
    ]);

    expect(columns).toEqual([
      {
        data:
          "metadata.managedAttributeMap.values.83748696-62b3-4db6-99cc-e4f546e7ecd7.value",
        source: ["Holotype", "Paratype", "Syntype"],
        title: "SpecimenID",
        type: "dropdown"
      },
      {
        data:
          "metadata.managedAttributeMap.values.83748696-62b3-4db6-99cc-e4f546e7ecd7.value",
        title: "Type Status"
      },
      {
        data:
          "metadata.managedAttributeMap.values.83748696-62b3-4db6-99cc-e4f546e7ecd7.value",
        title: "Scientific Name"
      }
    ]);
  });

  it("Initializes the editable managed attributes based on what attributes are set on the metadatas.", async () => {
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
        label: "existing-attribute",
        resource: {
          id: "a360a695-bbff-4d58-9a07-b6d6c134b208",
          name: "existing-attribute"
        },
        value: "a360a695-bbff-4d58-9a07-b6d6c134b208"
      }
    ]);
  });

  it("Submits the changed values.", async () => {
    const wrapper = mountWithAppContext(<EditMetadatasPage />, { apiContext });

    await new Promise(setImmediate);
    wrapper.update();

    // Get the table data to directly edit it for the test to simulate how the Handsontable would
    // edit the data.
    const tableData = wrapper
      .find("MockHotTable")
      .prop<BulkMetadataEditRow[]>("data");

    // Update the metadata creator field:
    tableData[1].acMetadataCreator =
      "Mat (person/63eead51-142f-4a67-a596-68fd35a36ed8)";

    // Update the tags:
    tableData[1].acTags = "newTag1, newTag2";

    // Set new managed attribute value:
    (tableData[1].metadata.managedAttributeMap as ManagedAttributeMap).values[
      "4ed1dc15-c931-414a-ab13-cc766fd6fae2"
    ] = { value: "new attr value" };

    wrapper.find("button.bulk-editor-submit-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Only 1 row should have been updated, using 2 operations for the row:
    // - The Metadata is updated with new acMetadataCreator and new tags.
    // - The metadata's managed-attribute-map is udpated with a new attribute value.
    expect(mockSave).lastCalledWith(
      [
        {
          resource: {
            acMetadataCreator: "63eead51-142f-4a67-a596-68fd35a36ed8",
            acTags: ["newTag1", "newTag2"],
            id: "3849de16-fee2-4bb1-990d-a4f5de19b48d",
            type: "metadata"
          },
          type: "metadata"
        },
        {
          resource: {
            metadata: {
              id: "3849de16-fee2-4bb1-990d-a4f5de19b48d",
              type: "metadata"
            },
            type: "managed-attribute-map",
            values: {
              "4ed1dc15-c931-414a-ab13-cc766fd6fae2": {
                value: "new attr value"
              }
            }
          },
          type: "managed-attribute-map"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
  });

  it("Lets you edit the Metadata's license.", async () => {
    const wrapper = mountWithAppContext(<EditMetadatasPage />, { apiContext });

    await new Promise(setImmediate);
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
            dcRights: "",
            id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
            type: "metadata",
            xmpRightsUsageTerms: "",
            xmpRightsWebStatement: ""
          },
          type: "metadata"
        },
        {
          resource: {
            metadata: {
              id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
              type: "metadata"
            },
            type: "managed-attribute-map"
          },
          type: "managed-attribute-map"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );
  });
});
