import OrganizationDetailsPage from "../../../pages/organization/view";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Organization } from "../../../types/agent-api/resources/Organization";

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

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the Organization details", async () => {
    const wrapper = mountWithAppContext(<OrganizationDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The organization's name should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(<strong>English Name</strong>)
    ).toEqual(true);
    expect(wrapper.containsMatchingElement(<div>organization a</div>)).toEqual(
      true
    );

    // The organization's email should be rendered in a FieldView.
    expect(wrapper.find(".aliases-field .field-view").text()).toEqual(
      "org1, org2"
    );
  });
});
