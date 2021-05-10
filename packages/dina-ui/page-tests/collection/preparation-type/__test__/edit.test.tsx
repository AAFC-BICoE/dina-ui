import { OperationsResponse } from "common-ui";
import PreparationTypeEditPage from "../../../../pages/collection/preparation-type/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PreparationType } from "../../../../types/collection-api/resources/PreparationType";

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
  // The get request will return the existing preparation-type.
  if (model === "collection-api/preparation-type/1") {
    return { data: TEST_PREPARATION_TYPE };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("preparation-type edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add a preparation-type.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "preparation-type"  
          },
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<PreparationTypeEditPage />, {
      apiContext
    });

    wrapper.find(".preparationTypeName input").simulate("change", {
      target: {
        name: "name",
        value: "updated Name"
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
          path: "preparation-type",
          value: {
            attributes: {name: "updated Name"},
            id: "00000000-0000-0000-0000-000000000000",
            type: "preparation-type"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new preparation-type's details page.
    expect(mockPush).lastCalledWith("/collection/preparation-type/list");
  });

  it("Renders an error after form submit without specifying madatory field.", async done => {
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

    const wrapper = mountWithAppContext(<PreparationTypeEditPage />, {
      apiContext
    });

    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(".alert.alert-danger").text()).toEqual(
        "Constraint violation: Name is mandatory"
      );
      expect(mockPush).toBeCalledTimes(0);
      done();
    });
  });
});

/** Test preparation-type with all fields defined. */

const TEST_PREPARATION_TYPE: PreparationType = {
  uuid: "617a27e2-8145-4077-a4a5-65af3de416d7",  
  id: "1",
  name: "test preparation type",
  type: "preparation-type"
};
