import { OperationsResponse } from "common-ui";
import { RegionEditPage } from "../../../../pages/seqdb/region/edit";
import { mountWithAppContext } from "common-ui";
import { Region } from "../../../../types/seqdb-api/resources/Region";
import { writeStorage } from "@rehooks/local-storage";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../../../components/group-select/useStoredDefaultGroup";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (path) => {
  if (path === "seqdb-api/region/100") {
    // The request for the primer returns the test region.
    return { data: TEST_REGION };
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

describe("Region edit page", () => {
  beforeEach(() => {
    // Set the deault group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");
    jest.clearAllMocks();
  });

  it("Provides a form to add a Region.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "region"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <RegionEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Edit the region name.
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { name: "name", value: "New Region" }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    expect(mockPatch).toHaveBeenLastCalledWith(
      "/seqdb-api/operations",
      [
        {
          op: "POST",
          path: "region",
          value: {
            attributes: {
              group: "aafc",
              name: "New Region"
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "region"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new region's details page.
    expect(mockPush).toHaveBeenLastCalledWith("/seqdb/region/view?id=1");
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
      <RegionEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Add a name.
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: { name: "name", value: "this-name-is-too-long" }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test expected error response.
    expect(
      wrapper.getByText(
        /constraint violation: name size must be between 1 and 10/i
      )
    ).toBeInTheDocument();
    expect(mockPush).toBeCalledTimes(0);
  });

  it("Provides a form to edit a region.", async () => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "region"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <RegionEditPage router={{ query: { id: 100 }, push: mockPush } as any} />,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // Wait for the region form to load.
    await wrapper.waitForRequests();

    // Check that the existing region's symbol value is in the field.
    expect(wrapper.getByDisplayValue("symbol")).toBeInTheDocument();

    // Modify the "symbol" value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /symbol/i }), {
      target: {
        name: "symbol",
        value: "new symbol"
      }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // "patch" should have been called with a jsonpatch request containing the existing values
    // and the modified one.
    expect(mockPatch).toHaveBeenLastCalledWith(
      "/seqdb-api/operations",
      [
        {
          op: "PATCH",
          path: "region/1",
          value: {
            attributes: expect.objectContaining({
              description: "desc",
              group: "aafc",
              name: "Test Region",
              symbol: "new symbol"
            }),
            id: "1",
            type: "region"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the existing region's details page.
    expect(mockPush).toHaveBeenLastCalledWith("/seqdb/region/view?id=1");
  });
});

/** Test Primer with all fields defined. */
const TEST_REGION: Required<Region> = {
  description: "desc",
  group: "aafc",
  id: "1",
  name: "Test Region",
  symbol: "symbol",
  type: "region"
};
