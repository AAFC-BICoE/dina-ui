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

    // Requires an FIQL filter.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          fiql: "name==*101F*"
        })
      );
    });

    // Click the reset button.
    await userEvent.click(
      wrapper.getByRole("button", { name: /reset filters/i })
    );

    // Verify no FIQL filter property exists.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.not.objectContaining({
          fiql: expect.anything()
        })
      );
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

    // Requires an FIQL filter.
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
        fiql: "attr1==a;attr2==b",
        page: { limit: 25, offset: 0 },
        sort: "-createdOn"
      });
    });
  });

  it("Uses fiql for additionalFilters when the parameter is set.", async () => {
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
        fiql: "group==testGroup",
        page: { limit: 25, offset: 0 },
        sort: "-createdOn"
      });
    });
  });

  it("Uses fiql for filtering when the parameter is set.", async () => {
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

    // Requires an FIQL filter.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          fiql: "name==*101F*"
        })
      );

      // Verify only FIQL is used.
      const [, args] = mockGet.mock.lastCall;
      expect(args).not.toHaveProperty("filter");
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
          fiql: "name==*101F*;(createdBy==me,restrictToCreatedBy==false)"
        })
      );
    });
  });
});
