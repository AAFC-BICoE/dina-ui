import { QueryTable } from "common-ui";
import ProductListPage from "../../../../pages/seqdb/product/list";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Product } from "../../../../types/seqdb-api/resources/Product";

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

    await new Promise(setImmediate);
    wrapper.update();

    // Check that the table contains the links to product details pages.
    expect(wrapper.containsMatchingElement(<a>Test Product 1</a>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<a>Test Product 2</a>)).toEqual(
      true
    );
  });

  it("Allows a filterable search.", async () => {
    const wrapper = mountWithAppContext(<ProductListPage />, { apiContext });

    // Wait for the default search to finish.
    await new Promise(setImmediate);
    wrapper.update();

    // Enter a search value.
    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "omni" } });

    // Submit the search form.
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();
    expect(mockGet).toHaveBeenCalledWith(
      "seqdb-api/product",
      expect.objectContaining({ filter: { rsql: "name==*omni*" } })
    );
    expect(wrapper.find(QueryTable).prop("filter")).toEqual({
      rsql: "name==*omni*"
    });
  });
});
