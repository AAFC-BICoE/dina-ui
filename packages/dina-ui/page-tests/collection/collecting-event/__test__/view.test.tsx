import { Person } from "../../../../types/agent-api/resources/Person";
import CollectingEventDetailsPage from "../../../../pages/collection/collecting-event/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { CollectingEvent } from "../../../../types/collection-api/resources/CollectingEvent";

/** Test Collecting Event with all fields defined. */
const TEST_COLLECTION_EVENT: CollectingEvent = {
  startEventDateTime: "2019_01_01_10_10_10",
  endEventDateTime: "2019_01_06_10_10_10",
  verbatimEventDateTime: "From 2019, 1,1,10,10,10 to 2019, 1.6, 10,10,10",
  id: "100",
  type: "collecting-event",
  group: "test group",
  otherRecordNumbers: ["12", "13", "14"],
  geoReferenceAssertions: [
    {
      isPrimary: true,
      dwcDecimalLongitude: 12.5,
      georeferencedBy: ["1"]
    }
  ]
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (model) => {
  // The get request will return the existing collecting-event.
  if (
    model ===
    "collection-api/collecting-event/100?include=collectors,attachment,collectionMethod,protocol"
  ) {
    return { data: TEST_COLLECTION_EVENT };
  } else if (model === "agent-api/person") {
    return { data: [TEST_AGENT] };
  } else if (model === "collection-api/collecting-event/100/attachment") {
    return { data: [] };
  } else if (model === "user-api/group") {
    return { data: [] };
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/person/")) {
    return paths.map((path) => ({
      id: path.replace("/person/", ""),
      type: "agent",
      displayName: "person a"
    }));
  }
});

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } })
}));

describe("CollectingEvent details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<CollectingEventDetailsPage />, {
      apiContext
    });

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the CollectingEvent details", async () => {
    const wrapper = mountWithAppContext(<CollectingEventDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The collecting-event's start, end and verbatim time should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(<div>2019_01_01_10_10_10</div>)
    ).toEqual(true);
    expect(
      wrapper.containsMatchingElement(<div>2019_01_06_10_10_10</div>)
    ).toEqual(true);

    // The collecting-event's verbatim datetime should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(
        <div>From 2019, 1,1,10,10,10 to 2019, 1.6, 10,10,10</div>
      )
    ).toEqual(true);

    expect(
      wrapper.find(".otherRecordNumbers-field .field-view").text()
    ).toEqual("12, 13, 14");

    expect(wrapper.containsMatchingElement(<div>12.5</div>)).toEqual(true);

    expect(wrapper.containsMatchingElement(<a>person a</a>)).toEqual(true);
  });
});

const TEST_AGENT: Person = {
  displayName: "person a",
  email: "testperson@a.b",
  id: "1",
  type: "person",
  uuid: "323423-23423-234"
};
