import { fireEvent, waitFor } from "@testing-library/react";
import { mountWithAppContext, SimpleSearchFilterBuilder } from "common-ui";
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
        useFiql={true}
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

    // There should be an FIQL filter.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          fiql: "name==*101F*"
        })
      );
    });

    // Click the reset button.
    fireEvent.click(wrapper.getByRole("button", { name: /reset filters/i }));

    // There should be no FIQL filter. Ensure it contains no fiql property.
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
        useFiql={true}
      />,
      { apiContext: mockApiCtx }
    );

    // Wait for the default search to finish.
    await waitFor(() => {
      expect(wrapper.getByText("Type")).toBeInTheDocument();
    });

    // Click the type header to trigger the sort.
    fireEvent.click(wrapper.getByText("Type"));

    // There should be an FIQL filter.
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
        useFiql={true}
      />,
      { apiContext: mockApiCtx }
    );

    // Ensure the additional filters are included in the request:
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
        useFiql={true}
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
        useFiql={true}
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

    // There should be a fiql filter.
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          fiql: "name==*101F*"
        })
      );

      // check that only fiql is used.
      const [, args] = mockGet.mock.lastCall;
      expect(args).not.toHaveProperty("filter");
    });
  });

  it("Combines additionalFiqlFilters with other FIQL filters.", async () => {
    const wrapper = mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        useFiql={true}
        additionalFiqlFilters="status==active"
        additionalFilters={SimpleSearchFilterBuilder.create()
          .where("group", "EQ", "testGroup")
          .build()}
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

    // All filters should be combined with semicolons (AND operator).
    await waitFor(() => {
      expect(mockGet).lastCalledWith(
        expect.anything(),
        expect.objectContaining({
          fiql: "(name==*101F*);(group==testGroup);(status==active)"
        })
      );
    });
  });

  it("Throws an error when additionalFiqlFilters is used without useFiql.", () => {
    // Mock console.error to suppress error output in test
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => {
      mountWithAppContext(
        <ListPageLayout
          id="test-layout"
          additionalFiqlFilters="status==active"
          filterAttributes={["name"]}
          queryTableProps={{
            columns: ["name", "type"],
            path: "pcrPrimer"
          }}
        />,
        { apiContext: mockApiCtx }
      );
    }).toThrow(
      "additionalFiqlFilters prop can only be used when useFiql is enabled"
    );

    consoleError.mockRestore();
  });
});
