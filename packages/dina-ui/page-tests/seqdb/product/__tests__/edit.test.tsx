import { waitForLoadingToDisappear } from "common-ui";
import { ProductEditPage } from "../../../../pages/seqdb/product/edit";
import { clearAndType, mountWithAppContext } from "common-ui";
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

/** Mock axios for POST requests. */
const mockPost = jest.fn();

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet, axios: { patch: mockPatch, post: mockPost } }
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
    mockPost.mockReturnValueOnce({
      data: {
        data: {
          id: "020023d4-c7a7-4d62-981f-776bb799e5b9",
          type: "product",
          attributes: {
            createdBy: "cnc-su",
            createdOn: null,
            group: "aafc",
            name: "New Product",
            type: undefined,
            description: undefined,
            upc: undefined,
            lastModified: "2026-04-24T18:17:13.094+00:00"
          }
        }
      }
    });

    const wrapper = mountWithAppContext(
      <ProductEditPage router={{ query: {}, push: mockPush } as any} />,
      { apiContext }
    );

    // Edit the product name.
    await clearAndType(
      wrapper.getByRole("textbox", { name: /name/i }),
      "New Product"
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);
    await waitForLoadingToDisappear();

    // Test expected API Response
    await waitFor(() => {
      expect(mockPost).lastCalledWith(
        "/seqdb-api/product",
        {
          data: {
            attributes: {
              group: "aafc",
              name: "New Product",
              type: undefined
            },
            id: "00000000-0000-0000-0000-000000000000",
            type: "product"
          }
        },
        expect.anything()
      );
    });

    // The user should be redirected to the new product's details page.
    expect(mockPush).lastCalledWith(
      "/seqdb/product/view?id=020023d4-c7a7-4d62-981f-776bb799e5b9"
    );
  });

  it("Provides a form to edit a Product.", async () => {
    // The patch request will be successful.
    mockPatch.mockReturnValueOnce({
      data: {
        data: {
          id: "10",
          type: "product",
          attributes: {
            createdBy: "cnc-su",
            createdOn: null,
            group: "aafc",
            name: "Rapid Alkaline DNA Extraction",
            type: "product",
            description: "new desc for product 10, was a null value",
            upc: "Universal product code",
            lastModified: "2026-04-24T18:17:13.094+00:00"
          }
        }
      }
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
    await clearAndType(
      wrapper.getByRole("textbox", { name: /description/i }),
      "new desc for product 10, was a null value"
    );

    // Submit the form.
    fireEvent.submit(wrapper.container.querySelector("form")!);
    await waitForLoadingToDisappear();

    // Edit API call should be made with the modified description and all other existing values.
    await waitFor(() => {
      expect(mockPatch).lastCalledWith(
        "/seqdb-api/product/10",
        {
          data: {
            attributes: {
              description: "new desc for product 10, was a null value",
              group: "aafc",
              lastModified: "2019-03-27T04:00:00.000+0000",
              name: "Rapid Alkaline DNA Extraction",
              upc: "Universal product code"
            },
            id: "10",
            type: "product"
          }
        },
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
