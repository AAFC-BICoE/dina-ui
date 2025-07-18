import { fireEvent, waitFor } from "@testing-library/react";
import { mountWithAppContext } from "common-ui";
import { ListPageLayout } from "../ListPageLayout";
import "@testing-library/jest-dom";

/** Mock Kitsu "get" method. */
const mockGet = jest.fn();

const mockApiCtx: any = { apiClient: { get: mockGet } };

describe("ListPageLayout component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("Has a reset button to clear the filter form.", async () => {
    const wrapper = mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />,
      { apiContext: mockApiCtx }
    );

    // Wait for the default search to finish.
    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /filter value/i })
      ).toBeInTheDocument();
    });

    // Do a filtered search.
    fireEvent.change(wrapper.getByRole("textbox", { name: /filter value/i }), {
      target: { value: "101F" }
    });
    fireEvent.click(wrapper.getByRole("button", { name: /filter list/i }));

    // There should be an RSQL filter.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          filter: { rsql: "name==*101F*" }
        })
      );
    });

    // Click the reset button.
    fireEvent.click(wrapper.getByRole("button", { name: /reset filters/i }));

    // There should be no RSQL filter.
    expect(mockGet).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        filter: {}
      })
    );
  });

  it("Stores the table's sort in localstorage.", async () => {
    const wrapper = mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />,
      { apiContext: mockApiCtx }
    );

    // Wait for the default search to finish.
    await waitFor(() => {
      expect(wrapper.getByText("Type")).toBeInTheDocument();
    });

    // Click the type header to trigger the sort.
    fireEvent.click(wrapper.getByText("Type"));

    // There should be an RSQL filter.
    await waitFor(() => {
      expect(mockGet).lastCalledWith("pcrPrimer", {
        filter: {},
        page: { limit: 25, offset: 0 },
        sort: "-type"
      });
    });

    expect(window.localStorage.getItem("test-layout_tableSort")).toEqual(
      '[{"id":"type","desc":true}]'
    );
  });

  it("Allows a passed additionalFilters prop.", async () => {
    mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        additionalFilters={{
          attr1: "a",
          rsql: "attr2==b"
        }}
        defaultSort={[{ id: "createdOn", desc: true }]}
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />,
      { apiContext: mockApiCtx }
    );

    // Ensure the additional filters are included in the request:
    await waitFor(() => {
      expect(mockGet).lastCalledWith("pcrPrimer", {
        filter: { attr1: "a", rsql: "attr2==b" },
        page: { limit: 25, offset: 0 },
        sort: "-createdOn"
      });
    });
  });
});
