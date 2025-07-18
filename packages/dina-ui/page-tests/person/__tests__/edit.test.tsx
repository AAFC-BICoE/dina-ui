import { Person } from "../../../types/agent-api/resources/Person";
import { Organization } from "../../../types/agent-api/resources/Organization";
import PersonEditPage from "../../../pages/person/edit";
import { mountWithAppContext } from "common-ui";
import { fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

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
  // The get request will return the existing person.
  if (model === "agent-api/person/1?include=organizations,identifiers") {
    // The request returns the test person.
    return { data: TEST_AGENT };
  } else if (model === "agent-api/organization") {
    return { data: TEST_ORGANIZATIONS };
  }
});

// Mock API requests:
const mockPost = jest.fn();
const mockPatch = jest.fn();
const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: {
      post: mockPost,
      patch: mockPatch
    }
  }
};

describe("person edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });

  it("Provides a form to add a person.", async () => {
    mockPost.mockReturnValueOnce({
      data: {
        attributes: {
          displayName: "test agent",
          email: "testperson@a.b"
        },
        id: "1",
        type: "person"
      }
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<PersonEditPage />, { apiContext });

    expect(
      wrapper.getAllByRole("textbox", { name: /display name/i })
    ).toHaveLength(1);

    // Edit the displayName.
    fireEvent.change(wrapper.getByRole("textbox", { name: /display name/i }), {
      target: {
        name: "person",
        value: "test person updated"
      }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected response
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/agent-api/person",
        {
          data: {
            attributes: {
              displayName: "test person updated"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "person"
          }
        },
        expect.anything()
      );
    });

    // The user should be redirected to the person list page.
    expect(mockPush).lastCalledWith("/person/list");
  });

  it("Provides a form to edit a person.", async () => {
    mockPatch.mockReturnValueOnce({
      data: {
        data: {
          id: "1",
          type: "person"
        }
      }
    });

    mockQuery = { id: 1 };

    const wrapper = mountWithAppContext(<PersonEditPage />, { apiContext });

    // The page should load initially with a loading spinner.
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // Wait for the form to load.
    await waitFor(() => {
      // Check that the existing displayName value is in the field.
      expect(
        wrapper.getByRole("textbox", { name: /display name/i })
      ).toHaveDisplayValue("person a");
    });

    // Modify the displayName value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /display name/i }), {
      target: {
        name: "displayName",
        value: "new test person"
      }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // "patch" should have been called with the updated person data
    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/agent-api/person/1",
        {
          data: {
            attributes: expect.objectContaining({
              displayName: "new test person"
            }),
            id: "1",
            type: "person"
          }
        },
        expect.anything()
      );
    });

    // The user should be redirected to person's list page.
    expect(mockPush).lastCalledWith("/person/list");
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    // The patch request will return an error.
    mockPost.mockImplementationOnce(() => {
      throw new Error("test error");
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<PersonEditPage />, {
      apiContext
    });

    const displayNameField = screen.getByRole("textbox", {
      name: /display name/i
    }); // adjust label as needed
    fireEvent.change(displayNameField, { target: { value: "John Doe" } });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected error
    await waitFor(() => {
      expect(wrapper.getByText("test error"));
      expect(mockPush).toBeCalledTimes(0);
    });
  });

  it("Renders an error if a display name is not entered.", async () => {
    // The patch request will return an error.
    mockPost.mockImplementationOnce(() => {
      throw new Error("test error");
    });

    mockQuery = {};

    const wrapper = mountWithAppContext(<PersonEditPage />, {
      apiContext
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected error
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /1 : display name \- the display name field is required\./i
        )
      );
      expect(mockPush).toBeCalledTimes(0);
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

const TEST_ORGANIZATIONS: Organization[] = [
  {
    names: [
      {
        languageCode: "EN",
        name: "org1"
      },
      {
        languageCode: "FR",
        name: "org1 Fr"
      }
    ],
    uuid: "617a27e2-8145-4077-a4a5-65af3de416d7",
    id: "1",
    type: "organization"
  },
  {
    names: [
      {
        languageCode: "EN",
        name: "org A"
      },
      {
        languageCode: "FR",
        name: "orgA Fr"
      }
    ],
    uuid: "1756a90f-5cf8-410e-b3d4-bfe19e8db484",
    id: "2",
    type: "organization"
  }
];
