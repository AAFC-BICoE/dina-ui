import PersonDetailsPage from "../../../pages/person/view";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { Person } from "../../../types/agent-api/resources/Person";
import "@testing-library/jest-dom";

/** Test person with all fields defined. */
const TEST_AGENT: Person = {
  displayName: "person a",
  email: "testperson@a.b",
  id: "1",
  type: "person",
  uuid: "323423-23423-234"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return { data: TEST_AGENT };
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

describe("Person details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<PersonDetailsPage />, { apiContext });

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Render the Person details", async () => {
    const wrapper = mountWithAppContext(<PersonDetailsPage />, { apiContext });

    // Wait for the page to load.
    await waitForLoadingToDisappear();

    // The person's name should be rendered in a FieldView.
    expect(wrapper.getByText(/display name/i)).toBeInTheDocument();
    expect(wrapper.getAllByText(/person a/i)[1]).toBeInTheDocument();

    // The person's email should be rendered in a FieldView.
    expect(wrapper.getByText(/email/i)).toBeInTheDocument();
    expect(wrapper.getByText(/testperson@a\.b/i)).toBeInTheDocument();
  });
});
