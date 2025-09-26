import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { MetadataBulkEditor } from "../MetadataBulkEditor";
import { waitFor, within } from "@testing-library/dom";
import {
  BUCKET,
  DC_RIGHTS,
  DC_TYPE,
  LICENSE,
  TEST_NEW_METADATA,
  TEST_OBJECT_SUBTYPE_DATA,
  XMP_RIGHTS_OWNER,
  XMP_RIGHTS_USAGE_TERMS,
  XMP_RIGHTS_WEB_STATEMENT
} from "../__mocks__/MetadataBulkMocks";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

const mockGet = jest.fn<any, any>(async (path, _params) => {
  switch (path) {
    case "objectstore-api/object-subtype":
      return { data: [TEST_OBJECT_SUBTYPE_DATA] };
    case "objectstore-api/license":
      return { data: [] };
    case "objectstore-api/managed-attribute":
      return { data: [] };
    case "agent-api/person":
      return { data: [] };
  }
});

const mockPost = jest.fn<any, any>(async (_path) => {
  // console.log(path);
});

const mockPatch = jest.fn();

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
    ...op.resource,
    id: op.resource.id ?? "11111"
  }))
);

const mockBulkGet = jest.fn<any, any>(async (_paths: string[]) => {
  // console.log(paths);
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      axios: {
        get: mockGet,
        post: mockPost,
        patch: mockPatch
      }
    },
    save: mockSave,
    bulkGet: mockBulkGet
  }
};

const mockOnSaved = jest.fn();

