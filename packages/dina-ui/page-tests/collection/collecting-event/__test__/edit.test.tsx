import { OperationsResponse } from "common-ui";
import NumberFormat from "react-number-format";
import CollectingEventEditPage from "../../../../pages/collection/collecting-event/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Person } from "../../../../types/agent-api/resources/Person";
import { CollectingEvent } from "../../../../types/collection-api/resources/CollectingEvent";
import { CoordinateSystem } from "../../../../types/collection-api/resources/CoordinateSystem";
import { SRS } from "../../../../types/collection-api/resources/SRS";

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
    "collection-api/collecting-event/1?include=collectors,attachment,collectionMethod"
  ) {
    return { data: testCollectingEvent() };
  } else if (model === "agent-api/person") {
    return { data: [testAgent()] };
  } else if (model === "collection-api/vocabulary/srs") {
    return { data: [testSrs()] };
  } else if (model === "collection-api/vocabulary/coordinateSystem") {
    return { data: [testCoordinates()] };
  } else if (model === "collection-api/collecting-event") {
    return { data: [] };
  } else if (
    model === "collection-api/managed-attribute" ||
    model === "collection-api/collection-method"
  ) {
    return { data: [] };
  } else if (model === "user-api/group") {
    return { data: [] };
  } else if (model === "objectstore-api/metadata") {
    return { data: [] };
  }
});

// Mock API requests:
const mockPatch = jest.fn();

