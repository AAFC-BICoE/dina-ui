import {
  BulkDeleteButton,
  BulkSelectableFormValues,
  BULK_EDIT_IDS_KEY,
  DinaForm
} from "common-ui";
import { PersistedResource } from "kitsu";
import { Group } from "../../../../types/user-api";
import MetadataListPage from "../../../../pages/object-store/object/list";
import { mountWithAppContext } from "common-ui";
import { Metadata, Person } from "../../../../types/objectstore-api";
import { ObjectUpload } from "../../../../types/objectstore-api/resources/ObjectUpload";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { waitFor, within } from "@testing-library/react";

const TEST_PERSON: PersistedResource<Person> = {
  id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
  displayName: "test agent",
  type: "person"
};

const TEST_GROUP: PersistedResource<Group>[] = [
  {
    id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
    type: "group",
    name: "test group",
    path: " test path",
    labels: { fr: "CNCFR" }
  }
];

const MOCK_INDEX_MAPPING_RESP = {
  data: {
    indexName: "dina_object_store_index",
    attributes: [
      {
        name: "originalFilename",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "bucket",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "createdBy",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "acCaption",
        type: "text",
        path: "data.attributes"
      },
      {
        name: "id",
        type: "text",
        path: "data"
      },
      {
        name: "type",
        type: "text",
        path: "data"
      },
      {
        name: "createdOn",
        type: "date",
        path: "data.attributes"
      }
    ],
    relationships: []
  }
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "objectstore-api/metadata":
      return { data: TEST_METADATA };
    case "objectstore-api/object-upload":
      return { data: TEST_OBJECTUPLOAD };
    case "agent-api/person":
      return { data: TEST_PERSON };
    case "search-api/search-ws/mapping":
      return MOCK_INDEX_MAPPING_RESP;
    case "user-api/group":
      return TEST_GROUP;
    case "user-api/user-preference":
      return USER_PREFERENCE;
    case "objectstore-api/managed-attribute":
      return { data: [] };
  }
});

const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return TEST_ELASTIC_SEARCH_RESPONSE;
  }
});

const METADATA_UUID1 = "6c524135-3c3e-41c1-a057-45afb4e3e7be";
const METADATA_UUID2 = "3849de16-fee2-4bb1-990d-a4f5de19b48d";
const METADATA_UUID3 = "31ee7848-b5c1-46e1-bbca-68006d9eda3b";

// This will be used in the future with the fallback.
const TEST_METADATA: PersistedResource<Metadata>[] = [
  {
    acTags: ["tag1"],
    bucket: "testbucket",
    dcType: "IMAGE",
    fileExtension: ".png",
    fileIdentifier: "9a85b858-f8f0-4a97-99a8-07b2cb759766",
    id: METADATA_UUID1,
    originalFilename: "file1.png",
    type: "metadata"
  },
  {
    acTags: ["tag1", "tag2"],
    bucket: "testbucket",
    dcType: "IMAGE",
    fileExtension: ".png",
    fileIdentifier: "72b4b907-c486-49a8-ab58-d01541d83eff",
    id: METADATA_UUID2,
    originalFilename: "file2.png",
    type: "metadata"
  },
  {
    bucket: "testbucket",
    dcType: "IMAGE",
    fileExtension: ".png",
    fileIdentifier: "54bc37d7-17c4-4f70-8b33-2def722c6e97",
    id: METADATA_UUID3,
    type: "metadata"
  }
];

const USER_PREFERENCE = {
  data: [],
  meta: { totalResourceCount: 0, moduleVersion: "0.11-SNAPSHOT" }
};

const TEST_ELASTIC_SEARCH_RESPONSE = {
  data: {
    hits: {
      total: {
        value: 3
      },
      hits: [
        {
          _source: {
            data: {
              id: METADATA_UUID1,
              type: "metadata",
              attributes: {
                acTags: ["tag1"],
                bucket: "testbucket",
                dcType: "Image",
                fileExtension: ".png",
                fileIdentifier: "9a85b858-f8f0-4a97-99a8-07b2cb759766",
                originalFilename: "file1.png"
              }
            }
          }
        },
        {
          _source: {
            data: {
              id: METADATA_UUID2,
              type: "metadata",
              attributes: {
                acTags: ["tag1", "tag2"],
                bucket: "testbucket",
                dcType: "Image",
                fileExtension: ".png",
                fileIdentifier: "72b4b907-c486-49a8-ab58-d01541d83eff",
                originalFilename: "file2.png"
              }
            }
          }
        },
        {
          _source: {
            data: {
              id: METADATA_UUID3,
              type: "metadata",
              attributes: {
                bucket: "testbucket",
                dcType: "Image",
                fileExtension: ".png",
                fileIdentifier: "54bc37d7-17c4-4f70-8b33-2def722c6e97"
              }
            }
          }
        }
      ]
    }
  }
};

const exifData = new Map().set("date original created", "2000, Jan 8");
const TEST_OBJECTUPLOAD: PersistedResource<ObjectUpload> = {
  id: METADATA_UUID3,
  fileIdentifier: "54bc37d7-17c4-4f70-8b33-2def722c6e97",
  sizeInBytes: 500,
  originalFilename: "test.png",
  metaFileEntryVersion: "1",
  sha1Hex: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  receivedMediaType: "image/png",
  detectedMediaType: "image/png",
  detectedFileExtension: "png",
  evaluatedMediaType: "image/png",
  evaluatedFileExtension: "png",
  exif: Object.fromEntries(exifData),
  type: "object-upload"
};

const mockDoOperations = jest.fn();

const mockDelete = jest.fn();

const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet,
      post: mockPost,
      delete: mockDelete
    }
  },
  doOperations: mockDoOperations
};

