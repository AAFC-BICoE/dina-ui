import { DefaultRow } from "../../../../common-ui/lib";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { OBJECT_STORE_MODULE_REVISION_ROW_CONFIG } from "../../revisions/revision-modules";
import RevisionsByUserPage, {
  AuthorFilterForm
} from "../CommonRevisionsByUserPage";

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
    await new Promise(setImmediate);
    wrapper.update();

    // Renders the 2 revision rows:
    expect(wrapper.find(DefaultRow).length).toEqual(2);

    // Renders the metadata's resource name cell:
    expect(wrapper.find("name a").first().text()).toEqual("my-image-1.png");
  });

  it("Provides a search input for author.", async () => {
    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue({
      pathname: "the-page-url",
      push: mockPush,
      query: {}
    });

    const wrapper = mountWithAppContext(<AuthorFilterForm />);

    wrapper
      .find(".author-field input")
      .simulate("change", { target: { value: "searched-author" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPush).lastCalledWith({
      pathname: "the-page-url",
      query: {
        author: "searched-author"
      }
    });
  });
});
