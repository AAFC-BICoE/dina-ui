import { DefaultRow } from "../../../../common-ui/lib";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
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

    await new Promise(setImmediate);
    wrapper.update();
    // Renders the 2 rows:
    expect(wrapper.find(DefaultRow).length).toEqual(2);
  });
});
