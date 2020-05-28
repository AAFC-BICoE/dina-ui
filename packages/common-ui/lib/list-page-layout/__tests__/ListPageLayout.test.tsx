import ReactTable from "react-table";
import { QueryTable } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { ListPageLayout } from "../ListPageLayout";

/** Mock Kitsu "get" method. */
const mockGet = jest.fn();

const mockApiCtx: any = { apiClient: { get: mockGet } };

describe("ListPageLayout component", () => {
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
    await new Promise(setImmediate);
    wrapper.update();

    // Do a filtered search.
    wrapper
      .find("input.filter-value")
      .simulate("change", { target: { value: "101F" } });
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);

    // There should be an RSQL filter.
    expect(mockGet).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        filter: { rsql: "name==*101F*" }
      })
    );

    // Click the reset button.
    wrapper.find("button.filter-reset-button").simulate("click");

    // There should be no RSQL filter.
    expect(mockGet).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        filter: { rsql: "" }
      })
    );
  });

  it("Stores the table's sort and page-size in localstorage.", async () => {
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
    await new Promise(setImmediate);
    wrapper.update();

    const testSort = [{ id: "type", desc: false }];

    wrapper.find(ReactTable).prop<any>("onSortedChange")(testSort, null, null);
    wrapper.find(ReactTable).prop<any>("onPageSizeChange")(5, null);

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(QueryTable).prop("defaultSort")).toEqual(testSort);
    expect(wrapper.find(QueryTable).prop("defaultPageSize")).toEqual(5);
  });

  it("Allows a passed additionalFilters prop.", async () => {
    const wrapper = mountWithAppContext(
      <ListPageLayout
        id="test-layout"
        additionalFilters={{
          attr1: "a",
          rsql: "attr2==b"
        }}
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />,
      { apiContext: mockApiCtx }
    );

    expect(wrapper.find(QueryTable).prop("filter")).toEqual({
      attr1: "a",
      rsql: "attr2==b"
    });
  });
});
