import { OperationsResponse } from "common-ui";
import CollectionMethodEditPage, {
  CollectionMethodForm
} from "../../../../pages/collection/collection-method/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { CollectionMethod } from "../../../../types/collection-api/resources/CollectionMethod";

const INSTANCE_DATA = {
  data: {
    "instance-mode": "developer",
    "supported-languages-iso": "en,fr"
  },
  status: 200,
  statusText: "",
  headers: {
    "content-length": "99",
    "content-type": "text/plain; charset=utf-8",
    date: "Tue, 09 Jan 2024 17:03:48 GMT"
  },
  config: {
    url: "/instance.json",
    method: "get",
    headers: {
      Accept: "application/json, text/plain, */*"
    },
    transformRequest: [null],
    transformResponse: [null],
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1
  },
  request: {}
};

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

const mockOnSaved = jest.fn();

/** The mock URL query string params. */
let mockQuery: any = {};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (model) => {
  // The get request will return the existing collection-method.
  if (model === "collection-api/collection-method/1") {
    return { data: TEST_COLLECTION_METHOD };
  } else if (model === "user-api/group") {
    return [];
  }
});

const mockPatch = jest.fn(() => ({
  data: [{ data: TEST_COLLECTION_METHOD, status: 201 }] as OperationsResponse
}));

const mockGetAxios = jest.fn(async (_path) => {
  return INSTANCE_DATA;
});

const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch, get: mockGetAxios } }
};

describe("collection-method edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a collection-method.", async () => {
    const wrapper = mountWithAppContext(<CollectionMethodEditPage />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".name input").simulate("change", {
      target: {
        name: "name",
        value: "updated Name"
      }
    });

    wrapper.find(".en-description textarea").simulate("change", {
      target: { value: "test english description" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "POST",
          path: "collection-method",
          value: {
            attributes: {
              multilingualDescription: {
                descriptions: [{ lang: "en", desc: "test english description" }]
              },
              name: "updated Name"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "collection-method"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new collection-method's details page.
    expect(mockPush).lastCalledWith("/collection/collection-method/view?id=1");
  });

  it("Edits an existing collection method.", async () => {
    const wrapper = mountWithAppContext(
      <CollectionMethodForm
        onSaved={mockOnSaved}
        fetchedCollectionMethod={{
          name: "test-col-method",
          type: "collection-method",
          multilingualDescription: {
            descriptions: [{ lang: "en", desc: "test english description" }]
          },
          id: "1"
        }}
      />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".en-description textarea").prop("value")).toEqual(
      "test english description"
    );

    wrapper.find(".fr-description textarea").simulate("change", {
      target: { value: "test french description" }
    });

    wrapper.find(".name input").simulate("change", {
      target: {
        name: "name",
        value: "updated Name"
      }
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockPatch).lastCalledWith(
      "/collection-api/operations",
      [
        {
          op: "PATCH",
          path: "collection-method/1",
          value: {
            attributes: {
              multilingualDescription: {
                descriptions: [
                  {
                    desc: "test english description",
                    lang: "en"
                  },
                  {
                    desc: "test french description",
                    lang: "fr"
                  }
                ]
              },
              name: "updated Name"
            },
            id: "1",
            type: "collection-method"
          }
        }
      ],
      expect.anything()
    );
  });

  it("Renders an error after form submit without specifying madatory field.", async () => {
    // The patch request will return an error.
    mockPatch.mockImplementationOnce(() => ({
      data: [
        {
          errors: [
            {
              detail: "Name is mandatory",
              status: "422",
              title: "Constraint violation"
            }
          ],
          status: 422
        }
      ] as OperationsResponse
    }));

    mockQuery = {};

    const wrapper = mountWithAppContext(<CollectionMethodEditPage />, {
      apiContext
    });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);

    wrapper.update();
    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      "Constraint violation: Name is mandatory"
    );
    expect(mockPush).toBeCalledTimes(0);
  });
});

/** Test collection-method with all fields defined. */

const TEST_COLLECTION_METHOD: CollectionMethod = {
  id: "1",
  name: "test collection method",
  type: "collection-method"
};
