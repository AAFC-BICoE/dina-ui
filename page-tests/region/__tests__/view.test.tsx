import { mount } from "enzyme";
import { ApiClientContext, createContextValue } from "../../../components";
import { RegionDetailsPage } from "../../../pages/region/view";
import { Region } from "../../../types/seqdb-api/resources/Region";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

const TEST_REGION: Region = {
  description: "test region",
  id: "5",
  name: "Test Region",
  symbol: "symbol",
  type: "region"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_REGION
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

describe("Region details page", () => {
  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithContext(
      <RegionDetailsPage router={{ query: { id: "100" } } as any} />
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Render the gene region details", async () => {
    const wrapper = mountWithContext(
      <RegionDetailsPage router={{ query: { id: "100" } } as any} />
    );

    // Wait for the page to load.
    await Promise.resolve();
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The region's name should be rendered in a FieldView.
    expect(wrapper.containsMatchingElement(<p>Test Region</p>)).toEqual(true);
  });
});
