import ProductListPage from "../../../../pages/seqdb/product/list";
import { mountWithAppContext } from "common-ui";
import { Product } from "../../../../types/seqdb-api/resources/Product";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PRODUCTS: Product[] = [
  {
    id: "4",
    name: "Test Product 1",
    type: "PRODUCT"
  },
  {
    id: "5",
    name: "Test Product 2",
    type: "PRODUCT"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PRODUCTS
  };
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("Product list page", () => {
  it("Renders the list page.", async () => {
    const wrapper = mountWithAppContext(<ProductListPage />, { apiContext });

    // Check that the table contains the links to product details pages.
    await waitFor(() => {
      expect(wrapper.getByText(/test product 1/i)).toBeInTheDocument();
      expect(wrapper.getByText(/test product 2/i)).toBeInTheDocument();
    });
  });

  it("Allows a filterable search.", async () => {
    const wrapper = mountWithAppContext(<ProductListPage />, { apiContext });

    // Enter a search value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /filter value/i }), {
      target: { value: "omni" }
    });

    // Submit the search form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "seqdb-api/product",
        expect.objectContaining({ filter: { rsql: "name==*omni*" } })
      );
      expect(wrapper.getByText(/test product 1/i)).toBeInTheDocument();
      expect(wrapper.getByText(/test product 2/i)).toBeInTheDocument();
    });
  });
});
