import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { MetadataBulkEditor } from "../MetadataBulkEditor";
import { screen, waitFor, within } from "@testing-library/dom";
import {
  DC_RIGHTS,
  LICENSE,
  TEST_NEW_METADATA,
  TEST_OBJECT_SUBTYPE_DATA
} from "../__mocks__/MetadataBulkMocks";
import "@testing-library/jest-dom";

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

      screen.logTestingPlaygroundURL();
    });
  });

  describe("Bulk Edit Metadata", () => {});
});
