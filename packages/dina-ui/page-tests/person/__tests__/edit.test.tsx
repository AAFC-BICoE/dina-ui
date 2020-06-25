import { OperationsResponse } from "common-ui";
import { PersonEditPage } from "../../../pages/person/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Person } from "../../../types/objectstore-api/resources/Person";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  // The get request will return the existing person.
  if (model === "agent-api/person/1") {
    // The request returns the test person.
    return { data: TEST_AGENT };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("person edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a person.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            attributes: {
              displayName: "test agemt",
              email: "testperson@a.b"
            },
            id: "1",
            type: "person"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <PersonEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".displayName-field input")).toHaveLength(1);

    // Edit the displayName.

    wrapper.find(".displayName-field input").simulate("change", {
      target: {
        name: "person",
        value: "test person updated"
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
          path: "person",
          value: {
            attributes: {
              displayName: "test person updated"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "person"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new person's details page.
    expect(mockPush).lastCalledWith("/person/list");
  });

  it("Provides a form to edit an person.", async done => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "person"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <PersonEditPage router={{ query: { id: 1 }, push: mockPush } as any} />,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the form to load.
    await new Promise(setImmediate);
    wrapper.update();

    // Check that the existing displayName value is in the field.
    expect(wrapper.find(".displayName-field input").prop("value")).toEqual(
      "person a"
    );

    // Modify the displayName value.
    wrapper.find(".displayName-field input").simulate("change", {
      target: { name: "displayName", value: "new test person" }
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
            path: "person/1",
            value: {
              attributes: expect.objectContaining({
                displayName: "new test person"
              }),
              id: "1",
              type: "person"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to person's list page.
      expect(mockPush).lastCalledWith("/person/list");
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

    const wrapper = mountWithAppContext(
      <PersonEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(".alert.alert-danger").text()).toEqual(
        "Constraint violation: displayName and email combination should be unique"
      );
      expect(mockPush).toBeCalledTimes(0);
      done();
    });
  });
});

/** Test person with all fields defined. */
const TEST_AGENT: Person = {
  displayName: "person a",
  email: "testperson@a.b",
  id: "1",
  type: "person",
  uuid: "323423-23423-234"
};
