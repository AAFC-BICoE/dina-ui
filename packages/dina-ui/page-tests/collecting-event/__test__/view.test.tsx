import { CollectingEventDetailsPage } from "../../../pages/collecting-event/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { CollectingEvent } from "../../../types/objectstore-api/resources/CollectingEvent";

/** Test organization with all fields defined. */
const TEST_COLLECTION_EVENT: CollectingEvent = {
  startEventDateTime: "2019_01_01_10_10_10",
  endEventDateTime: "2019_01_06_10_10_10",
  verbatimEventDateTime: "From 2019, 1,1,10,10,10 to 2019, 1.6, 10,10,10",
  id: "1",
  type: "collecting-event",
  uuid: "323423-23423-234",
  group: "test group"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return { data: TEST_COLLECTION_EVENT };
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("CollectingEvent details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(
      <CollectingEventDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the CollectingEvent details", async () => {
    const wrapper = mountWithAppContext(
      <CollectingEventDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The collecting-event's start, end and verbatim time should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<p>2019_01_01_10_10_10</p>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<p>2019_01_06_10_10_10</p>)).toEqual(
      true
    );

    // The collecting-event's verbatim datetime should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(
        <p>From 2019, 1,1,10,10,10 to 2019, 1.6, 10,10,10</p>
      )
    ).toEqual(true);
  });
});
