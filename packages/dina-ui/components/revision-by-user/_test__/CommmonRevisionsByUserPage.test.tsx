import { mountWithAppContext } from "common-ui";
import { OBJECT_STORE_MODULE_REVISION_ROW_CONFIG } from "../../revisions/revision-modules";
import RevisionsByUserPage, {
  AuthorFilterForm
} from "../CommonRevisionsByUserPage";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/dom";

const TEST_SNAPSHOTS = [
  {
    version: 2,
    snapshotType: "UPDATE",
    changedProperties: ["acTags"],
    instanceId: "metadata/190917b8-e248-4131-8d77-11543a3110d8",
    state: { acCaption: "My Caption", originalFilename: "my-image-1.png" },
    author: "MatPoff"
  },
  {
    version: 1,
    snapshotType: "INITIAL",
    changedProperties: ["acCaption"],
    instanceId: "metadata/190917b8-e248-4131-8d77-11543a3110d8",
    state: { acCaption: "My Caption", originalFilename: "my-image-1.png" },
    author: "MatPoff"
  }
];

const mockGet = jest.fn(async (path) => {
  if (path === "objectstore-api/audit-snapshot") {
    return {
      data: TEST_SNAPSHOTS
    };
  }
});

const mockUseRouter = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => mockUseRouter()
}));

describe("MetadataRevisionListPage", () => {
  it("Renders the page.", async () => {
    mockUseRouter.mockReturnValue({ query: { author: "MatPoff" } });

    const wrapper = mountWithAppContext(
      <RevisionsByUserPage
        snapshotPath="objectstore-api/audit-snapshot"
        revisionRowConfigsByType={OBJECT_STORE_MODULE_REVISION_ROW_CONFIG}
      />,
      {
        apiContext: { apiClient: { get: mockGet } as any }
      }
    );

    // Await revisions query:
    const table = document.querySelector("table");
    await waitFor(() => {
      expect(table).not.toBeNull();
    });
    if (!table) {
      fail("Table should exist at this point...");
    }

    // Get the number of rows
    const numRows = table.rows.length;

    // Get the number of columns in the first row (assuming consistent structure)
    const numCols = table.rows[0].cells.length;

    // Renders the 2 revision rows:
    await waitFor(() => {
      expect(numRows).toEqual(3);
      expect(numCols).toEqual(8);

      // Renders the metadata's resource name cell:
      expect(
        wrapper.getAllByRole("link", { name: /my\-image\-1\.png/i }).at(0)
      ).toHaveTextContent("my-image-1.png");
    });
  });

  it("Provides a search input for author.", async () => {
    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({
      pathname: "the-page-url",
      push: mockPush,
      query: {}
    });

    const wrapper = mountWithAppContext(<AuthorFilterForm />);

    userEvent.type(
      wrapper.getByRole("textbox", { name: /author/i }),
      "searched-author"
    );
    userEvent.click(wrapper.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(mockPush).lastCalledWith({
        pathname: "the-page-url",
        query: {
          author: "searched-author"
        }
      });
    });
  });
});
