import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import MetadataRevisionListPage from "../../../../pages/object-store/metadata/revisions";
import { DefaultRow } from "../../../../../common-ui/lib";
import "@testing-library/jest-dom";

const TEST_SNAPSHOTS = [
  {
    version: 2,
    snapshotType: "UPDATE",
    changedProperties: ["acTags"],
    // For testing just include the changed property in the state:
    state: { acCaption: "My Caption" },
    author: "person2"
  },
  {
    version: 1,
    snapshotType: "INITIAL",
    // For testing just include the changed property in the state:
    changedProperties: ["acCaption"],
    state: { acCaption: "My Caption" },
    author: "person1"
  }
];

const mockGet = jest.fn(async (path) => {
  if (
    path === "objectstore-api/metadata/471bf855-f5da-492a-a58e-922238e5a257"
  ) {
    return {
      data: {
        id: "471bf855-f5da-492a-a58e-922238e5a257",
        type: "metadata",
        originalFilename: "my-image.png"
      }
    };
  }
  if (path === "objectstore-api/audit-snapshot") {
    return {
      data: TEST_SNAPSHOTS
    };
  }
});

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "471bf855-f5da-492a-a58e-922238e5a257" } })
}));

describe("MetadataRevisionListPage", () => {
  it("Renders the page.", async () => {
    const wrapper = mountWithAppContext2(<MetadataRevisionListPage />, {
      apiContext: { apiClient: { get: mockGet } as any }
    });

    // Await metadata query:
    await new Promise(setImmediate);

    // Renders the title:
    expect(
      wrapper.getByRole("heading", { name: /revisions for my\-image\.png/i })
    ).toBeInTheDocument();

    // Renders the 2 revision rows:
    expect(wrapper.getByRole("cell", { name: "1" })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: "2" })).toBeInTheDocument();
  });
});
