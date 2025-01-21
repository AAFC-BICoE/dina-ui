import PcrPrimerListPage from "../../../../pages/seqdb/pcr-primer/list";
import { mountWithAppContext } from "common-ui";
import { PcrPrimer } from "../../../../types/seqdb-api/resources/PcrPrimer";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

const TEST_PRIMERS: PcrPrimer[] = [
  {
    id: "4",
    lotNumber: 1,
    name: "Test Primer 1",
    seq: "test seq",
    type: "PRIMER"
  },
  {
    id: "5",
    lotNumber: 1,
    name: "Test Primer 2",
    seq: "test seq",
    type: "PRIMER"
  }
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: TEST_PRIMERS
  };
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("PcrPrimer list page", () => {
  it("Renders the list page.", async () => {
    const wrapper = mountWithAppContext(<PcrPrimerListPage />, { apiContext });

    await wrapper.waitForRequests();

    // Check that the table contains the links to primer details pages.
    expect(wrapper.getByText(/test primer 1/i)).toBeInTheDocument();
    expect(wrapper.getByText(/test primer 2/i)).toBeInTheDocument();
  });

  it("Allows a filterable search.", async () => {
    const wrapper = mountWithAppContext(<PcrPrimerListPage />, { apiContext });

    // Wait for the default search to finish.
    await wrapper.waitForRequests();

    // Enter a search value.
    fireEvent.change(wrapper.getByRole("textbox", { name: /filter value/i }), {
      target: {
        value: "101F"
      }
    });

    // Submit the search form.
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    expect(mockGet).toHaveBeenCalledWith(
      "seqdb-api/pcr-primer",
      expect.objectContaining({ filter: { rsql: "name==*101F*" } })
    );
    expect(wrapper.getByText(/test primer 1/i)).toBeInTheDocument();
    expect(wrapper.getByText(/test primer 2/i)).toBeInTheDocument();
  });
});
