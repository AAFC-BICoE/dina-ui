import OrganizationEditPage from "../../../pages/organization/edit";
import { mountWithAppContext } from "common-ui";
import { Organization } from "../../../types/agent-api/resources/Organization";
import { fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { trimAliases } from "../../../components/organization/OrganizationForm";

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
const mockGet = jest.fn(async (path) => {
  if (path === "agent-api/organization/1") {
    return { data: TEST_ORGANIZATION };
  }
});

// Mock API requests:
const mockPatch = jest.fn();
const mockPost = jest.fn();
const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch, post: mockPost } }
};

describe("organization edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
    // Default mock response for successful saves
    const successResp = {
      data: {
        data: { id: "1", type: "organization", attributes: {} }
      }
    };
    mockPost.mockResolvedValue(successResp);
    mockPatch.mockResolvedValue(successResp);
  });

  it("Provides a form to add an organization.", async () => {
    mockQuery = {}; // Create mode

    const wrapper = mountWithAppContext(<OrganizationEditPage />, {
      apiContext
    });

    // Fill in English Name
    fireEvent.change(wrapper.getByRole("textbox", { name: /english name/i }), {
      target: { name: "name.EN", value: "test org new" }
    });

    // Submit the form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/agent-api/organization",
        {
          data: {
            type: "organization",
            id: "00000000-0000-0000-0000-000000000000",
            attributes: {
              names: [{ languageCode: "EN", name: "test org new" }]
            }
          }
        },
        expect.anything()
      );
    });

    // Verify redirect to the VIEW page as per new onSuccess logic
    expect(mockPush).lastCalledWith("/organization/view?id=1");
  });

  it("Provides a form to edit an organization.", async () => {
    mockQuery = { id: "1" }; // Edit mode

    const wrapper = mountWithAppContext(<OrganizationEditPage />, {
      apiContext
    });

    // Wait for the form to load initial values
    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /aliases/i })
      ).toHaveDisplayValue("DEW,ACE");
    });

    // Modify the aliases (Change from ["DEW", "ACE"] to just "DEW")
    fireEvent.change(wrapper.getByRole("textbox", { name: /aliases/i }), {
      target: { name: "aliases", value: "DEW" }
    });

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/agent-api/organization/1",
        {
          data: {
            id: "1",
            type: "organization",
            attributes: {
              // Only changed fields are sent
              aliases: ["DEW"]
            }
          }
        },
        expect.anything()
      );
    });

    expect(mockPush).lastCalledWith("/organization/view?id=1");
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    mockPost.mockRejectedValue(new Error("test error"));
    mockQuery = {};

    const wrapper = mountWithAppContext(<OrganizationEditPage />, {
      apiContext
    });

    fireEvent.change(screen.getByRole("textbox", { name: /english name/i }), {
      target: { value: "John Doe" }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected error
    await waitFor(() => {
      expect(wrapper.getByText("test error"));
      expect(mockPush).toBeCalledTimes(0);
    });
  });

  it("Renders an error if an organization name is not entered.", async () => {
    mockQuery = {};

    const wrapper = mountWithAppContext(<OrganizationEditPage />, {
      apiContext
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected error
    await waitFor(() => {
      expect(wrapper.getByText("At least one organization name is required."));
      expect(mockPush).toBeCalledTimes(0);
    });
  });

  it("Verify trim aliases.", () => {
    const expectedTrimmedArr = ["a", "b", "v", "p", "kl"];
    const aliasesAsString = "a,b  ,v,  p,  , kl";
    const aliasesAsArrayOfOne = ["a,b  ,v,  p,  , kl"];
    const aliasesAsArrayOfMany = ["a", "b", "v", "  p", "  ", "kl"];

    expect(trimAliases(aliasesAsString, false)).toEqual(expectedTrimmedArr);
    expect(trimAliases(aliasesAsArrayOfOne[0], false)).toEqual(
      expectedTrimmedArr
    );
    expect(trimAliases(aliasesAsArrayOfMany, true)).toEqual(expectedTrimmedArr);
  });
});

/** Test organization with all fields defined. */
const TEST_ORGANIZATION: Organization = {
  names: [
    {
      languageCode: "EN",
      name: "Org1"
    }
  ],
  uuid: "617a27e2-8145-4077-a4a5-65af3de416d7",
  id: "1",
  type: "organization",
  aliases: ["DEW", "ACE"]
};
