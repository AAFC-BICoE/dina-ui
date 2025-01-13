import ProductDetailsPage from "../../../../pages/seqdb/product/view";
import { mountWithAppContext } from "common-ui";
import { Product } from "../../../../types/seqdb-api/resources/Product";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PRODUCT: Product = {
  id: "4",
  name: "Test Product 1",
  type: "product"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PRODUCT
  };
});

const apiContext: any = { apiClient: { get: mockGet } };

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } }),
  withRouter: (fn) => fn
}));

describe("Product details page", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<ProductDetailsPage />, {
      apiContext
    });

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Render the Product details", async () => {
    const wrapper = mountWithAppContext(<ProductDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);

    // Test loading spinner to not render when product fields are rendered
    expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();

    // The product's name should be rendered in a FieldView.
    expect(wrapper.getByText(/name/i)).toBeInTheDocument();
    expect(wrapper.getAllByText(/test product 1/i)[1]).toBeInTheDocument();
  });
});
