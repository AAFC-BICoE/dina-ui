import { mountWithAppContext } from "common-ui";
import { RevisionsPageLayout } from "../RevisionsPageLayout";

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
  if (path === "objectstore-api/audit-snapshots") {
    return {
      data: TEST_SNAPSHOTS
    };
  }
});

describe("RevisionsPageLayout component", () => {
  it("Renders the revisions.", async () => {
    const wrapper = mountWithAppContext(
      <RevisionsPageLayout
        auditSnapshotPath="objectstore-api/audit-snapshots"
        instanceId={`metadata/471bf855-f5da-492a-a58e-922238e5a257`}
      />,
      { apiContext: { apiClient: { get: mockGet } as any } }
    );

    await wrapper.waitForRequests();

    const table = document.querySelector("table");
    if (!table) {
      fail("A table is expected at this point...");
    }

    const numRows = table.rows.length;
    const numCols = table.rows[0].cells.length;

    // Expect a specific table layout
    expect(numRows).toEqual(3); // 2 rows including the header.
    expect(numCols).toEqual(6);
  });
});
