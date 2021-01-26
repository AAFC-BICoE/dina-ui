import { Person } from "packages/dina-ui/types/objectstore-api";
import { CollectorGroupDetailsPage } from "../../../pages/collector-group/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { CollectorGroup } from "../../../types/collection-api/resources/CollectorGroup";

/** Test collector-group with all fields defined. */
const TEST_COLLECTOR_GROUP: CollectorGroup = {
  uuid: "617a27e2-8145-4077-a4a5-65af3de416d7",
  agentIdentifiers: [
    { id: "a8fb14f7-cda9-4313-9cc7-f313db653cad", type: "agent" }
  ],
  id: "1",
  name: "test collector group",
  type: "collector-group"
};

const TEST_AGENT: Person = {
  displayName: "person a",
  email: "testperson@a.b",
  id: "1",
  type: "person",
  uuid: "323423-23423-234"
};

// mock out the Patch when trying to getAgent via BulkGet
const mockPatch = jest.fn(async () => ({
  data: [{ data: TEST_AGENT, status: 201 }]
}));

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  // The get request will return the existing collector-group.
  if (model === "collection-api/collector-group/100?include=agentIdentifiers") {
    return { data: TEST_COLLECTOR_GROUP };
  }
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("CollectorGroup details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(
      <CollectorGroupDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the CollectorGroup details", async () => {
    const wrapper = mountWithAppContext(
      <CollectorGroupDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    expect(wrapper.containsMatchingElement(<p>person a</p>)).toEqual(true);
    expect(
      wrapper.containsMatchingElement(<p> test collector group</p>)
    ).toEqual(true);
  });
});
