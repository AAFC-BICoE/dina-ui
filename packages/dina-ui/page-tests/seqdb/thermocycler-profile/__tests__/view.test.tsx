import ThermocyclerProfileDetailsPage from "../../../../pages/seqdb/thermocycler-profile/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { ThermocyclerProfile } from "../../../../types/seqdb-api/resources/ThermocyclerProfile";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PROFILE: ThermocyclerProfile = {
  id: "5",
  name: "Test Profile",
  type: "thermocycler-profile"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PROFILE
  };
});

const apiContext: any = { apiClient: { get: mockGet } };

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } }),
  withRouter: (fn) => fn
}));

describe("PcrProfile details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<ThermocyclerProfileDetailsPage />, {
      apiContext
    });

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Renders the PCR profile details", async () => {
    const wrapper = mountWithAppContext(<ThermocyclerProfileDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The profile's name should be rendered in a FieldView.
    expect(
      wrapper.containsMatchingElement(
        <strong>Thermocycler Profile Name</strong>
      )
    ).toEqual(true);
    expect(wrapper.containsMatchingElement(<div>Test Profile</div>)).toEqual(
      true
    );
  });
});
