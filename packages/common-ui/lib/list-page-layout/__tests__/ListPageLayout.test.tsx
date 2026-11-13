import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  clearAndType,
  mountWithAppContext,
  SimpleSearchFilterBuilder
} from "common-ui";
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

    // Wait for default search to finish.
    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /filter value/i })
      ).toBeInTheDocument();
    });

    // Do a filtered search.
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "101F"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /filter list/i })
    );

    // Requires a filter.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          filter: { name: { ILIKE: "%101F%" } }
        })
      );
    });

    // Click the reset button.
    await userEvent.click(
      wrapper.getByRole("button", { name: /reset filters/i })
    );

    // Verify no filter property exists.
    await waitFor(() => {
      const [, args] = mockGet.mock.lastCall;
      expect(args).not.toHaveProperty("filter");
      expect(args).not.toHaveProperty("fiql");
    });
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

    // Wait for default search to finish.
    await waitFor(() => {
      expect(wrapper.getByText("Type")).toBeInTheDocument();
    });

    // Click type header to trigger sort.
    await userEvent.click(wrapper.getByText("Type"));

    // No filter is sent.
    await waitFor(() => {
      expect(mockGet).lastCalledWith("pcrPrimer", {
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
        additionalFilters={SimpleSearchFilterBuilder.create()
          .where("attr1", "EQ", "a")
          .where("attr2", "EQ", "b")
          .build()}
        defaultSort={[{ id: "createdOn", desc: true }]}
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />,
      { apiContext: mockApiCtx }
    );

    // Ensure additional filters are in request.
    await waitFor(() => {
      expect(mockGet).lastCalledWith("pcrPrimer", {
        filter: { attr1: { EQ: "a" }, attr2: { EQ: "b" } },
        page: { limit: 25, offset: 0 },
        sort: "-createdOn"
      });
    });
  });

  it("Sends additionalFilters as the filter.", async () => {
    mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        additionalFilters={SimpleSearchFilterBuilder.create()
          .where("group", "EQ", "testGroup")
          .build()}
        defaultSort={[{ id: "createdOn", desc: true }]}
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />,
      { apiContext: mockApiCtx }
    );

    // Ensure additional filters are in request.
    await waitFor(() => {
      expect(mockGet).lastCalledWith("pcrPrimer", {
        filter: { group: { EQ: "testGroup" } },
        page: { limit: 25, offset: 0 },
        sort: "-createdOn"
      });
    });
  });

  it("Sends the filter form's filters as the filter, without FIQL.", async () => {
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

    // Wait for default search to finish.
    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /filter value/i })
      ).toBeInTheDocument();
    });

    // Do a filtered search.
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "101F"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /filter list/i })
    );

    // Requires a filter.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          filter: { name: { ILIKE: "%101F%" } }
        })
      );

      // Verify FIQL is not used.
      const [, args] = mockGet.mock.lastCall;
      expect(args).not.toHaveProperty("fiql");
    });
  });

  it("Combines the filter form's filters with additionalFilters containing OR groups.", async () => {
    const wrapper = mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        additionalFilters={(filterForm) =>
          SimpleSearchFilterBuilder.create()
            .whereProvided("group", "EQ", filterForm.group)
            .or((b) =>
              b
                .where("createdBy", "EQ", "me")
                .where("restrictToCreatedBy", "EQ", false)
            )
            .build()
        }
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />,
      { apiContext: mockApiCtx }
    );

    // Wait for default search to finish.
    await waitFor(() => {
      expect(
        wrapper.getByRole("textbox", { name: /filter value/i })
      ).toBeInTheDocument();
    });

    // Do a filtered search.
    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "101F"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /filter list/i })
    );

    // All filters are AND-ed with parenthesized OR groups.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          filter: {
            name: { ILIKE: "%101F%" },
            $or: [
              { createdBy: { EQ: "me" } },
              { restrictToCreatedBy: { EQ: false } }
            ]
          }
        })
      );
    });
  });

  it("Combines the page's own filter with the filter form's filters.", async () => {
    const wrapper = mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer",
          filter: { batchType: "illumina_metagenomics" }
        }}
      />,
      { apiContext: mockApiCtx }
    );

    // The page's filter is sent as it is until the list is filtered.
    await waitFor(() => {
      expect(mockGet).lastCalledWith("pcrPrimer", {
        filter: { batchType: "illumina_metagenomics" },
        page: { limit: 25, offset: 0 },
        sort: "-createdOn"
      });
    });

    await clearAndType(
      wrapper.getByRole("textbox", { name: /filter value/i }),
      "101F"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /filter list/i })
    );

    // Both are sent in one filter: the page's filter is not dropped.
    await waitFor(() => {
      expect(mockGet).lastCalledWith("pcrPrimer", {
        filter: {
          name: { ILIKE: "%101F%" },
          batchType: "illumina_metagenomics"
        },
        page: { limit: 25, offset: 0 },
        sort: "-createdOn"
      });
    });
  });

  it("Sends a filter with an IS NOT partial match as FIQL, which the simple filter can't express.", async () => {
    window.localStorage.setItem(
      "test-layout_filterForm",
      JSON.stringify({
        filterBuilderModel: {
          type: "FILTER_GROUP",
          id: 1,
          operator: "AND",
          children: [
            {
              type: "FILTER_ROW",
              id: 2,
              attribute: "name",
              predicate: "IS NOT",
              searchType: "PARTIAL_MATCH",
              value: "101F"
            }
          ]
        }
      })
    );
    mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer",
          filter: { batchType: "illumina_metagenomics" }
        }}
      />,
      { apiContext: mockApiCtx }
    );

    await waitFor(() => {
      expect(mockGet).lastCalledWith("pcrPrimer", {
        fiql: "name!=*101F*;batchType==illumina_metagenomics",
        page: { limit: 25, offset: 0 },
        sort: "-createdOn"
      });
    });
  });
});
