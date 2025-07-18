import { OperationsResponse, makeAxiosErrorMoreReadable } from "common-ui";
import CollectingEventEditPage from "../../../../pages/collection/collecting-event/edit";
import { mountWithAppContext } from "common-ui";
import { Person } from "../../../../types/agent-api/resources/Person";
import { CollectingEvent } from "../../../../types/collection-api/resources/CollectingEvent";
import { CoordinateSystem } from "../../../../types/collection-api/resources/CoordinateSystem";
import { SRS } from "../../../../types/collection-api/resources/SRS";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

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
const mockGet = jest.fn(async (model) => {
  // The get request will return the existing collecting-event.
  if (
    model ===
    "collection-api/collecting-event/1?include=collectors,attachment,collectionMethod,protocol"
  ) {
    return { data: testCollectingEvent() };
  } else if (model === "agent-api/person") {
    return { data: [testAgent()] };
  } else if (model === "collection-api/vocabulary2/srs") {
    return { data: [testSrs()] };
  } else if (model === "collection-api/vocabulary2/coordinateSystem") {
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

const mockBulkGet = jest.fn(async (paths) => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/person/")) {
    return paths.map((path) => ({
      id: path.replace("/person/", ""),
      type: "agent"
    }));
  }
  if ((paths[0] as string).startsWith("/metadata/")) {
    return paths.map((path) => ({
      id: path.replace("/metadata/", ""),
      type: "metadata",
      originalFilename: "test-file"
    }));
  }
  console.warn("No mock value for bulkGet paths: ", paths);
});

const MOCK_POST_ERROR = (() => {
  const error = new Error() as any;
  error.isAxiosError = true;
  error.config = {
    url: "/collection-api/collecting-event"
  };
  error.response = {
    statusText: "500",
    status: 500,
    data: {
      errors: [
        {
          status: 500,
          detail: "test error detail",
          title: "Bad Request"
        }
      ]
    }
  };

  return error;
})();

const mockPost = jest.fn((path) => {
  if (path === "search-api/search-ws/search") {
    return new Promise((resolve) => resolve);
  } else {
    makeAxiosErrorMoreReadable(MOCK_POST_ERROR);
  }
});
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch, post: mockPost } },
  bulkGet: mockBulkGet
};

