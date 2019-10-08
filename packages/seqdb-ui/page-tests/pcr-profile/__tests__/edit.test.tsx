import { OperationsResponse } from "components/api-client/jsonapi-types";
import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { PcrProfileEditPage } from "../../../pages/pcr-profile/edit";
import { PcrProfile } from "../../../types/seqdb-api/resources/PcrProfile";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  // The get request will return the existing profile.
  if (model === "thermocyclerprofile/100") {
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

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
      public axios = {
        patch: mockPatch
      };
    }
);

function mountWithContext(element: JSX.Element) {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      {element}
    </ApiClientContext.Provider>
  );
}

describe("PcrProfile edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a PcrProfile.", done => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 1,
            type: "thermocyclerprofile"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <PcrProfileEditPage router={{ query: {}, push: mockPush } as any} />
    );

    // Edit the profile name.
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "New PcrProfile" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      expect(mockPatch).lastCalledWith(
        "operations",
        [
          {
            op: "POST",
            path: "thermocyclerprofile",
            value: {
              attributes: {
                name: "New PcrProfile"
              },
              id: -100,
              type: "thermocyclerprofile"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the new profile's details page.
      expect(mockPush).lastCalledWith("/pcr-profile/view?id=1");
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

    const wrapper = mountWithContext(
      <PcrProfileEditPage router={{ query: {}, push: mockPush } as any} />
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
            id: 1,
            type: "thermocyclerprofile"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <PcrProfileEditPage
        router={{ query: { id: 100 }, push: mockPush } as any}
      />
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the profile form to load.
    await Promise.resolve();
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
        "operations",
        [
          {
            op: "PATCH",
            path: "thermocyclerprofile/1",
            value: {
              attributes: expect.objectContaining({
                application: "new app value",
                name: "PROF1"
              }),
              id: "1",
              relationships: {
                group: {
                  data: expect.objectContaining({ id: "8", type: "group" })
                },
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
      expect(mockPush).lastCalledWith("/pcr-profile/view?id=1");
      done();
    });
  });
});

/** Test Profile with all fields defined. */
const TEST_PROFILE: Required<PcrProfile> = {
  application: "PCR of ITS regions",
  cycles: "cycles",
  group: {
    description: null,
    groupName: "Public",
    id: "8",
    type: "group"
  },
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
