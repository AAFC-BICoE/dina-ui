import { OperationsResponse, ResourceSelect } from "common-ui";
import CollectorGroupEditPage from "../../../pages/collector-group/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { CollectorGroup } from "../../../types/collection-api/resources/CollectorGroup";
import { Person } from "packages/dina-ui/types/objectstore-api/resources/Person";

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
  // The get request will return the existing collector-group.
  if (model === "collection-api/collector-group/1") {
    return { data: TEST_COLLECTOR_GROUP };
  } else if (model === "agent-api/person") {
    return { data: [TEST_AGENT] };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("collector-group edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a collector-group.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            attributes: {
              agentIdentifiers: ["323423-23423-234"]
            },
            id: "1",
            type: "collector-group"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<CollectorGroupEditPage />, {
      apiContext
    });

    expect(wrapper.find(".agentIdentifiers-field")).toHaveLength(1);

    wrapper
      .find(".agentIdentifiers-field ResourceSelect")
      .prop<any>("onChange")([TEST_AGENT]);

    // Submit the form.
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "POST",
          path: "collector-group",
          value: {
            attributes: {},
            id: "00000000-0000-0000-0000-000000000000",
            relationships: {
              agentIdentifiers: {
                data: [
                  {
                    id: "1",
                    type: "agent"
                  }
                ]
              }
            },
            type: "collector-group"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new collector-group's details page.
    expect(mockPush).lastCalledWith("/collector-group/list");
  });

  it("Renders an error after form submit without specifying madatory field.", async done => {
    // The patch request will return an error.
    mockPatch.mockImplementationOnce(() => ({
      data: [
        {
          errors: [
            {
              detail: "At lease one agent should be specified for the group",
              status: "422",
              title: "Constraint violation"
            }
          ],
          status: 422
        }
      ] as OperationsResponse
    }));

    mockQuery = {};

    const wrapper = mountWithAppContext(<CollectorGroupEditPage />, {
      apiContext
    });

    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(".alert.alert-danger").text()).toEqual(
        "At lease one agent should be specified for the group"
      );
      expect(mockPush).toBeCalledTimes(0);
      done();
    });
  });
});

/** Test collector-group with all fields defined. */

const TEST_COLLECTOR_GROUP: CollectorGroup = {
  uuid: "617a27e2-8145-4077-a4a5-65af3de416d7",
  agentIdentifiers: [
    { id: "a8fb14f7-cda9-4313-9cc7-f313db653cad", type: "agent" },
    { id: "eb61092e-fb28-41c8-99e6-d78743296520", type: "agent" }
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