describe("collecting-event edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a collecting-event.", async () => {
    mockPost
      .mockReturnValueOnce(Promise.resolve("default"))
      .mockReturnValueOnce(
        Promise.resolve({
          data: {
            data: {
              attributes: {
                startEventDateTime: "12/21/2019T16:00",
                endEventDateTime: "12/22/2019T16:00",
                verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 4pm"
              },
              id: "1",
              type: "collecting-event"
            }
          },
          status: 201
        })
      );

    mockQuery = {};

    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    // Wait for the page to load.
    await waitFor(() => {
      // Find datetime fields
      expect(
        wrapper.getAllByRole("textbox", { name: /start event date time/i })
      ).toHaveLength(1);
      expect(
        wrapper.getAllByRole("textbox", { name: /end event date time/i })
      ).toHaveLength(1);
      expect(
        wrapper.getAllByRole("textbox", { name: /verbatim event datetime/i })
      ).toHaveLength(1);
    });

    // Edit the verbatim datetime
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i }),
      {
        target: {
          name: "verbatimEventDateTime",
          value: "From 2019,12,21 4pm to 2019,12,22 5pm"
        }
      }
    );

    // Edit the otherRecordNumbers
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /additional collection numbers/i }),
      {
        target: {
          name: "otherRecordNumbers",
          value: "12\n23"
        }
      }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected API Response
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/collection-api/collecting-event",

        {
          data: {
            attributes: {
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              publiclyReleasable: true, // Default value
              verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 5pm",
              otherRecordNumbers: ["12", "23"],
              geoReferenceAssertions: [{ isPrimary: true }]
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "collecting-event"
          }
        },
        expect.anything()
      );
    });

    // The user should be redirected to the new collecting-event's details page.
    expect(mockPush).lastCalledWith("/collection/collecting-event/view?id=1");
  });

  it("Lets you add georeference assertions on a new Collecting Event.", async () => {
    // Return the collecting event so it can then be attached to the new georeference assertion:
    mockPost.mockReturnValueOnce(
      Promise.resolve({
        data: {
          data: {
            attributes: {
              startEventDateTime: "12/21/2019T16:00"
            },
            id: "1",
            type: "collecting-event"
          }
        }
      } as any)
    );

    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    // Edit the verbatim datetime
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i }),
      {
        target: {
          value: "From 2019,12,21 4pm to 2019,12,22 5pm"
        }
      }
    );

    // Change georeference values
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /decimal latitude/i }),
      {
        target: {
          value: "45.394728"
        }
      }
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /decimal longitude/i }),
      {
        target: {
          value: "-75.701452"
        }
      }
    );
    fireEvent.change(
      wrapper.getByRole("textbox", {
        name: /coordinate uncertainty in meters/i
      }),
      {
        target: {
          value: "5"
        }
      }
    );

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Saves the collecting event and the georeference assertion in separate requests:
    // (The collecting event id is required to save the georeference assertion)
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/collection-api/collecting-event",
        {
          data: {
            attributes: {
              geoReferenceAssertions: [
                {
                  isPrimary: true,
                  dwcCoordinateUncertaintyInMeters: "5",
                  dwcDecimalLatitude: "45.394728",
                  dwcDecimalLongitude: "-75.701452"
                }
              ],
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              dwcVerbatimCoordinateSystem: null,
              publiclyReleasable: true,
              verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 5pm"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "collecting-event"
          }
        },
        expect.anything()
      );
    });
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
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // Wait for the form to load.
    await waitFor(() => {
      // Check that the existing value is in the field.
      expect(
        wrapper.getByRole("textbox", { name: /verbatim event datetime/i })
      ).toHaveDisplayValue("From 2019,12,21 4pm to 2019,12,22 4pm");
    });

    // Modify the value.
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /verbatim event datetime/i }),
      {
        target: {
          name: "verbatimEventDateTime",
          value: "From 2019,12,21 4pm to 2019,12,22 6pm"
        }
      }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected response.
    await waitFor(() => {
      expect(mockPatch).toBeCalledTimes(1);
      expect(mockPatch).lastCalledWith(
        "/collection-api/collecting-event/1",
        {
          data: {
            attributes: {
              verbatimEventDateTime: "From 2019,12,21 4pm to 2019,12,22 6pm"
            },
            id: "1",
            type: "collecting-event"
          }
        },
        expect.anything()
      );
    });
  });

  it("edit a collecting-event and set the otherRecordNumbers to empty", async () => {
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
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // Wait for the form to load.
    await new Promise((resolve) => setTimeout(resolve, 50));
    await waitFor(() => {
      // Expect the initial values to remain.
      expect(wrapper.getByDisplayValue("12 13 14")).toBeInTheDocument();
    });

    // Set the field to be empty.
    fireEvent.change(wrapper.getByDisplayValue("12 13 14"), {
      target: { value: "" }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected response.
    await waitFor(() => {
      expect(mockPatch).toBeCalledTimes(1);
      expect(mockPatch).lastCalledWith(
        "/collection-api/collecting-event/1",
        {
          data: {
            attributes: {
              otherRecordNumbers: null
            },
            id: "1",
            type: "collecting-event"
          }
        },
        expect.anything()
      );
    });
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    // The patch request will return an error.

    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    // Wait for the page to load.
    await waitFor(() => {
      expect(
        wrapper.getByRole("combobox", { name: /group select\.\.\./i })
      ).toBeInTheDocument();
    });

    // Change combobox value.
    fireEvent.change(
      wrapper.getByRole("combobox", { name: /group select\.\.\./i }),
      {
        target: {
          label: "group",
          value: "test group"
        }
      }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(
        wrapper.getByText(
          /\/collection\-api\/collecting\-event: 500 bad request: test error detail/i
        )
      );
      expect(mockPush).toBeCalledTimes(0);
    });
  });

  it("Lets you set the primary GeoReferenceAssertion.", async () => {
    mockQuery = {};
    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    // The first assertion is already primary:
    await waitFor(() => {
      expect(wrapper.getByRole("button", { name: /primary/i })).toBeDisabled();
    });

    // Add a second assertion:
    userEvent.click(wrapper.getByTestId("add-another-button"));

    await waitFor(() => {
      expect(
        wrapper.getByRole("button", { name: /primary/i })
      ).toBeInTheDocument();
    });

    // Make 2nd assertion primary:
    userEvent.click(wrapper.getByRole("button", { name: /primary/i }));

    // There should be 2 assertion tabs:
    expect(wrapper.getAllByRole("tab")).toHaveLength(2);
    expect(wrapper.getByRole("tab", { name: /1/i }));
    expect(wrapper.getByRole("tab", { name: /2 \(primary\)/i }));
  });

  it("Removes the coordinate system if there are no coordinates set.", async () => {
    mockQuery = {};

    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });

    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /verbatim coordinate system/i })
      ).toHaveDisplayValue("decimal degrees");
    });

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/collection-api/collecting-event",
        {
          data: {
            attributes: {
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              publiclyReleasable: true, // Default value
              geoReferenceAssertions: [{ isPrimary: true }]
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "collecting-event"
          }
        },
        expect.anything()
      );
    });
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
    otherRecordNumbers: ["12", "13", "14"],
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
