import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { MetadataBulkEditor } from "../MetadataBulkEditor";
import { waitFor, within } from "@testing-library/dom";
import {
  BUCKET,
  DC_RIGHTS,
  DC_TYPE,
  LICENSE,
  TEST_BULK_EDIT_METADATA,
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

  describe("Bulk Edit Metadata", () => {
    it("Bulk Edit 3 files, bulk editor opens with correct information", async () => {
      const wrapper = mountWithAppContext(
        <MetadataBulkEditor
          metadatas={TEST_BULK_EDIT_METADATA}
          onSaved={mockOnSaved}
        />,
        testCtx as any
      );
      await waitForLoadingToDisappear();

      // 3 Metadata Records should be displayed in tabs at the top of the page, along with the
      // edit all tab.
      await waitFor(() => {
        expect(wrapper.getByText(/bulkEdit1\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/bulkEdit2\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/bulkEdit3\.jpg/i)).toBeInTheDocument();
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

      // Caption should be same for each.
      expect(
        within(editAllTab).getByRole("textbox", { name: "Caption No Changes" })
      ).toHaveDisplayValue("Same Caption");

      // Individual Tab Edit Page
      const upload1Tab = wrapper.getByRole("tabpanel", {
        name: /bulkEdit1\.jpg/i
      });

      // Original Filename
      expect(
        within(upload1Tab).getByRole("textbox", {
          name: /original filename/i
        })
      ).toHaveDisplayValue("bulkEdit1.jpg");

      // Caption
      expect(
        within(upload1Tab).getByRole("textbox", {
          name: /caption/i
        })
      ).toHaveDisplayValue("Same Caption");
    });

    it("Bulk Edit 3 files, with 'Edit All' changes, correct PATCH requests are made", async () => {
      const wrapper = mountWithAppContext(
        <MetadataBulkEditor
          metadatas={TEST_BULK_EDIT_METADATA}
          onSaved={mockOnSaved}
        />,
        testCtx as any
      );
      await waitForLoadingToDisappear();

      // Wait for edit all tab
      await waitFor(() => {
        expect(wrapper.getByText(/edit all/i)).toBeInTheDocument();
      });

      const editAllTab = wrapper.getByRole("tabpanel", { name: /edit all/i });

      // Change Caption for all records
      userEvent.clear(
        within(editAllTab).getByRole("textbox", { name: "Caption No Changes" })
      );
      userEvent.type(
        within(editAllTab).getByRole("textbox", { name: "Caption No Changes" }),
        "Bulk Updated Caption"
      );

      // Submit the form
      userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
      await waitFor(() => expect(mockSave).toHaveBeenCalled());

      // Only the caption was changed for each.
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                id: "bulk-edit-1",
                type: "metadata",
                acCaption: "Bulk Updated Caption"
              },
              type: "metadata"
            },
            {
              resource: {
                id: "bulk-edit-2",
                type: "metadata",
                acCaption: "Bulk Updated Caption"
              },
              type: "metadata"
            },
            {
              resource: {
                id: "bulk-edit-3",
                type: "metadata",
                acCaption: "Bulk Updated Caption"
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

    it("Bulk Edit 3 files, with individual changes, each record updated with correct ID", async () => {
      const wrapper = mountWithAppContext(
        <MetadataBulkEditor
          metadatas={TEST_BULK_EDIT_METADATA}
          onSaved={mockOnSaved}
        />,
        testCtx as any
      );
      await waitForLoadingToDisappear();

      // Wait for all tabs
      await waitFor(() => {
        expect(wrapper.getByText(/bulkEdit1\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/bulkEdit2\.jpg/i)).toBeInTheDocument();
        expect(wrapper.getByText(/bulkEdit3\.jpg/i)).toBeInTheDocument();
      });

      // Edit bulkEdit1.jpg
      userEvent.click(wrapper.getByText(/bulkEdit1\.jpg/i));
      const tab1 = wrapper.getByRole("tabpanel", { name: /bulkEdit1\.jpg/i });
      userEvent.clear(within(tab1).getByRole("textbox", { name: /caption/i }));
      userEvent.type(
        within(tab1).getByRole("textbox", { name: /caption/i }),
        "Individual Caption 1"
      );

      // Edit bulkEdit2.jpg
      userEvent.click(wrapper.getByText(/bulkEdit2\.jpg/i));
      const tab2 = wrapper.getByRole("tabpanel", { name: /bulkEdit2\.jpg/i });
      userEvent.clear(within(tab2).getByRole("textbox", { name: /caption/i }));
      userEvent.type(
        within(tab2).getByRole("textbox", { name: /caption/i }),
        "Individual Caption 2"
      );

      // Edit bulkEdit3.jpg
      userEvent.click(wrapper.getByText(/bulkEdit3\.jpg/i));
      const tab3 = wrapper.getByRole("tabpanel", { name: /bulkEdit3\.jpg/i });
      userEvent.clear(within(tab3).getByRole("textbox", { name: /caption/i }));
      userEvent.type(
        within(tab3).getByRole("textbox", { name: /caption/i }),
        "Individual Caption 3"
      );

      // Submit
      userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
      await waitFor(() => expect(mockSave).toHaveBeenCalled());

      // Expect individual changes only.
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                id: "bulk-edit-1",
                type: "metadata",
                acCaption: "Individual Caption 1"
              },
              type: "metadata"
            },
            {
              resource: {
                id: "bulk-edit-2",
                type: "metadata",
                acCaption: "Individual Caption 2"
              },
              type: "metadata"
            },
            {
              resource: {
                id: "bulk-edit-3",
                type: "metadata",
                acCaption: "Individual Caption 3"
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

    it("Ability to clear fields in the edit all tab.", async () => {
      const wrapper = mountWithAppContext(
        <MetadataBulkEditor
          metadatas={TEST_BULK_EDIT_METADATA}
          onSaved={mockOnSaved}
        />,
        testCtx as any
      );
      await waitForLoadingToDisappear();

      await waitFor(() => {
        expect(wrapper.getByText(/edit all/i)).toBeInTheDocument();
      });
      const editAllTab = wrapper.getByRole("tabpanel", { name: /edit all/i });

      // Verify the caption field is present with the current value
      await waitFor(() => {
        expect(
          within(editAllTab).getByRole("textbox", {
            name: "Caption No Changes"
          })
        ).toBeInTheDocument();
      });

      // Click the clear all button for the caption field
      userEvent.click(wrapper.getByTestId("clear-all-button-acCaption"));

      // It should say cleared as the placeholder.
      await waitFor(() => {
        expect(wrapper.getByPlaceholderText("Cleared")).toBeInTheDocument();
      });

      // Click the "Save All" button:
      userEvent.click(wrapper.getByRole("button", { name: /save all/i }));
      await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

      // Saves the metadata with the caption field emptied but all other fields preserved
      expect(mockSave.mock.calls).toEqual([
        [
          [
            {
              resource: {
                acCaption: "",
                id: "bulk-edit-1",
                type: "metadata"
              },
              type: "metadata"
            },
            {
              resource: {
                acCaption: "",
                id: "bulk-edit-2",
                type: "metadata"
              },
              type: "metadata"
            },
            {
              resource: {
                acCaption: "",
                id: "bulk-edit-3",
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

    it("No changes made, no save request should be made on submit.", async () => {
      const wrapper = mountWithAppContext(
        <MetadataBulkEditor
          metadatas={TEST_BULK_EDIT_METADATA}
          onSaved={mockOnSaved}
        />,
        testCtx as any
      );
      await waitForLoadingToDisappear();

      await waitFor(() => {
        expect(wrapper.getByText(/edit all/i)).toBeInTheDocument();
      });

      // Verify initial data is loaded
      const editAllTab = wrapper.getByRole("tabpanel", { name: /edit all/i });
      expect(
        within(editAllTab).getByDisplayValue(DC_RIGHTS)
      ).toBeInTheDocument();

      // Click the "Save All" button without making any changes
      userEvent.click(wrapper.getByRole("button", { name: /save all/i }));

      // Wait a bit to ensure no async save calls are made
      await waitFor(() => {
        expect(mockSave).not.toHaveBeenCalled();
      });

      // Verify the save function was never called
      expect(mockSave).toHaveBeenCalledTimes(0);
    });
  });
});
