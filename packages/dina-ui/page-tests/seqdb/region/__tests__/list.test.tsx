import RegionListPage from "../../../../pages/seqdb/region/list";
import { mountWithAppContext } from "common-ui";
import { Region } from "../../../../types/seqdb-api/resources/Region";
import { fireEvent, waitFor } from "@testing-library/react";
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

    // Check that the table contains the links to region details pages.
    await waitFor(() => {
      expect(wrapper.getByText(/test region 1/i)).toBeInTheDocument();
      expect(wrapper.getByText(/test region 2/i)).toBeInTheDocument();
    });
  });

  it("Allows a filterable search.", async () => {
    const wrapper = mountWithAppContext(<RegionListPage />, { apiContext });

    // Enter a search value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /filter/i }), {
      target: {
        value: "omni"
      }
    });

    // Submit the search form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    // Test expected API call and UI elements
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        "seqdb-api/region",
        expect.objectContaining({ filter: { rsql: "name==*omni*" } })
      );
      expect(wrapper.getByText(/test region 1/i)).toBeInTheDocument();
      expect(wrapper.getByText(/test region 2/i)).toBeInTheDocument();
    });
  });
});
