import { OperationsResponse } from "components/api-client/jsonapi-types";
import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { ProductEditPage } from "../../../pages/product/edit";
import { Product } from "../../../types/seqdb-api/resources/Product";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn();

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

describe("Product edit page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Provides a form to add a Product.", done => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 1,
            type: "product"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <ProductEditPage router={{ query: {}, push: mockPush } as any} />
    );

    // Edit the product name.
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "New Product" }
    });

    // Submit the form.
    wrapper.find("form").simulate("submit");

    setImmediate(() => {
      expect(mockPatch).lastCalledWith(
        "operations",
        [
          {
            op: "POST",
            path: "product",
            value: {
              attributes: {
                name: "New Product",
                type: undefined
              },
              id: -100,
              type: "product"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the new product's details page.
      expect(mockPush).lastCalledWith("/product/view?id=1");
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
      <ProductEditPage router={{ query: {}, push: mockPush } as any} />
    );

    // Edit the product name.
    wrapper.find(".name-field input").simulate("change", {
      target: { name: "name", value: "invalid name" }
    });

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

  it("Provides a form to edit a Product.", async done => {
    // The get request will return the existing product.
    mockGet.mockImplementation(async model => {
      if (model === "product/10") {
        // The request for the product returns the test product.
        return { data: TEST_PRODUCT };
      } else {
        // Requests for the selectable resources (linked group) return an empty array.
        return { data: [] };
      }
    });

    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: 10,
            type: "product"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithContext(
      <ProductEditPage router={{ query: { id: 10 }, push: mockPush } as any} />
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);

    // Wait for the product form to load.
    await Promise.resolve();
    wrapper.update();

    // // Check that the existing product's name value is in the field.
    expect(wrapper.find(".name-field input").prop("value")).toEqual(
      "Rapid Alkaline DNA Extraction"
    );

    // Modify the "description" value.
    wrapper.find(".description-field input").simulate("change", {
      target: {
        name: "description",
        value: "new desc for product 10, was a null value"
      }
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
            path: "product/10",
            value: {
              attributes: expect.objectContaining({
                description: "new desc for product 10, was a null value",
                name: "Rapid Alkaline DNA Extraction"
              }),
              id: "10",
              relationships: {
                group: {
                  data: expect.objectContaining({ id: "8", type: "group" })
                }
              },
              type: "product"
            }
          }
        ],
        expect.anything()
      );

      // The user should be redirected to the existing product's details page.
      expect(mockPush).lastCalledWith("/product/view?id=10");
      done();
    });
  });
});

/** Test Product with all fields defined. */
const TEST_PRODUCT: Required<Product> = {
  description: "desc",
  group: {
    description: "group desc",
    groupName: "Public",
    id: "8",
    type: "group"
  },
  id: "10",
  lastModified: "2019-03-27T04:00:00.000+0000",
  name: "Rapid Alkaline DNA Extraction",
  type: "product",
  upc: "Universal product code"
};
