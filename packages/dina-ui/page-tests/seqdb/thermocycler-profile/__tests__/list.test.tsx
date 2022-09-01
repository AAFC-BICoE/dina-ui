import ThermocyclerProfileListPage from "../../../../pages/seqdb/thermocycler-profile/list";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ThermocyclerProfile } from "../../../../types/seqdb-api/resources/ThermocyclerProfile";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PROFILES: ThermocyclerProfile[] = [
  {
    id: "4",
    name: "Test Profile 1",
    type: "PROFILE"
  },
  {
    id: "5",
    name: "Test Profile 2",
    type: "PROFILE"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PROFILES
  };
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("PcrProfile list page", () => {
  it("Renders the list page.", async () => {
    const wrapper = mountWithAppContext(<ThermocyclerProfileListPage />, {
      apiContext
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Check that the table contains the links to profile details pages.
    expect(wrapper.containsMatchingElement(<a>Test Profile 1</a>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<a>Test Profile 2</a>)).toEqual(
      true
    );
  });
});
