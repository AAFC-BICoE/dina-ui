import { OperationsResponse } from "common-ui";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import CollectingEventEditPage from "../../../pages/collecting-event/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

// Mock out the dynamic component, which should only be rendered in the browser
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: mockQuery
  })
}));

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

/** The mock URL query string params. */
let mockQuery: any = {};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  // The get request will return the existing collecting-event.
  if (
    model ===
    "collection-api/collecting-event/1?include=collectors,geoReferenceAssertions"
  ) {
    return { data: TEST_COLLECTING_EVENT };
  } else if (model === "agent-api/person") {
    return { data: [TEST_AGENT] };
  }
});

// Mock API requests:
const mockPatch = jest.fn();

const mockBulkGet = jest.fn(async paths => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/agent-api/")) {
    return TEST_AGENT;
  }
});

const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } },
  bulkGet: mockBulkGet
};

describe("collecting-event edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a collecting-event.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            attributes: {
              startEventDateTime: "12/21/2019T16:00",
              endEventDateTime: "12/22/2019T16:00",
              verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 4pm"
            },
            id: "1",
            type: "collecting-event"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    expect(wrapper.find(".startEventDateTime-field")).toHaveLength(1);
    // initially renders without end event datetime
    expect(wrapper.find(".endEventDateTime-field")).toHaveLength(0);
    expect(wrapper.find(".verbatimEventDateTime-field")).toHaveLength(1);

    // simulate turn on the date range switch
    wrapper.find(".react-switch.dateRange input").simulate("change", {
      target: {
        type: "checkbox",
        checked: true
      }
    });
    await new Promise(setImmediate);

    // renders end event datetime
    expect(wrapper.find(".endEventDateTime-field")).toHaveLength(1);

    // Edit the start event datetime
    wrapper.find(".startEventDateTime-field input").simulate("change", {
      target: {
        name: "startEventDateTime",
        value: "201912211600"
      }
    });

    // Edit the verbatime datetime
    wrapper.find(".verbatimEventDateTime-field input").simulate("change", {
      target: {
        name: "verbatimEventDateTime",
        value: "From 2019,12,21 4pm to 2019,12,22 5pm"
      }
    });

    // Edit the dwcRecordNumbers
    wrapper.find(".dwcRecordNumbers-field input").simulate("change", {
      target: {
        name: "dwcRecordNumbers",
        value: "12,23"
      }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "POST",
          path: "collecting-event",
          value: {
            attributes: {
              startEventDateTime: "2019-12-21T16:00",
              verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 5pm",
              dwcRecordNumbers: ["12", "23"]
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "collecting-event"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new collecting-event's details page.
    expect(mockPush).lastCalledWith("/collecting-event/view?id=1");
  });

  it("Provides a form to edit a collecting-event.", async done => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: TEST_COLLECTING_EVENT,
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = { id: 1 };

    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the form to load.
    await new Promise(setImmediate);
    wrapper.update();

    // Check that the existing value is in the field.
    expect(
      wrapper.find(".verbatimEventDateTime-field input").prop("value")
    ).toEqual("From 2019,12,21 4pm to 2019,12,22 4pm");

    // Modify the value.
    wrapper.find(".verbatimEventDateTime-field input").simulate("change", {
      target: {
        name: "verbatimEventDateTime",
        value: "From 2019,12,21 4pm to 2019,12,22 6pm"
      }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      // "patch" should have been called with a jsonpatch request containing the existing values
      // and the modified one.
      expect(mockPatch).lastCalledWith(
        "/collection-api/operations",
        [
          {
            op: "PATCH",
            path: "collecting-event/1",
            value: {
              attributes: expect.objectContaining({
                verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 6pm"
              }),
              id: "1",
              type: "collecting-event"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to collecting-event's list page.
      expect(mockPush).lastCalledWith("/collecting-event/view?id=1");
      done();
    });
  });

  it("Renders an error after form submit if one is returned from the back-end.", async done => {
    // The patch request will return an error.
    mockPatch.mockImplementationOnce(() => ({
      data: [
        {
          errors: [
            {
              detail: "Start event datetime should not be blank",
              status: "422",
              title: "Constraint violation"
            }
          ],
          status: 422
        }
      ] as OperationsResponse
    }));

    mockQuery = {};

    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    // Need to emulate by setting the value to test back end error is actually rendered
    wrapper.find(".startEventDateTime input").simulate("change", {
      target: { name: "startEventDateTime", value: "2020" }
    });

    wrapper.find(".group-field Select").prop<any>("onChange")([
      { label: "group", value: "test group" }
    ]);

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(".alert.alert-danger").text()).toEqual(
        "Constraint violation: Start event datetime should not be blank"
      );
      expect(mockPush).toBeCalledTimes(0);
      done();
    });
  });
});

/** Test collecting-event with all fields defined. */

const TEST_COLLECTING_EVENT: CollectingEvent = {
  uuid: "617a27e2-8145-4077-a4a5-65af3de416d7",
  id: "1",
  type: "collecting-event",
  startEventDateTime: "12/21/2019T16:00",
  endEventDateTime: "12/21/2019T17:00",
  verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 4pm",
  group: "test group",
  collectors: [
    { id: "a8fb14f7-cda9-4313-9cc7-f313db653cad", type: "agent" },
    { id: "eb61092e-fb28-41c8-99e6-d78743296520", type: "agent" }
  ],
  dwcRecordNumbers: ["12", "13", "14"],
  geoReferenceAssertions: [
    {
      uuid: "a8fb14f7-cda9-4313-9cc7-f313db653cad",
      type: "georeference-assertion"
    }
  ]
};

const TEST_AGENT: Person = {
  displayName: "person a",
  email: "testperson@a.b",
  id: "1",
  type: "person",
  uuid: "323423-23423-234"
};
