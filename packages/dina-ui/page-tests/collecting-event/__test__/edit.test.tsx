import { OperationsResponse } from "common-ui";
import CollectingEventEditPage from "../../../pages/collecting-event/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { CollectingEvent } from "../../../types/objectstore-api/resources/CollectingEvent";
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
  if (model === "collection-api/collecting-event/1") {
    return { data: TEST_COLLECTING_EVENT };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("collecting-event edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add an collecting-event.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            attributes: {
              startEventDateTime: "2019_01_01_10_20_10",
              endEventDateTime: "2019_01_06_5_6_9",
              verbatimEventDateTime:
                "From 2019,1,1,10,10,10 to 2019,01,06,5,6,9"
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

    // Edit the name.

    wrapper.find('[name="endEventDateTime"]').simulate("change", {
      target: {
        name: "endEventDateTime",
        value: "2019_01_06_6_6_9"
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
              endEventDateTime: "2019_01_06_6_6_9"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "collecting-event"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new collecting-event's details page.
    expect(mockPush).lastCalledWith("/collecting-event/list");
  });

  it("Provides a form to edit an collecting-event.", async done => {
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
    expect(wrapper.find('[name="startEventDateTime"]').prop("value")).toEqual([
      "2019_01_01_10_20_10"
    ]);

    // Modify the value.
    wrapper.find('[name="startEventDateTime"]').simulate("change", {
      target: { name: "startEventDateTime", value: "2019_01_01_10_20_30" }
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
                startEventDateTime: "2019_01_01_10_20_30"
              }),
              id: "1",
              type: "collecting-event"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to collecting-event's list page.
      expect(mockPush).lastCalledWith("/collecting-event/list");
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
  startEventDateTime: "2019_01_01_10_20_10",
  endEventDateTime: "2019_01_06_5_6_9",
  verbatimEventDateTime: "From 2019,1,1,10,10,10 to 2019,01,06,5,6,9"
};
