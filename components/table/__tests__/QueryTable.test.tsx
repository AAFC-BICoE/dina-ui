import { mount } from "enzyme";
import { FilterParam, KitsuResource, KitsuResponse } from "kitsu";
import { range } from "lodash";
import ReactTable from "react-table";
import { MetaWithTotal } from "../../../types/seqdb-api/meta";
import {
  ApiClientContext,
  createContextValue
} from "../../api-client/ApiClientContext";
import { ColumnDefinition, QueryTable, QueryTableProps } from "../QueryTable";

/** Example of an API resource interface definition for a todo-list entry. */
interface Todo extends KitsuResource {
  type: "todo";
  name: string;
  description: string;
}

/**
 * Helper function to get mock todos with the specified range of IDs.
 */
function getMockTodos(page): KitsuResponse<Todo[], MetaWithTotal> {
  const offset = page.offset || 0;
  const idRange = range(offset, offset + page.limit);

  return {
    data: idRange.map<Todo>(i => ({
      description: `todo description ${i}`,
      id: `${i}`,
      name: `todo ${i}`,
      type: "todo"
    })),
    meta: {
      totalResourceCount: 300
    }
  };
}

const mockGet = jest.fn(async (_, { page }) => {
  return getMockTodos(page);
});

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

describe("QueryTable component", () => {
  const { objectContaining, anything } = expect;

  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  beforeEach(() => {
    // Clear the mock's call and instance data.
    mockGet.mockClear();
  });

  it("Renders loading state initially.", () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />
    );

    expect(
      wrapper.contains(
        <div className="-loading -active">
          <div className="-loading-inner">Loading...</div>
        </div>
      )
    ).toEqual(true);
  });

  it("Renders the data from the mocked backend.", async () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />
    );

    // Continue the test after the data fetch is done.
    await Promise.resolve();
    wrapper.update();

    // The loading screen should be gone.
    expect(wrapper.find(".-loading.-active").exists()).toEqual(false);

    const rows = wrapper.find(".rt-tr-group");

    // Expect 25 rows for the 25 mock todos.
    expect(rows.length).toEqual(25);

    // Expect the first row to show the first todo's data.
    expect(
      rows
        .first()
        .find(".rt-td")
        .map(cell => cell.text())
    ).toEqual(["0", "todo 0", "todo description 0"]);

    // Expect the last row to show the last todo's data.
    expect(
      rows
        .last()
        .find(".rt-td")
        .map(cell => cell.text())
    ).toEqual(["24", "todo 24", "todo description 24"]);
  });

  it("Renders the headers defined in the columns prop.", () => {
    // Create the table with headers
    const wrapper = mountWithContext(
      <QueryTable<Todo>
        path="todo"
        columns={["id", "name", "description", "relatedEntity.name"]}
      />
    );

    // Expect the headers in title case.
    expect(
      wrapper.find(".rt-resizable-header-content[children='Id']").exists()
    ).toEqual(true);
    expect(
      wrapper.find(".rt-resizable-header-content[children='Name']").exists()
    ).toEqual(true);
    expect(
      wrapper
        .find(".rt-resizable-header-content[children='Description']")
        .exists()
    ).toEqual(true);
    expect(
      wrapper
        .find(".rt-resizable-header-content[children='Related Entity Name']")
        .exists()
    ).toEqual(true);
  });

  it("Renders the total number of pages when no custom pageSize is specified.", async () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />
    );

    // Wait until the data is loaded into the table.
    await Promise.resolve();
    wrapper.update();
    expect(
      // 300 total records with a pageSize of 25 means 12 pages.
      wrapper
        .find("span.-totalPages")
        .first()
        .text()
    ).toEqual("12");
  });

  it("Renders the total number of pages when a custom pageSize is specified.", async () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo>
        path="todo"
        defaultPageSize={40}
        columns={["id", "name", "description"]}
      />
    );

    // Wait until the data is loaded into the table.
    await Promise.resolve();
    wrapper.update();
    expect(
      // 300 total records with a pageSize of 40 means 8 pages.
      wrapper
        .find("span.-totalPages")
        .first()
        .text()
    ).toEqual("8");
  });

  it("Fetches the next page when the Next button is pressed.", async done => {
    const wrapper = mountWithContext(
      <QueryTable<Todo>
        path="todo"
        defaultPageSize={25}
        columns={["id", "name", "description"]}
      />
    );

    // Wait for page 1 to load.
    await Promise.resolve();
    wrapper.update();

    const page1Rows = wrapper.find(".rt-tr-group");

    // The first page should end with todo #24.
    expect(
      page1Rows
        .last()
        .find(".rt-td")
        .map(cell => cell.text())
    ).toEqual(["24", "todo 24", "todo description 24"]);

    // Click the "Next" button.
    wrapper
      .find(".-next button")
      .first()
      .simulate("click");

    // Clicking "Next" should enable the loading screen.
    expect(wrapper.find(".-loading.-active").exists()).toEqual(true);

    // Wait for the second query to load.
    await Promise.resolve();
    const page2Rows = wrapper.find(".rt-tr-group");

    // The second page should start with todo #25.
    expect(
      page2Rows
        .first()
        .find(".rt-td")
        .map(cell => cell.text())
    ).toEqual(["25", "todo 25", "todo description 25"]);

    // The second page should end with todo #49.
    expect(
      page2Rows
        .last()
        .find(".rt-td")
        .map(cell => cell.text())
    ).toEqual(["49", "todo 49", "todo description 49"]);

    done();
  });

  it("Fetches the previous page when the previous button is pressed.", async () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo>
        path="todo"
        defaultPageSize={25}
        columns={["id", "name", "description"]}
      />
    );

    // Wait for page 1 to load.
    await Promise.resolve();

    // Click the "Next" button.
    wrapper
      .find(".-next button")
      .first()
      .simulate("click");

    // Wait for the second query to load.
    await Promise.resolve();

    // Click the "Previous" button.
    wrapper
      .find(".-previous button")
      .first()
      .simulate("click");

    // Clicking "Previous" should enable the loading screen.
    expect(wrapper.find(".-loading.-active").exists()).toEqual(true);

    // Wait for the "Previous" request to finish.
    await Promise.resolve();

    const rows = wrapper.find(".rt-tr-group");

    // The first page should start with todo #0.
    expect(
      rows
        .first()
        .find(".rt-td")
        .map(cell => cell.text())
    ).toEqual(["0", "todo 0", "todo description 0"]);

    // The first page should end with todo #24.
    expect(
      rows
        .last()
        .find(".rt-td")
        .map(cell => cell.text())
    ).toEqual(["24", "todo 24", "todo description 24"]);
  });

  it("Fetches sorted data when the defaultSort prop is passed.", async () => {
    mountWithContext(
      <QueryTable<Todo>
        path="todo"
        columns={["id", "name", "description"]}
        defaultSort="description"
      />
    );

    // Wait for the initial request to finish.
    await Promise.resolve();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ sort: "description" })
    );
  });

  it("Fetches sorted data when the header is clicked.", async () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />
    );

    // Wait for the initial request to finish.
    await Promise.resolve();

    // The first request should have no sort.
    expect(mockGet).not.lastCalledWith(
      anything(),
      objectContaining({ sort: anything() })
    );

    const nameHeader = wrapper.find(
      ".rt-resizable-header-content[children='Name']"
    );

    // Click the "name" header.
    nameHeader.simulate("click");
    await Promise.resolve();

    // The second request should have a "name" sort.
    expect(mockGet).lastCalledWith("todo", objectContaining({ sort: "name" }));

    // Click the "name" header again to sort by descending order.
    nameHeader.simulate("click");
    await Promise.resolve();

    // The third request should have a "-name" sort.
    expect(mockGet).lastCalledWith("todo", objectContaining({ sort: "-name" }));

    // There should have been 3 requests: the initial one, the ascending sort and the
    // descending sort.
    expect(mockGet).toHaveBeenCalledTimes(3);
  });

  it("Fetches multi-sorted data when a second header is shift-clicked.", async () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />
    );

    // Wait for the initial request to finish.
    await Promise.resolve();

    // Click the "name" header.
    wrapper
      .find(".rt-resizable-header-content[children='Name']")
      .simulate("click");
    await Promise.resolve();

    // Shift-click the "description" header.
    wrapper
      .find(".rt-resizable-header-content[children='Description']")
      .simulate("click", { shiftKey: true });
    await Promise.resolve();

    // This request should be sorted by name and description.
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ sort: "name,description" })
    );

    // Three requests should have happened:
    //  - Initial request with no sort.
    //  - Second request with "name" sort.
    //  - Third request with name and description sort.
    expect(mockGet).toHaveBeenCalledTimes(3);
  });

  it("Provides a dropdown to change the page size.", async () => {
    // Initial pageSize is 5.
    const wrapper = mountWithContext(
      <QueryTable<Todo>
        path="todo"
        defaultPageSize={5}
        columns={["id", "name", "description"]}
      />
    );

    // Wait for the initial request to finish.
    await Promise.resolve();

    // The initial request should have a pageSize of 5.
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ page: { limit: 5, offset: 0 } })
    );

    // Expect 5 rows.
    expect(wrapper.find(".rt-tr-group").length).toEqual(5);

    // Select a new page size of 50.
    wrapper
      .find(".-pagination select")
      .first()
      .simulate("change", { target: { value: 100 } });

    // Wait for the second request to finish.
    await Promise.resolve();

    // The second request should have a pageSize of 5.
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ page: { limit: 100, offset: 0 } })
    );

    // Expect 100 rows.
    expect(wrapper.find(".rt-tr-group").length).toEqual(100);

    // There should have been two requests:
    // - The initial request with page size of 5.
    // - The second request with page size of 100.
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("Sends a request for filtered data when the filter prop is passed.", async () => {
    const firstFilterProp: FilterParam = { name: "todo 1" };

    const firstProps: QueryTableProps<Todo> = {
      columns: ["id", "name", "description"],
      filter: firstFilterProp,
      path: "todo"
    };

    const wrapper = mountWithContext(<QueryTable<Todo> {...firstProps} />);

    // Wait for the first request to finish.
    await Promise.resolve();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ filter: firstFilterProp })
    );

    // Update the filter prop.
    const secondFilterProp: FilterParam = { description: "todo 2" };
    wrapper.setProps({
      children: <QueryTable<Todo> {...firstProps} filter={secondFilterProp} />
    });

    // When a new filter is passed, a new request is sent with the new filter.
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ filter: secondFilterProp })
    );
  });

  it("Sends a request for included resources when the include prop is passed.", async () => {
    mountWithContext(
      <QueryTable<Todo>
        path="todo"
        columns={["id", "name", "description"]}
        include="relatedResource"
      />
    );

    // Wait for the first request to finish.
    await Promise.resolve();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ include: "relatedResource" })
    );
  });

  it("Is a striped table.", () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />
    );

    expect(wrapper.find(ReactTable).hasClass("-striped")).toEqual(true);
  });

  it("Accepts a combination of strings and column config objects as props.", async () => {
    const columns: Array<ColumnDefinition<Todo>> = [
      "id",
      "name",
      {
        Header: "UPPERCASE NAME",
        accessor: row => row.name.toUpperCase(),
        id: "upperCaseName",
        sortable: false
      }
    ];

    // Create the table with headers
    const wrapper = mountWithContext(
      <QueryTable<Todo> path="todo" columns={columns} />
    );

    // Wait for the request to finish.
    await Promise.resolve();
    wrapper.update();

    // Expect correct header name in the third header.
    expect(
      wrapper
        .find(".rt-resizable-header-content")
        .at(2)
        .text()
    ).toEqual("UPPERCASE NAME");

    // Expect correct custom cell content in the 3rd data cell.
    expect(
      wrapper
        .find(".rt-td")
        .at(2)
        .text()
    ).toEqual("TODO 0");
  });

  it("Scrolls to the top of the table when the page is changed.", async () => {
    // Mock the window's scrollY value.
    Object.defineProperty(window, "scrollY", { value: 400, writable: true });

    // Mock the window's scrollTo function.
    jest.spyOn(window, "scrollTo").mockImplementationOnce((_, y) => {
      Object.defineProperty(window, "scrollY", { value: y, writable: true });
    });

    const wrapper = mountWithContext(
      <QueryTable<Todo>
        defaultPageSize={10}
        path="todo"
        columns={["id", "name", "description"]}
      />
    );

    // Mock the table wrapper's Y position as 200.
    (wrapper.instance() as any).divWrapperRef.current = { offsetTop: 200 };

    // Wait until the data is loaded into the table.
    await Promise.resolve();
    wrapper.update();

    // Click to the next page of the table.
    wrapper
      .find(".-next button")
      .first()
      .simulate("click");

    // The window shoul;d have scrolled up to Y position 200.
    expect(window.scrollY).toEqual(200);
  });

  it("Has the paginator at the top and bottom of the table.", () => {
    const wrapper = mountWithContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />
    );

    expect(wrapper.find(".pagination-top").exists()).toEqual(true);
    expect(wrapper.find(".pagination-bottom").exists()).toEqual(true);
  });
});
