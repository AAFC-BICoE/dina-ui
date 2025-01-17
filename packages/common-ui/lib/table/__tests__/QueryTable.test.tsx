import {
  FilterParam,
  KitsuResource,
  KitsuResponse,
  PersistedResource
} from "kitsu";
import { range } from "lodash";
import { IntlProvider } from "react-intl";
import "@testing-library/jest-dom";
import {
  ColumnDefinition,
  MetaWithTotal,
  QueryTable,
  QueryTableProps
} from "../..";
import { mountWithAppContext } from "common-ui";
import {
  fireEvent,
  screen,
  waitForElementToBeRemoved,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
    data: idRange.map<PersistedResource<Todo>>((i) => ({
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

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("QueryTable component", () => {
  const { objectContaining, anything } = expect;

  beforeEach(() => {
    // Clear the mock's call and instance data.
    mockGet.mockClear();
  });

  it("Renders loading state initially.", () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Renders the data from the mocked backend.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    // Continue the test after the data fetch is done.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    expect(wrapper.getByRole("cell", { name: /todo 0/i })).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /todo description 0/i })
    ).toBeInTheDocument();

    expect(wrapper.getByRole("cell", { name: /todo 24/i })).toBeInTheDocument();
    expect(
      wrapper.getByRole("cell", { name: /todo description 24/i })
    ).toBeInTheDocument();
  });

  it("Renders the headers defined in the columns prop.", () => {
    // Create the table with headers
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    // Expect the field headers:
    expect(wrapper.getByText(/id/i)).toBeInTheDocument();
    expect(wrapper.getByText(/name/i)).toBeInTheDocument();
    expect(wrapper.getByText(/description/i)).toBeInTheDocument();
  });

  it("Renders the total number of pages when no custom pageSize is specified.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        columns={["id", "name", "description"]}
        hideTopPagination={true}
      />,
      { apiContext }
    );

    // Wait until the data is loaded into the table.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Expect "12" for 12 pages, with 300 total matched records:
    expect(
      within(wrapper.getByText(/page of/i)).getByText(/12/i)
    ).toBeInTheDocument();
    expect(wrapper.getAllByText(/total matched records: 300/i).length).toEqual(
      2
    );
  });

  it("Renders the total number of pages when a custom pageSize is specified.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        defaultPageSize={40}
        pageSizeOptions={[40, 80]}
        columns={["id", "name", "description"]}
        hideTopPagination={true}
      />,
      { apiContext }
    );

    // Wait until the data is loaded into the table.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Expect "8" for 8 pages, with 300 total matched records:
    expect(
      within(wrapper.getByText(/page of/i)).getByText(/8/i)
    ).toBeInTheDocument();
    expect(wrapper.getAllByText(/total matched records: 300/i).length).toEqual(
      2
    );
  });

  it("Fetches the next page when the Next button is pressed.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        defaultPageSize={25}
        columns={["id", "name", "description"]}
        hideTopPagination={true}
      />,
      { apiContext }
    );

    // Wait for page 1 to load.
    // Wait until the data is loaded into the table.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // To do 24 should exist but not 25.
    expect(wrapper.getByRole("cell", { name: /todo 24/i })).toBeInTheDocument();
    expect(
      await wrapper.queryByRole("cell", { name: /todo 25/i })
    ).not.toBeInTheDocument();

    // Click the "Next" button.
    fireEvent.click(wrapper.getByRole("button", { name: /next/i }));

    // Clicking "Next" should enable the loading screen.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Wait for the second query to load.
    await wrapper.waitForRequests();

    // The second page should start with todo #25.
    expect(wrapper.getByRole("cell", { name: /todo 25/i })).toBeInTheDocument();

    // The second page should end with todo #49.
    expect(wrapper.getByRole("cell", { name: /todo 49/i })).toBeInTheDocument();
  });

  it("Fetches the previous page when the previous button is pressed.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        defaultPageSize={25}
        columns={["id", "name", "description"]}
        hideTopPagination={true}
      />,
      { apiContext }
    );

    // Making sure there are data before proceed to next step
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Click the "Next" button.
    fireEvent.click(wrapper.getByRole("button", { name: /next/i }));

    // Wait for the second query to load.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Click the "Previous" button.
    fireEvent.click(wrapper.getByRole("button", { name: /previous/i }));

    // Wait for the "Previous" request to finish.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // The first page should start with todo #0.
    expect(wrapper.getByRole("cell", { name: /todo 0/i })).toBeInTheDocument();

    // The first page should end with todo #24.
    expect(wrapper.getByRole("cell", { name: /todo 24/i })).toBeInTheDocument();
  });

  it("Fetches sorted data when the defaultSort prop is passed.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        columns={["id", "name", "description"]}
        defaultSort={[{ id: "description", desc: false }]}
      />,
      { apiContext }
    );

    // Wait for the initial request to finish.
    await wrapper.waitForRequests();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ sort: "description" })
    );
  });

  it("Fetches sorted data when the header is clicked.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    // Wait for the initial request to finish.
    await wrapper.waitForRequests();

    // The first request should have no sort.
    expect(mockGet).not.lastCalledWith(
      anything(),
      objectContaining({ sort: anything() })
    );

    // Click the "name" header.
    fireEvent.click(wrapper.getByText(/name/i));
    await wrapper.waitForRequests();

    // The second request should have a "name" sort.
    expect(mockGet).lastCalledWith("todo", objectContaining({ sort: "name" }));

    // Click the "name" header again to sort by descending order.
    fireEvent.click(wrapper.getByText(/name/i));
    await wrapper.waitForRequests();

    // The third request should have a "-name" sort.
    expect(mockGet).lastCalledWith("todo", objectContaining({ sort: "-name" }));

    // There should have been 3 requests: the initial one, the ascending sort and the
    // descending sort.
    expect(mockGet).toHaveBeenCalledTimes(3);
  });

  it("Fetches multi-sorted data when a second header is shift-clicked.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    // Wait for the initial request to finish.
    await wrapper.waitForRequests();

    // Click the "name" header.
    fireEvent.click(wrapper.getByText(/name/i));
    await wrapper.waitForRequests();

    // Shift-click the "description" header.
    fireEvent.click(
      wrapper.getByRole("columnheader", { name: /description/i }),
      { shiftKey: true }
    );
    await wrapper.waitForRequests();

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
    const component = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        defaultPageSize={5}
        pageSizeOptions={[5, 10, 20]}
        columns={["id", "name", "description"]}
      />,
      { apiContext }
    );
    await component.waitForRequests();

    // The initial request should have a pageSize of 5.
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ page: { limit: 5, offset: 0 } })
    );
    const reactTable = await component.findByTestId("ReactTable");

    // Expect 5 rows.
    expect(reactTable.querySelectorAll("tbody tr").length).toEqual(5);
    const pageSizeSelect = await component.findAllByTestId("pagination");
    expect(pageSizeSelect[0]).toBeInTheDocument();
  });

  it("Sends a request for filtered data when the filter prop is passed.", async () => {
    const firstFilterProp: FilterParam = { name: "todo 1" };

    const firstProps: QueryTableProps<Todo> = {
      columns: ["id", "name", "description"],
      filter: firstFilterProp,
      path: "todo"
    };

    const wrapper = mountWithAppContext(<QueryTable<Todo> {...firstProps} />, {
      apiContext
    });

    // Wait for the first request to finish.
    await wrapper.waitForRequests();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ filter: firstFilterProp })
    );

    // Update the filter prop.
    const secondFilterProp: FilterParam = { description: "todo 2" };
    wrapper.rerender(
      <QueryTable<Todo> {...firstProps} filter={secondFilterProp} />
    );

    // When a new filter is passed, a new request is sent with the new filter.
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ filter: secondFilterProp })
    );
  });

  it("Sends a request for included resources when the include prop is passed.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        columns={["id", "name", "description"]}
        include="relatedResource"
      />,
      { apiContext }
    );

    // Wait for the first request to finish.
    await wrapper.waitForRequests();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith(
      "todo",
      objectContaining({ include: "relatedResource" })
    );
  });

  it("Is a striped table.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    // Wait for loading to be completed...
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    expect(wrapper.getByTestId("ReactTable").classList).toContain("-striped");
  });

  it("Accepts a combination of strings and column config objects as props.", async () => {
    const columns: ColumnDefinition<Todo>[] = [
      "id",
      "name",
      {
        id: "upperCaseName",
        header: () => <div>UPPERCASE NAME</div>,
        accessorFn: (row) => row.name.toUpperCase(),
        enableSorting: false
      }
    ];

    // Create the table with headers
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={columns} />,
      { apiContext }
    );

    // Wait for the request to finish.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Expect correct header name in the third header.
    expect(
      wrapper.getByRole("columnheader", { name: /uppercase name/i })
    ).toBeInTheDocument();

    // Expect correct custom cell content in the 3rd data cell.
    expect(wrapper.getByRole("cell", { name: "TODO 0" }));
  });

  it("Scrolls to the top of the table when the page is changed.", async () => {
    // Mock the window's scrollY value.
    Object.defineProperty(window, "scrollY", { value: 400, writable: true });

    // Mock the window's scrollTo function.
    jest.spyOn(window, "scrollTo").mockImplementationOnce((_, y) => {
      Object.defineProperty(window, "scrollY", { value: y, writable: true });
    });

    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        defaultPageSize={10}
        path="todo"
        columns={["id", "name", "description"]}
        hideTopPagination={true}
      />,
      { apiContext }
    );

    // Wait until the data is loaded into the table.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    expect(window.scrollY).toEqual(400);

    // Click to the next page of the table.
    fireEvent.click(wrapper.getByRole("button", { name: /next/i }));

    // The window should have scrolled up to Y position 0.
    expect(window.scrollY).toEqual(0);
  });

  it("Has the paginator at the top and bottom of the table.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    // Making sure there are data before proceed to next step
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    expect(
      wrapper.container.querySelector(".pagination-top")
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(".pagination-bottom")
    ).toBeInTheDocument();
  });

  it("Provides an 'onSortedChange' callback prop.", async () => {
    const mockOnSortedChange = jest.fn();

    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        columns={["id", "name", "description"]}
        reactTableProps={{
          onSortingChange: mockOnSortedChange
        }}
      />,
      { apiContext }
    );

    fireEvent.click(wrapper.getByText(/name/i));
    expect(mockOnSortedChange).toHaveBeenCalled();
  });

  it("Shows the total records count.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    // Wait for the initial request to finish and the total to render.
    await wrapper.waitForRequests();

    // Expecting a total of 300, it's displayed twice for the top and bottom pagination sections.
    expect(wrapper.getAllByText(/total matched records: 300/i).length).toEqual(
      2
    );
  });

  it("Renders an error message when there is a query error.", async () => {
    mockGet.mockImplementationOnce(() => {
      throw {
        errors: [{ detail: "error message 1" }, { detail: "error message 2" }]
      };
    });

    const wrapper = mountWithAppContext(
      <QueryTable<Todo> path="todo" columns={["id", "name", "description"]} />,
      { apiContext }
    );

    // Wait for the initial request to finish and the result to render.
    await wrapper.waitForRequests();

    // Both error messages should be rendered:
    expect(
      wrapper.getByText(/error message 1 error message 2/i)
    ).toBeInTheDocument();
  });

  it("Lets you pass in a 'loading' prop that overrides the internal loading state if true.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        loading={true}
        path="todo"
        columns={["id", "name", "description"]}
      />,
      { apiContext }
    );

    // Wait for the initial request to finish and render.
    await wrapper.waitForRequests();

    // Loading is still expected since we are passing it as a prop.
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("Displays the intl message (if there is one) as a header.", async () => {
    const wrapper = mountWithAppContext(
      <IntlProvider
        locale="en"
        messages={{ field_testField: "My Field Label" }}
        onError={(_) => {
          return;
        }}
      >
        <QueryTable<Todo> path="todo" columns={["testField"]} />
      </IntlProvider>,
      { apiContext }
    );

    // Wait for the request to finish.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    expect(wrapper.getByText("My Field Label")).toBeInTheDocument();
  });

  it("Provides a 'reactTableProps' prop that passes in the query state.", async () => {
    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        columns={[
          { id: "name", header: () => <div>name</div>, accessorKey: "name" }
        ]}
        defaultPageSize={30}
        pageSizeOptions={[30, 60, 90]}
        reactTableProps={({ response }) => ({
          TbodyComponent: () => {
            return (
              <div className="test-body">
                Response length is: {response?.data.length}
              </div>
            );
          }
        })}
      />,
      { apiContext }
    );

    // Wait for the initial request to finish and the result to render.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    expect(wrapper.getByText(/response length is: 30/i)).toBeInTheDocument();
  });

  it("Allow user to type the pagination number", async () => {
    const onPageChangeMock = jest.fn();

    const wrapper = mountWithAppContext(
      <QueryTable<Todo>
        path="todo"
        columns={["id", "name", "description"]}
        reactTableProps={{
          onPageChange: onPageChangeMock
        }}
      />,
      { apiContext }
    );

    // Continue the test after the data fetch is done.
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    const pageSelector = wrapper.getAllByRole("spinbutton", {
      name: /jump to page/i
    })[0];

    // Should start at 1.
    expect(pageSelector).toHaveDisplayValue("1");
    expect(onPageChangeMock).toBeCalledTimes(0);

    // Change it to 12.
    userEvent.clear(pageSelector);
    userEvent.type(pageSelector, "12");
    fireEvent.blur(pageSelector);
    await wrapper.waitForRequests();
    expect(pageSelector).toHaveDisplayValue("12");
    expect(onPageChangeMock).toBeCalledTimes(1);

    // Change it to 8.
    userEvent.clear(pageSelector);
    userEvent.type(pageSelector, "8");
    fireEvent.blur(pageSelector);
    await wrapper.waitForRequests();
    expect(pageSelector).toHaveDisplayValue("8");
    expect(onPageChangeMock).toBeCalledTimes(2);

    // Change it to 13, invalid.
    userEvent.clear(pageSelector);
    userEvent.type(pageSelector, "13");
    fireEvent.blur(pageSelector);
    await wrapper.waitForRequests();
    expect(pageSelector).toHaveDisplayValue("1");
    expect(onPageChangeMock).toBeCalledTimes(3);
  });
});
