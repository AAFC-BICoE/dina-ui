import { OperationsResponse } from "common-ui";
import { AgentEditPage } from "../../../pages/agent/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Agent } from "../../../types/objectstore-api/resources/Agent";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  // The get request will return the existing agent.
  if (model === "agent-api/agent/1") {
    // The request returns the test agent.
    return { data: TEST_AGENT };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("agent edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a agent.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            attributes: {
              displayName: "test agemt",
              email: "testagent@a.b"
            },
            id: "1",
            type: "agent"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <AgentEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    expect(wrapper.find(".displayName-field input")).toHaveLength(1);

    // Edit the displayName.

    wrapper.find(".displayName-field input").simulate("change", {
      target: {
        name: "agent",
        value: "test agent updated"
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
          path: "agent",
          value: {
            attributes: {
              displayName: "test agent updated"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "agent"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new agent's details page.
    expect(mockPush).lastCalledWith("/agent/list");
  });

  it("Provides a form to edit an agent.", async done => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "agent"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <AgentEditPage router={{ query: { id: 1 }, push: mockPush } as any} />,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the form to load.
    await new Promise(setImmediate);
    wrapper.update();

    // Check that the existing displayName value is in the field.
    expect(wrapper.find(".displayName-field input").prop("value")).toEqual(
      "agent a"
    );

    // Modify the displayName value.
    wrapper.find(".displayName-field input").simulate("change", {
      target: { name: "displayName", value: "new test agent" }
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
            path: "agent/1",
            value: {
              attributes: expect.objectContaining({
                displayName: "new test agent"
              }),
              id: "1",
              type: "agent"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to agent's list page.
      expect(mockPush).lastCalledWith("/agent/list");
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
      <AgentEditPage router={{ query: {}, push: mockPush } as any} />,
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

/** Test agent with all fields defined. */
const TEST_AGENT: Agent = {
  displayName: "agent a",
  email: "testagent@a.b",
  id: "1",
  type: "agent",
  uuid: "323423-23423-234"
};
