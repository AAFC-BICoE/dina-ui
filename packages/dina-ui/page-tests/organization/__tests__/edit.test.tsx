import { OperationsResponse } from "common-ui";
import OrganizationEditPage, {
  trimAliases
} from "../../../pages/organization/edit";
import { mountWithAppContext } from "common-ui";
import { Organization } from "../../../types/agent-api/resources/Organization";
import { fireEvent } from "@testing-library/react";
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
              names: [
                {
                  languageCode: "EN",
                  name: "test org"
                },
                {
                  languageCode: "FR",
                  name: "test org FR"
                }
              ],
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

    expect(
      wrapper.getAllByRole("textbox", { name: /english name/i })
    ).toHaveLength(1);
    expect(
      wrapper.getAllByRole("textbox", { name: /french name/i })
    ).toHaveLength(1);

    // Edit the name.
    fireEvent.change(wrapper.getByRole("textbox", { name: /english name/i }), {
      target: {
        name: "name.EN",
        value: "test org new"
      }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);
    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
      "/agent-api/operations",
      [
        {
          op: "POST",
          path: "organization",
          value: {
            attributes: {
              names: [
                {
                  languageCode: "EN",
                  name: "test org new"
                }
              ]
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

  it("Provides a form to edit an organization.", async () => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: TEST_ORGANIZATION,
          status: 201
        }
      ] as OperationsResponse
    });

    mockQuery = { id: 1 };

    const wrapper = mountWithAppContext(<OrganizationEditPage />, {
      apiContext
    });

    // The page should load initially with a loading spinner.
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // Wait for the form to load.
    await new Promise(setImmediate);

    // Check that the existing aliases value is in the field.
    expect(
      wrapper.getByRole("textbox", { name: /aliases/i })
    ).toHaveDisplayValue("DEW,ACE");

    // Modify the aliases value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /aliases/i }), {
      target: {
        name: "aliases",
        value: "DEW"
      }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

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
              aliases: ["DEW"]
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
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    // The patch request will return an error.
    mockPatch.mockImplementationOnce(() => ({
      data: [
        {
          errors: [
            {
              detail: "Name should not be blank",
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
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Test expected error
    expect(wrapper.getByText("Constraint violation: Name should not be blank"));
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
