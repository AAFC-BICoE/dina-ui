import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { ProductDetailsPage } from "../../../pages/product/view";
import { Product } from "../../../types/seqdb-api/resources/Product";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_PRODUCT: Product = {
  group: { id: "1", groupName: "Test Group", type: "group" },
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

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

describe("Product details page", () => {
  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithContext(
      <ProductDetailsPage router={{ query: { id: "100" } } as any} />
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the Product details", async () => {
    const wrapper = mountWithContext(
      <ProductDetailsPage router={{ query: { id: "100" } } as any} />
    );

    // Wait for the page to load.
    await Promise.resolve();
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The product's name should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<strong>Name</strong>)).toEqual(
      true
    );
    expect(wrapper.containsMatchingElement(<p>Test Product 1</p>)).toEqual(
      true
    );
  });
});
