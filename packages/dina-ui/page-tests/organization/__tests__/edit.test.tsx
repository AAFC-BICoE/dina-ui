import { OperationsResponse } from "common-ui";
import OrganizationEditPage from "../../../pages/organization/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Organization } from "../../../types/objectstore-api/resources/Organization";
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
  // The get request will return the existing organization.
  if (model === "agent-api/organization/1") {
    return { data: TEST_ORGANIZATION };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("organization edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });
  it("Provides a form to add an organization.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            attributes: {
              name: "test org",
              aliases: "ACE"
            },
            id: "1",
            type: "organization"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<OrganizationEditPage />, {
      apiContext
    });

    expect(wrapper.find(".name-field input")).toHaveLength(1);

    // Edit the name.

    wrapper.find(".name-field input").simulate("change", {
      target: {
        name: "name",
        value: "test organization updated"
      }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
      "/agent-api/operations",
      [
        {
          op: "POST",
          path: "organization",
          value: {
            attributes: {
              name: "test organization updated"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "organization"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new organization's details page.
    expect(mockPush).lastCalledWith("/organization/list");
  });

  it("Provides a form to edit an organization.", async done => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "organization"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = { id: 1 };

    const wrapper = mountWithAppContext(<OrganizationEditPage />, {
      apiContext
    });

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the form to load.
    await new Promise(setImmediate);
    wrapper.update();

    // Check that the existing aliases value is in the field.
    expect(wrapper.find(".aliases-field input").prop("value")).toEqual(
      "DEW,ACE"
    );

    // Modify the aliases value.
    wrapper.find(".aliases-field input").simulate("change", {
      target: { name: "aliases", value: "DEW" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      // "patch" should have been called with a jsonpatch request containing the existing values
      // and the modified one.
      expect(mockPatch).lastCalledWith(
        "/agent-api/operations",
        [
          {
            op: "PATCH",
            path: "organization/1",
            value: {
              attributes: expect.objectContaining({
                aliases: "DEW"
              }),
              id: "1",
              type: "organization"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to organization's list page.
      expect(mockPush).lastCalledWith("/organization/list");
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
              detail: "displayName and email combination should be unique",
              status: "422",
              title: "Constraint violation"
            }
          ],
          status: 422
        }
      ] as OperationsResponse
    }));

    mockQuery = {};

    const wrapper = mountWithAppContext(<OrganizationEditPage />, {
      apiContext
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(".alert.alert-danger").text()).toEqual(
        "Constraint violation: name should be unique"
      );
      expect(mockPush).toBeCalledTimes(0);
      done();
    });
  });
});

/** Test organization with all fields defined. */

const TEST_ORGANIZATION: Organization = {
  name: "Org1",
  uuid: "617a27e2-8145-4077-a4a5-65af3de416d7",
  id: "1",
  type: "organization",
  aliases: ["DEW", "ACE"]
};
