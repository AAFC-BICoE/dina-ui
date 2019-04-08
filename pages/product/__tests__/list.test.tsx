import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { Product } from "../../../types/seqdb-api/resources/Product";
import ProductListPage from "../list";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PRODUCTS: Product[] = [
  {
    group: { id: "1", groupName: "Test Group", type: "group" },
    id: "4",
    name: "Test Product 1",    
    type: "PRODUCT"
  },
  {
    group: { id: "2", groupName: "Test Group", type: "group" },
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

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

describe("Product list page", () => {
  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  it("Renders the list page.", async () => {
    const wrapper = mountWithContext(<ProductListPage />);

    await Promise.resolve();
    wrapper.update();

    // Check that the table contains the links to product details pages.
    expect(wrapper.containsMatchingElement(<a>Test Product 1</a>)).toEqual(true);
    expect(wrapper.containsMatchingElement(<a>Test Product 2</a>)).toEqual(true);
  });
});
