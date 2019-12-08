import { PcrProfileDetailsPage } from "../../../pages/pcr-profile/view";
import { mountWithAppContext } from "../../../test-util/app-context";
import { PcrProfile } from "../../../types/seqdb-api/resources/PcrProfile";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PROFILE: PcrProfile = {
  group: { id: "1", groupName: "Test Group", type: "group" },
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

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

describe("PcrProfile details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(
      <PcrProfileDetailsPage router={{ query: { id: "100" } } as any} />
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Renders the PCR profile details", async () => {
    const wrapper = mountWithAppContext(
      <PcrProfileDetailsPage router={{ query: { id: "100" } } as any} />
    );

    // Wait for the page to load.
    await Promise.resolve();
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
