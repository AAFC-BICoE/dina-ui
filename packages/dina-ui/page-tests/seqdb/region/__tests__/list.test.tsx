import RegionListPage from "../../../../pages/seqdb/region/list";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Region } from "../../../../types/seqdb-api/resources/Region";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_REGIONS: Region[] = [
  {
    description: "description",
    id: "4",
    name: "Test Region 1",
    symbol: "symbol",
    type: "region"
  },
  {
    description: "description",
    id: "5",
    name: "Test Region 2",
    symbol: "symbol",
    type: "region"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_REGIONS
  };
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("Region list page", () => {
  it("Renders the list page.", async () => {
    const wrapper = mountWithAppContext(<RegionListPage />, { apiContext });

    await new Promise(setImmediate);

    // Check that the table contains the links to region details pages.
    expect(wrapper.getByText(/test region 1/i)).toBeInTheDocument();
    expect(wrapper.getByText(/test region 2/i)).toBeInTheDocument();
  });

  it("Allows a filterable search.", async () => {
    const wrapper = mountWithAppContext(<RegionListPage />, { apiContext });

    // Wait for the default search to finish.
    await new Promise(setImmediate);

    // Enter a search value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /filter/i }), {
      target: {
        value: "omni"
      }
    });

    // Submit the search form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

    // Test expected API call and UI elements
    expect(mockGet).toHaveBeenCalledWith(
      "seqdb-api/region",
      expect.objectContaining({ filter: { rsql: "name==*omni*" } })
    );
    expect(wrapper.getByText(/test region 1/i)).toBeInTheDocument();
    expect(wrapper.getByText(/test region 2/i)).toBeInTheDocument();
  });
});