describe("MetadataBulkEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("Bulk Upload Metadata", () => {
    it("Upload 3 files, bulk editor opens with correct information", async () => {
      const wrapper = mountWithAppContext(
        <MetadataBulkEditor
          metadatas={TEST_NEW_METADATA}
          onSaved={mockOnSaved}
        />,
        testCtx as any
      );
      await waitForLoadingToDisappear();

      // 3 Metadata Records should be displayed in tabs at the top of the page, along with the
      // edit all tab.
      await waitFor(() => {
        expect(wrapper.getByText(/upload1\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/upload2\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/upload3\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/edit all/i)).toBeInTheDocument();
      });

      // Edit All Tab
      const editAllTab = wrapper.getByRole("tabpanel", { name: /edit all/i });

      // Not Publicly Releasable dropdown for the edit all tab
      expect(
        within(editAllTab).getByText(/keep current values/i)
      ).toBeInTheDocument();

      // Stored Object Type should be image since all 3 match.
      expect(within(editAllTab).getByText(/image/i)).toBeInTheDocument();

      // Orientation should be undetermined.
      expect(within(editAllTab).getByText(/undetermined/i)).toBeInTheDocument();

      // License Information should be displayed on the edit all since they all match.
      expect(
        within(editAllTab).getByDisplayValue(DC_RIGHTS)
      ).toBeInTheDocument();
      expect(
        within(editAllTab).getByText(LICENSE.titles["en"])
      ).toBeInTheDocument();

      // Individual Tab Edit Page
      const upload1Tab = wrapper.getByRole("tabpanel", {
        name: /upload1\.jpg/i
      });

      // Original Filename
      expect(
        within(upload1Tab).getByRole("textbox", {
          name: /original filename/i
        })
      ).toHaveDisplayValue("upload1.jpg");

      // Caption
      expect(
        within(upload1Tab).getByRole("textbox", {
          name: /caption/i
        })
      ).toHaveDisplayValue("upload1.jpg");
    });

    it("Upload 3 files, make edit all changes, metadata records created correctly", async () => {
      const wrapper = mountWithAppContext(
        <MetadataBulkEditor
          metadatas={TEST_NEW_METADATA}
          onSaved={mockOnSaved}
        />,
        testCtx as any
      );
      await waitForLoadingToDisappear();

      // 3 Metadata Records should be displayed in tabs at the top of the page, along with the
      // edit all tab.
      await waitFor(() => {
        expect(wrapper.getByText(/upload1\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/upload2\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/upload3\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/edit all/i)).toBeInTheDocument();
      });

      // Edit All Tab
      const editAllTab = wrapper.getByRole("tabpanel", { name: /edit all/i });

      // Change Caption for all records.
      userEvent.type(
        within(editAllTab).getByRole("textbox", {
          name: "Caption No Changes"
        }),
        "Updated Caption"
      );

      // Submit the form.
      userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
      await waitFor(() => expect(mockSave).toHaveBeenCalled());

      // Expect the Updated Caption to be applied to all 3.
      const baseFields = {
        // Change made in the Edit All:
        acCaption: "Updated Caption",

        // Upload data
        type: "metadata",
        bucket: BUCKET,
        dcRights: DC_RIGHTS,
        dcType: DC_TYPE,
        relationships: {
          acMetadataCreator: {
            data: {
              id: "ac-metadata-creator-id",
              type: "person"
            }
          }
        },
        xmpRightsOwner: XMP_RIGHTS_OWNER,
        xmpRightsUsageTerms: XMP_RIGHTS_USAGE_TERMS,
        xmpRightsWebStatement: XMP_RIGHTS_WEB_STATEMENT
      };
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                fileIdentifier: "upload-fileidentifier-1",
                originalFilename: "upload1.jpg",
                ...baseFields
              },
              type: "metadata"
            },
            {
              resource: {
                fileIdentifier: "upload-fileidentifier-2",
                originalFilename: "upload2.jpg",
                ...baseFields
              },
              type: "metadata"
            },
            {
              resource: {
                fileIdentifier: "upload-fileidentifier-3",
                originalFilename: "upload3.jpg",
                ...baseFields
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

    it("Upload 3 files, make individual tab changes, each record updated independently", async () => {
      const wrapper = mountWithAppContext(
        <MetadataBulkEditor
          metadatas={TEST_NEW_METADATA}
          onSaved={mockOnSaved}
        />,
        testCtx as any
      );
      await waitForLoadingToDisappear();

      // Wait for all tabs to be present
      await waitFor(() => {
        expect(wrapper.getByText(/upload1\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/upload2\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/upload3\.jpg/i)).toBeInTheDocument();
      });

      // Click on upload1.jpg tab and edit its caption
      userEvent.click(wrapper.getByText(/upload1\.jpg/i));
      const upload1Tab = wrapper.getByRole("tabpanel", {
        name: /upload1\.jpg/i
      });
      userEvent.clear(
        within(upload1Tab).getByRole("textbox", { name: /caption/i })
      );
      userEvent.type(
        within(upload1Tab).getByRole("textbox", { name: /caption/i }),
        "Caption for Upload 1"
      );

      // Click on upload2.jpg tab and edit its caption
      userEvent.click(wrapper.getByText(/upload2\.jpg/i));
      const upload2Tab = wrapper.getByRole("tabpanel", {
        name: /upload2\.jpg/i
      });
      userEvent.clear(
        within(upload2Tab).getByRole("textbox", { name: /caption/i })
      );
      userEvent.type(
        within(upload2Tab).getByRole("textbox", { name: /caption/i }),
        "Caption for Upload 2"
      );

      // Click on upload3.jpg tab and edit its caption
      userEvent.click(wrapper.getByText(/upload3\.jpg/i));
      const upload3Tab = wrapper.getByRole("tabpanel", {
        name: /upload3\.jpg/i
      });
      userEvent.clear(
        within(upload3Tab).getByRole("textbox", { name: /caption/i })
      );
      userEvent.type(
        within(upload3Tab).getByRole("textbox", { name: /caption/i }),
        "Caption for Upload 3"
      );

      // Submit the form
      userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
      await waitFor(() => expect(mockSave).toHaveBeenCalled());

      // Base fields that remain the same
      const baseFields = {
        type: "metadata",
        bucket: BUCKET,
        dcRights: DC_RIGHTS,
        dcType: DC_TYPE,
        relationships: {
          acMetadataCreator: {
            data: {
              id: "ac-metadata-creator-id",
              type: "person"
            }
          }
        },
        xmpRightsOwner: XMP_RIGHTS_OWNER,
        xmpRightsUsageTerms: XMP_RIGHTS_USAGE_TERMS,
        xmpRightsWebStatement: XMP_RIGHTS_WEB_STATEMENT,
        acSubtype: undefined
      };

      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                fileIdentifier: "upload-fileidentifier-1",
                originalFilename: "upload1.jpg",
                acCaption: "Caption for Upload 1",
                ...baseFields
              },
              type: "metadata"
            },
            {
              resource: {
                fileIdentifier: "upload-fileidentifier-2",
                originalFilename: "upload2.jpg",
                acCaption: "Caption for Upload 2",
                ...baseFields
              },
              type: "metadata"
            },
            {
              resource: {
                fileIdentifier: "upload-fileidentifier-3",
                originalFilename: "upload3.jpg",
                acCaption: "Caption for Upload 3",
                ...baseFields
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
  });

  describe("Bulk Edit Metadata", () => {});
});