const mockBulkGet = jest.fn(async paths => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/person/")) {
    return paths.map(path => ({
      id: path.replace("/person/", ""),
      type: "agent"
    }));
  }
  if ((paths[0] as string).startsWith("/metadata/")) {
    return paths.map(path => ({
      id: path.replace("/metadata/", ""),
      type: "metadata",
      originalFilename: "test-file"
    }));
  }
  console.warn("No mock value for bulkGet paths: ", paths);
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
    expect(wrapper.find(".endEventDateTime-field")).toHaveLength(1);
    expect(wrapper.find(".verbatimEventDateTime-field")).toHaveLength(1);
    // Edit the verbatime datetime
    wrapper.find(".verbatimEventDateTime-field input").simulate("change", {
      target: {
        name: "verbatimEventDateTime",
        value: "From 2019,12,21 4pm to 2019,12,22 5pm"
      }
    });

    // Edit the dwcOtherRecordNumbers
    wrapper.find(".dwcOtherRecordNumbers-field textarea").simulate("change", {
      target: {
        name: "dwcOtherRecordNumbers",
        value: "12\n23"
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
              dwcVerbatimCoordinateSystem: "decimal degrees",
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              managedAttributes: {},
              publiclyReleasable: true, // Default value
              verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 5pm",
              dwcOtherRecordNumbers: ["12", "23"],
              geoReferenceAssertions: [{ isPrimary: true }]
            },
            relationships: {
              attachment: {
                data: []
              }
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "collecting-event"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new collecting-event's details page.
    expect(mockPush).lastCalledWith("/collection/collecting-event/view?id=1");
  });

  it("Lets you add georeference assertions on a new Collecting Event.", async () => {
    // Return the collecting event so it can then be attached to the new georeference assertion:
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            attributes: {
              startEventDateTime: "12/21/2019T16:00"
            },
            id: "1",
            type: "collecting-event"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Edit the verbatime datetime
    wrapper.find(".verbatimEventDateTime-field input").simulate("change", {
      target: {
        name: "verbatimEventDateTime",
        value: "From 2019,12,21 4pm to 2019,12,22 5pm"
      }
    });

    wrapper
      .find(".georeference-assertion-section button.add-button")
      .simulate("click");

    wrapper
      .find(".dwcDecimalLatitude")
      .find(NumberFormat)
      .prop<any>("onValueChange")({ floatValue: 45.394728 });
    wrapper
      .find(".dwcDecimalLongitude")
      .find(NumberFormat)
      .prop<any>("onValueChange")({ floatValue: -75.701452 });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);

    // Saves the collecting event and the georeference assertion in separate requests:
    // (The collecting event id is required to save the georeference assertion)
    expect(mockPatch.mock.calls).toEqual([
      [
        "/collection-api/operations",
        [
          {
            op: "POST",
            path: "collecting-event",
            value: {
              attributes: expect.objectContaining({
                verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 5pm"
              }),
              relationships: {
                attachment: {
                  data: []
                }
              },
              id: "00000000-0000-0000-0000-000000000000",
              type: "collecting-event"
            }
          }
        ],
        expect.anything()
      ]
    ]);
  });

  it("Provides a form to edit a collecting-event.", async () => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: testCollectingEvent(),
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

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).toBeCalledTimes(1);
    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "PATCH",
          path: "collecting-event/1",
          value: {
            attributes: {
              dwcOtherRecordNumbers: ["12", "13", "14"],
              endEventDateTime: "2019-11-12",
              geoReferenceAssertions: [
                {
                  isPrimary: true,
                  dwcDecimalLongitude: 10,
                  georeferencedBy: ["1"]
                }
              ],
              group: "test group",
              startEventDateTime: "2019-11-11",
              verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 6pm"
            },
            id: "1",
            relationships: {
              attachment: {
                data: [
                  { id: "88888", type: "metadata" },
                  { id: "99999", type: "metadata" }
                ]
              },
              collectors: {
                data: [
                  { id: "111", type: "person" },
                  { id: "222", type: "person" }
                ]
              }
            },
            type: "collecting-event"
          }
        }
      ],
      expect.anything()
    );
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
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

    wrapper.find(".group-field Select").prop<any>("onChange")([
      { label: "group", value: "test group" }
    ]);

    // Submit the form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();
    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      "Constraint violation: Start event datetime should not be blank"
    );
    expect(mockPush).toBeCalledTimes(0);
  });

  it("Lets you set the primary GeoReferenceAssertion.", async () => {
    mockQuery = {};
    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    // The first assertion is already primary:
    expect(
      wrapper.find("button.primary-assertion-button").prop("disabled")
    ).toEqual(true);

    // Add a second assertion:
    wrapper
      .find(".georeference-assertion-section button.add-button")
      .at(0)
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Make 2nd assertion primary:
    wrapper.find("button.primary-assertion-button").simulate("click");

    const assertionTabs = wrapper.find(
      ".georeference-assertion-section li.react-tabs__tab"
    );

    // There should be 2 assertion tabs:
    expect(assertionTabs.length).toEqual(2);
    expect(assertionTabs.at(0).text()).toEqual("1");
    expect(assertionTabs.at(1).text()).toEqual("2 (Primary)");
  });
});

/** Test collecting-event with all fields defined. */
function testCollectingEvent(): CollectingEvent {
  return {
    id: "1",
    type: "collecting-event",
    startEventDateTime: "2019-11-11",
    endEventDateTime: "2019-11-12",
    verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 4pm",
    group: "test group",
    collectors: [
      { id: "111", type: "agent" },
      { id: "222", type: "agent" }
    ],
    dwcOtherRecordNumbers: ["12", "13", "14"],
    geoReferenceAssertions: [
      {
        isPrimary: true,
        dwcDecimalLongitude: 10,
        georeferencedBy: ["1"]
      }
    ],
    attachment: [
      { id: "88888", type: "metadata" },
      { id: "99999", type: "metadata" }
    ]
  };
}

function testAgent(): Person {
  return {
    displayName: "person a",
    email: "testperson@a.b",
    id: "1",
    type: "person",
    uuid: "323423-23423-234"
  };
}

function testSrs(): SRS {
  return { srs: ["NAD27 (EPSG:4276)", "WGS84 (EPSG:4326)"], type: "srs" };
}

function testCoordinates(): CoordinateSystem {
  return {
    coordinateSystem: ["decimal degrees", " degrees decimal"],
    type: "coordinate-system"
  };
}
