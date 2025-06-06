import { OperationsResponse } from "common-ui";
import { ProductEditPage } from "../../../../pages/seqdb/product/edit";
import { mountWithAppContext } from "common-ui";
import { Product } from "../../../../types/seqdb-api/resources/Product";
import { writeStorage } from "@rehooks/local-storage";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../../../components/group-select/useStoredDefaultGroup";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

/** Mock Kitsu "get" method. */
const mockGet = jest.fn();

/** Mock axios for operations requests. */
const mockPatch = jest.fn();

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch } }
};

describe("Product edit page", () => {
  beforeEach(() => {
    // Set the deault group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");

    jest.resetAllMocks();

    // The get request will return the existing product.
    mockGet.mockImplementation(async (path) => {
      if (path === "seqdb-api/product/10") {
        // The request for the product returns the test product.
        return { data: TEST_PRODUCT };
      } else {
        // Requests for the selectable resources (linked group) return an empty array.
        return { data: [] };
      }
    });
  });

  it("Provides a form to add a Product.", async () => {
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "1",
            type: "product"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <ProductEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Edit the product name.
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        name: "name",
        value: "New Product"
      }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected API Response
    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/seqdb-api/operations",
        [
          {
            op: "POST",
            path: "product",
            value: {
              attributes: {
                group: "aafc",
                name: "New Product",
                type: undefined
              },
              id: "00000000-0000-0000-0000-000000000000",
              type: "product"
            }
          }
        ],
        expect.anything()
      );
    });

    // The user should be redirected to the new product's details page.
    expect(mockPush).lastCalledWith("/seqdb/product/view?id=1");
  });

  it("Renders an error after form submit if one is returned from the back-end.", async () => {
    // The patch request will return an error.
    mockPatch.mockImplementationOnce(async () => ({
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
      <ProductEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Edit the product name.
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        name: "name",
        value: "invalid name"
      }
    });

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected error prompt
    await waitFor(() => {
      expect(
        wrapper.getByText(
          /constraint violation: name size must be between 1 and 10/i
        )
      ).toBeInTheDocument();
      expect(mockPush).toBeCalledTimes(0);
    });
  });

  it("Provides a form to edit a Product.", async () => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: [
        {
          data: {
            id: "10",
            type: "product"
          },
          status: 201
        }
      ] as OperationsResponse
    });

    const wrapper = mountWithAppContext(
      <ProductEditPage router={{ query: { id: 10 }, push: mockPush } as any} />,
      { apiContext }
    );

    // The page should load initially with a loading spinner.
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();

    // Wait for the product form to load.
    await waitFor(() => {
      // Check that the existing product's name value is in the field.
      expect(
        wrapper.getByDisplayValue("Rapid Alkaline DNA Extraction")
      ).toBeInTheDocument();
    });

    // Modify the "description" value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /description/i }), {
      target: {
        name: "description",
        value: "new desc for product 10, was a null value"
      }
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
            path: "product/10",
            value: {
              attributes: expect.objectContaining({
                description: "new desc for product 10, was a null value",
                name: "Rapid Alkaline DNA Extraction"
              }),
              id: "10",
              type: "product"
            }
          }
        ],
        expect.anything()
      );
    });

    // The user should be redirected to the existing product's details page.
    expect(mockPush).lastCalledWith("/seqdb/product/view?id=10");
  });
});

/** Test Product with all fields defined. */
const TEST_PRODUCT: Required<Product> = {
  description: "desc",
  group: "aafc",
  id: "10",
  lastModified: "2019-03-27T04:00:00.000+0000",
  name: "Rapid Alkaline DNA Extraction",
  type: "product",
  upc: "Universal product code"
};