const mockPush = jest.fn();
const mockReload = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush, reload: mockReload })
}));

describe("Metadata List Page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();

    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))
    });
  });

  it("Renders the metadata table by default.", async () => {
    const wrapper = mountWithAppContext(<MetadataListPage />, { apiContext });

    await waitFor(() => {
      // Tests that 1 table renders on the page by default
      expect(wrapper.getByRole("table")).toBeInTheDocument();
    });
  });

  it("Provides a toggle to see the gallery view.", async () => {
    const wrapper = mountWithAppContext(<MetadataListPage />, { apiContext });

    await waitFor(() => {
      // Renders initially with the table view:
      expect(wrapper.getByRole("radio", { name: /table/i })).toBeChecked();
    });

    // Switch to gallery view.
    userEvent.click(wrapper.getByRole("radio", { name: /gallery/i }));

    await waitFor(
      () => {
        // Get the cell that contains the list
        const CELL = wrapper.getByRole("cell", {
          name: /no thumbnail available/i
        });
        // Tests gallery view as a list in the table
        expect(within(CELL).getByRole("list")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("Lets you select a list of metadatas and route to the edit page.", async () => {
    const wrapper = mountWithAppContext(<MetadataListPage />, { apiContext });

    await waitFor(() => {
      // Wait for checkboxes to be rendered
      expect(
        wrapper.getAllByRole("checkbox", { name: /select/i }).length
      ).toBeGreaterThan(0);
    });

    // Select all 3 metadatas to edit.
    userEvent.click(wrapper.getAllByRole("checkbox", { name: /select/i })[0]);
    userEvent.click(wrapper.getAllByRole("checkbox", { name: /select/i })[1]);
    userEvent.click(wrapper.getAllByRole("checkbox", { name: /select/i })[2]);

    // Click the bulk edit button:
    userEvent.click(wrapper.getByRole("button", { name: /edit selected/i }));

    await waitFor(() => {
      // Router push should have been called with the 3 IDs.
      expect(mockPush).lastCalledWith({
        pathname: "/object-store/metadata/bulk-edit"
      });
    });

    expect(localStorage.getItem(BULK_EDIT_IDS_KEY)).toEqual(
      '["' +
        METADATA_UUID1 +
        '","' +
        METADATA_UUID2 +
        '","' +
        METADATA_UUID3 +
        '"]'
    );
  });

  it("Shows a metadata preview when you click the 'Preview' button.", async () => {
    const wrapper = mountWithAppContext(<MetadataListPage />, { apiContext });

    await waitFor(() => {
      // Preview section is initially hidden (3 + the radio button group label "Preview Mode")
      expect(wrapper.getAllByText(/preview/i)).toHaveLength(4);
    });

    // Click the preview button:
    userEvent.click(wrapper.getAllByRole("button", { name: /preview/i })[0]);

    await waitFor(() => {
      // Preview section is visible: (5th preview element)
      expect(wrapper.getAllByText(/preview/i)).toHaveLength(5);
    });
  });

  it("Disables the bulk edit button when no Metadatas are selected.", async () => {
    const wrapper = mountWithAppContext(<MetadataListPage />, { apiContext });

    await waitFor(() => {
      // Disabled initially because none are selected:
      expect(
        wrapper.getByRole("button", { name: /edit selected/i })
      ).toBeDisabled();

      expect(
        wrapper.getByRole("checkbox", { name: /check all/i })
      ).toBeInTheDocument();
    });

    // Select all 3 Metadatas to edit.
    userEvent.click(wrapper.getByRole("checkbox", { name: /check all/i }));
    await waitFor(() => {
      // The button should now be enabled:
      expect(
        wrapper.getByRole("button", { name: /edit selected/i })
      ).toBeEnabled();
    });

    // Deselect all 3 Metadatas.
    userEvent.click(wrapper.getByRole("checkbox", { name: /check all/i }));
    await waitFor(() => {
      // The button should now be disabled again:
      expect(
        wrapper.getByRole("button", { name: /edit selected/i })
      ).toBeDisabled();
    });
  });

  it("Lets you bulk-delete metadata.", async () => {
    const pageWrapper = mountWithAppContext(<MetadataListPage />, {
      apiContext
    });

    await waitFor(() => {
      expect(
        pageWrapper.getByRole("button", { name: /delete selected/i })
      ).toBeInTheDocument();
    });

    // Pretend two metadatas are already selected:
    const buttonWrapper = mountWithAppContext(
      <DinaForm<BulkSelectableFormValues>
        initialValues={{
          itemIdsToSelect: {
            "00000000-0000-0000-0000-000000000000": true,
            "11111111-1111-1111-1111-111111111111": true
          }
        }}
      >
        <BulkDeleteButton typeName="metadata" apiBaseUrl="/objectstore-api" />
      </DinaForm>,
      { apiContext }
    );

    await waitFor(() => {
      // Click the bulk-delete button:
      expect(
        buttonWrapper.getAllByRole("button", { name: /delete selected/i })[1]
      ).toBeInTheDocument();
    });

    userEvent.click(
      buttonWrapper.getAllByRole("button", { name: /delete selected/i })[1]
    );

    await waitFor(() => {
      // Shows how many will be deleted:
      expect(
        buttonWrapper.getByText(/delete selected \(2\)/i)
      ).toBeInTheDocument();
    });

    // Click 'yes' on the "Are you sure" modal:
    userEvent.click(buttonWrapper.getByRole("button", { name: /yes/i }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledTimes(2);
      expect(mockDelete).lastCalledWith(
        `/objectstore-api/metadata/11111111-1111-1111-1111-111111111111`
      );
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });
});
