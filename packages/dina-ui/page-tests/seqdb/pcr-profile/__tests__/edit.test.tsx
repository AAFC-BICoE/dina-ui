import { OperationsResponse } from "common-ui";
import { PcrProfileEditPage } from "../../../../pages/seqdb/pcr-profile/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { PcrProfile } from "../../../../types/seqdb-api/resources/PcrProfile";
import { writeStorage } from "@rehooks/local-storage";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../../../components/group-select/useStoredDefaultGroup";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async path => {
  // The get request will return the existing profile.
  if (path === "seqdb-api/thermocyclerprofile/100") {
    // The request for the profile returns the test profile.
    return { data: TEST_PROFILE };
  } else {
    // Requests for the selectable resources (linked group, region, etc.) return an empty array.
    return { data: [] };
  }
});

/** Mock axios for operations requests. */
const mockPatch = jest.fn();

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("PcrProfile edit page", () => {
  beforeEach(() => {
    // Set the deault group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");
    jest.clearAllMocks();
  });

  it("Provides a form to add a PcrProfile.", done => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "thermocyclerprofile"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <PcrProfileEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Edit the profile name.
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "New PcrProfile" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      expect(mockPatch).lastCalledWith(
        "/seqdb-api/operations",
        [
          {
            op: "POST",
            path: "thermocyclerprofile",
            value: {
              attributes: {
                group: "aafc",
                name: "New PcrProfile"
              },
              id: "00000000-0000-0000-0000-000000000000",
              type: "thermocyclerprofile"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the new profile's details page.
      expect(mockPush).lastCalledWith("/seqdb/pcr-profile/view?id=1");
      done();
    });
  });

  it("Renders an error after form submit if one is returned from the back-end.", done => {
    // The patch request will return an error.
    mockPatch.mockImplementationOnce(() => ({
      data: [
        {
          errors: [
            {
              detail: "name size must be between 1 and 10",
              status: "422",
              title: "Constraint violation"
            }
          ],
          status: 422
        }
      ] as OperationsResponse
    }));

    const wrapper = mountWithAppContext(
      <PcrProfileEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(".alert.alert-danger").text()).toEqual(
        "Constraint violation: name size must be between 1 and 10"
      );
      expect(mockPush).toBeCalledTimes(0);
      done();
    });
  });

  it("Provides a form to edit a PcrProfile.", async done => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "thermocyclerprofile"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <PcrProfileEditPage
        router={{ query: { id: 100 }, push: mockPush } as any}
      />,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the profile form to load.
    await new Promise(setImmediate);
    wrapper.update();
    // // Check that the existing profile's app value is in the field.
    expect(wrapper.find(".application-field input").prop("value")).toEqual(
      "PCR of ITS regions"
    );

    // Modify the application value.
    wrapper.find(".application-field input").simulate("change", {
      target: { name: "application", value: "new app value" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      // "patch" should have been called with a jsonpatch request containing the existing values
      // and the modified one.
      expect(mockPatch).lastCalledWith(
        "/seqdb-api/operations",
        [
          {
            op: "PATCH",
            path: "thermocyclerprofile/1",
            value: {
              attributes: expect.objectContaining({
                application: "new app value",
                group: "aafc",
                name: "PROF1"
              }),
              id: "1",
              relationships: {
                region: {
                  data: expect.objectContaining({ id: "2", type: "region" })
                }
              },
              type: "thermocyclerprofile"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the existing profile's details page.
      expect(mockPush).lastCalledWith("/seqdb/pcr-profile/view?id=1");
      done();
    });
  });
});

/** Test Profile with all fields defined. */
const TEST_PROFILE: Required<PcrProfile> = {
  application: "PCR of ITS regions",
  cycles: "cycles",
  group: "aafc",
  id: "1",
  lastModified: "2013-03-19T04:00:00.000+0000",
  name: "PROF1",
  region: {
    description: "ITS Region",
    id: "2",
    name: "Internal Transcribed Spacer",
    symbol: "ITS",
    type: "region"
  },
  step1: "step1",
  step10: null,
  step11: null,
  step12: null,
  step13: null,
  step14: null,
  step15: null,
  step2: "step2",
  step3: "step3",
  step4: null,
  step5: null,
  step6: null,
  step7: null,
  step8: null,
  step9: null,
  type: "thermocyclerprofile"
};
