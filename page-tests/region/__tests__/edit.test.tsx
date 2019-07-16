import { OperationsResponse } from "components/api-client/jsonapi-types";
import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { RegionEditPage } from "../../../pages/region/edit";
import { Region } from "../../../types/seqdb-api/resources/Region";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async model => {
  if (model === "region/100") {
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

describe("Region edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Provides a form to add a Region.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 1,
            type: "region"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <RegionEditPage router={{ query: {}, push: mockPush } as any} />
    );

    // Edit the region name.
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "New Region" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);

    expect(mockPatch).lastCalledWith(
      "operations",
      [
        {
          op: "POST",
          path: "region",
          value: {
            attributes: {
              name: "New Region"
            },
            id: -100,
            type: "region"
          }
        }
      ],
      expect.anything()
    );

    // The user should be redirected to the new region's details page.
    expect(mockPush).lastCalledWith("/region/view?id=1");
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

    const wrapper = mountWithContext(
      <RegionEditPage router={{ query: {}, push: mockPush } as any} />
    );

    // Add a name.
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "this-name-is-too-long" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      "Constraint violation: name size must be between 1 and 10"
    );
    expect(mockPush).toBeCalledTimes(0);
  });

  it("Provides a form to edit a region.", async () => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 1,
            type: "region"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <RegionEditPage router={{ query: { id: 100 }, push: mockPush } as any} />
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the region form to load.
    await Promise.resolve();
    wrapper.update();

    // Check that the existing region's symbol value is in the field.
    expect(wrapper.find(".symbol-field input").prop("value")).toEqual("symbol");

    // Modify the "symbol" value.
    wrapper.find(".symbol-field input").simulate("change", {
      target: { name: "symbol", value: "new symbol" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);

    // "patch" should have been called with a jsonpatch request containing the existing values
    // and the modified one.
    expect(mockPatch).lastCalledWith(
      "operations",
      [
        {
          op: "PATCH",
          path: "region/1",
          value: {
            attributes: expect.objectContaining({
              description: "desc",
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
    expect(mockPush).lastCalledWith("/region/view?id=1");
  });
});

/** Test Primer with all fields defined. */
const TEST_REGION: Required<Region> = {
  description: "desc",
  id: "1",
  name: "Test Region",
  symbol: "symbol",
  type: "region"
};
