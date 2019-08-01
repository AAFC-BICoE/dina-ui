import { mount } from "enzyme";
import ReactTable from "react-table";
import { act } from "react-test-renderer";
import {
  ApiClientContext,
  createContextValue,
  QueryTable
} from "../../../components";
import { ListPageLayout } from "../ListPageLayout";

/** Mock Kitsu "get" method. */
const mockGet = jest.fn();

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

function mountWithContext(element: JSX.Element) {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      {element}
    </ApiClientContext.Provider>
  );
}

describe("ListPageLayout component", () => {
  it("Has a reset button to clear the filter form.", async () => {
    const wrapper = mountWithContext(
      <ListPageLayout
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />
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
    act(() => {
      wrapper.find("button[children='Reset']").simulate("click");
    });

    // There should be no RSQL filter.
    expect(mockGet).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        filter: { rsql: "" }
      })
    );
  });

  it("Stores the table's sort and page-size in cookies.", async () => {
    const wrapper = mountWithContext(
      <ListPageLayout
        filterAttributes={["name"]}
        queryTableProps={{
          columns: ["name", "type"],
          path: "pcrPrimer"
        }}
      />
    );

    // Wait for the default search to finish.
    await new Promise(setImmediate);
    wrapper.update();

    const testSort = [{ id: "type", desc: false }];

    wrapper.find(ReactTable).prop("onSortedChange")(testSort, null, null);
    wrapper.find(ReactTable).prop("onPageSizeChange")(5, null);

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(QueryTable).prop("defaultSort")).toEqual(testSort);
    expect(wrapper.find(QueryTable).prop("defaultPageSize")).toEqual(5);
  });
});
