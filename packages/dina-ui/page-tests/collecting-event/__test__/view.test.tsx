import {
  CollectingEventDetailsPage,
  useAttachMetadatasToCollectingEvent
} from "../../../pages/collecting-event/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { CollectingEvent } from "../../../types/objectstore-api/resources/CollectingEvent";

/** Test organization with all fields defined. */
const TEST_COLLECTION_EVENT: CollectingEvent = {
  startEventDateTime: "2019_01_01_10_10_10",
  endEventDateTime: "2019_01_06_10_10_10",
  verbatimEventDateTime: "From 2019, 1,1,10,10,10 to 2019, 1.6, 10,10,10",
  id: "1",
  type: "collecting-event",
  uuid: "323423-23423-234"
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

  /** Test component for testing the useAttachMetadatasToCollectingEvent hook. */
  function TestAttachControlsComponent() {
    const {
      attachMetadatasToCollectingEvent,
      detachMetadataIds
    } = useAttachMetadatasToCollectingEvent();
    return (
      <div>
        <button
          className="attach"
          onClick={() =>
            attachMetadatasToCollectingEvent(
              [
                "11111111-1111-1111-1111-111111111111",
                "22222222-2222-2222-2222-222222222222"
              ],
              "00000000-0000-0000-0000-000000000000"
            )
          }
        />
        <button
          className="detach"
          onClick={() =>
            detachMetadataIds(
              [
                "11111111-1111-1111-1111-111111111111",
                "22222222-2222-2222-2222-222222222222"
              ],
              "00000000-0000-0000-0000-000000000000"
            )
          }
        />
      </div>
    );
  }

  it("Attaches Metadatas to a CollectingEvent.", async () => {
    const mockDoOperations = jest.fn();
    const mockGet1CollectingEvent = jest.fn(async () => ({
      data: {
        id: "00000000-0000-0000-0000-000000000000",
        attachment: [
          { id: "99999999-9999-9999-9999-999999999999", type: "metadata" }
        ]
      }
    }));
    const wrapper = mountWithAppContext(<TestAttachControlsComponent />, {
      apiContext: {
        apiClient: { get: mockGet1CollectingEvent } as any,
        doOperations: mockDoOperations
      }
    });

    wrapper.find("button.attach").simulate("click");

    await new Promise(setImmediate);

    expect(mockDoOperations).lastCalledWith(
      [
        {
          op: "PATCH",
          path: "collecting-event/00000000-0000-0000-0000-000000000000",
          value: {
            id: "00000000-0000-0000-0000-000000000000",
            relationships: {
              attachment: {
                // The 1 existing attachment + 2 new ones:
                data: [
                  {
                    id: "99999999-9999-9999-9999-999999999999",
                    type: "metadata"
                  },
                  {
                    id: "11111111-1111-1111-1111-111111111111",
                    type: "metadata"
                  },
                  {
                    id: "22222222-2222-2222-2222-222222222222",
                    type: "metadata"
                  }
                ]
              }
            },
            type: "collecting-event"
          }
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
  });

  it("Detaches Metadatas from a CollectingEvent.", async () => {
    const mockDoOperations = jest.fn();
    const mockGet1CollectingEvent = jest.fn(async () => ({
      data: {
        id: "00000000-0000-0000-0000-000000000000",
        attachment: [
          { id: "11111111-1111-1111-1111-111111111111", type: "metadata" },
          { id: "22222222-2222-2222-2222-222222222222", type: "metadata" },
          { id: "33333333-3333-3333-3333-333333333333", type: "metadata" }
        ]
      }
    }));
    const wrapper = mountWithAppContext(<TestAttachControlsComponent />, {
      apiContext: {
        apiClient: { get: mockGet1CollectingEvent } as any,
        doOperations: mockDoOperations
      }
    });

    wrapper.find("button.detach").simulate("click");

    await new Promise(setImmediate);

    expect(mockDoOperations).lastCalledWith(
      [
        {
          op: "PATCH",
          path: "collecting-event/00000000-0000-0000-0000-000000000000",
          value: {
            id: "00000000-0000-0000-0000-000000000000",
            relationships: {
              attachment: {
                data: [
                  // Only the 1 attachment that wasn't removed remains:
                  {
                    id: "33333333-3333-3333-3333-333333333333",
                    type: "metadata"
                  }
                ]
              }
            },
            type: "collecting-event"
          }
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
  });
});
