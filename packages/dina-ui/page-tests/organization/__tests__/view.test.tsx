import OrganizationDetailsPage from "../../../pages/organization/view";
import { mountWithAppContext } from "common-ui";
import { Organization } from "../../../types/agent-api/resources/Organization";
import "@testing-library/jest-dom";

/** Test organization with all fields defined. */
const TEST_ORGANIZATION: Organization = {
  names: [
    {
      languageCode: "EN",
      name: "organization a"
    }
  ],
  aliases: ["org1", "org2"],
  id: "1",
  type: "organization",
  uuid: "323423-23423-234"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return { data: TEST_ORGANIZATION };
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet }
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } })
}));

describe("Organization details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<OrganizationDetailsPage />, {
      apiContext
    });

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Render the Organization details", async () => {
    const wrapper = mountWithAppContext(<OrganizationDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);

    expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();

    // The organization's name should be rendered in a FieldView.
    expect(wrapper.getByText("English Name")).toBeInTheDocument();
    expect(wrapper.getAllByText(/organization a/i)).not.toBeNull();

    // The organization's email should be rendered in a FieldView.
    expect(wrapper.getByText("org1, org2")).toBeInTheDocument();
  });
});
