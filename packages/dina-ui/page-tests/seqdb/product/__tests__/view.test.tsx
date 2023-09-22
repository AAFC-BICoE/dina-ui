import ProductDetailsPage from "../../../../pages/seqdb/product/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Product } from "../../../../types/seqdb-api/resources/Product";

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

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the Product details", async () => {
    const wrapper = mountWithAppContext(<ProductDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The product's name should be rendered in a FieldView.
    expect(wrapper.find(".name-field-header").exists()).toEqual(true);
    expect(wrapper.containsMatchingElement(<div>Test Product 1</div>)).toEqual(
      true
    );
  });
});
