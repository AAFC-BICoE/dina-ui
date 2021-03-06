import { PcrProfileDetailsPage } from "../../../../pages/seqdb/pcr-profile/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PcrProfile } from "../../../../types/seqdb-api/resources/PcrProfile";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PROFILE: PcrProfile = {
  id: "5",
  name: "Test Profile",
  type: "thermocyclerprofile"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PROFILE
  };
});

const apiContext: any = { apiClient: { get: mockGet } };

describe("PcrProfile details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(
      <PcrProfileDetailsPage router={{ query: { id: "100" } } as any} />,
      {
        apiContext
      }
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Renders the PCR profile details", async () => {
    const wrapper = mountWithAppContext(
      <PcrProfileDetailsPage router={{ query: { id: "100" } } as any} />,
      {
        apiContext
      }
    );

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
    expect(wrapper.containsMatchingElement(<p>Test Profile</p>)).toEqual(true);
  });
});
