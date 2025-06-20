import { writeStorage } from "@rehooks/local-storage";
import { OperationsResponse, waitForLoadingToDisappear } from "common-ui";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../../../components/group-select/useStoredDefaultGroup";
import { ThermocyclerProfileEditPage } from "../../../../pages/seqdb/thermocycler-profile/edit";
import { mountWithAppContext } from "common-ui";
import { ThermocyclerProfile } from "../../../../types/seqdb-api/resources/ThermocyclerProfile";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (path) => {
  // The get request will return the existing profile.
  if (path === "seqdb-api/thermocycler-profile/100") {
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

describe("ThermocyclerProfile edit page", () => {
  beforeEach(() => {
    // Set the deault group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");
    jest.clearAllMocks();
  });

  it("Provides a form to add a ThermocyclerProfile.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "thermocycler-profile"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <ThermocyclerProfileEditPage
        router={{ query: {}, push: mockPush } as any}
      />,
      { apiContext }
    );

    // Edit the profile name.
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { name: "name", value: "New ThermocyclerProfile" }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/seqdb-api/operations",
        [
          {
            op: "POST",
            path: "thermocycler-profile",
            value: {
              attributes: {
                group: "aafc",
                name: "New ThermocyclerProfile",
                steps: [null]
              },
              id: "00000000-0000-0000-0000-000000000000",
              type: "thermocycler-profile"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the new profile's details page.
      expect(mockPush).lastCalledWith("/seqdb/thermocycler-profile/view?id=1");
    });
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
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
      <ThermocyclerProfileEditPage
        router={{ query: {}, push: mockPush } as any}
      />,
      { apiContext }
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(
        wrapper.getByText(
          /constraint violation: name size must be between 1 and 10/i
        )
      ).toBeInTheDocument();
      expect(mockPush).toBeCalledTimes(0);
    });
  });

  it("Provides a form to edit a ThermocyclerProfile.", async () => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "thermocycler-profile"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <ThermocyclerProfileEditPage
        router={{ query: { id: 100 }, push: mockPush } as any}
      />,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    await waitForLoadingToDisappear();

    // Check that the existing profile's app value is in the field.
    expect(wrapper.getByDisplayValue("PCR of ITS regions")).toBeInTheDocument();

    // Modify the application value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /application/i }), {
      target: { name: "application", value: "new app value" }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // "patch" should have been called with a jsonpatch request containing the existing values
    // and the modified one.
    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/seqdb-api/operations",
        [
          {
            op: "PATCH",
            path: "thermocycler-profile/1",
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
              type: "thermocycler-profile"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the existing profile's details page.
      expect(mockPush).lastCalledWith("/seqdb/thermocycler-profile/view?id=1");
    });
  });
});

/** Test Profile with all fields defined. */
const TEST_PROFILE: Required<ThermocyclerProfile> = {
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
  steps: [
    "step1",
    "step2",
    "step3",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ],
  type: "thermocycler-profile"
};
