import { KitsuResource } from "kitsu";
import { ResourceSelect, ResourceSelectProps } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { AsyncOption } from "../ResourceSelect";
import "@testing-library/jest-dom";
import { fireEvent } from "@testing-library/react";

/** Example */
interface Todo extends KitsuResource {
  name: string;
}

/** Mock resources to select as dropdown options. */
const MOCK_TODOS = {
  data: [
    { id: "1", type: "todo", name: "todo 1" },
    { id: "2", type: "todo", name: "todo 2" },
    { id: "3", type: "todo", name: "todo 3" }
  ] as Todo[]
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (_, {}) => {
  return MOCK_TODOS;
});

const mockBulkGet = jest.fn(async (paths, _) => {
  if (paths.length === 0) {
    return [];
  }
  return paths.map((path: string) => {
    const id = path.replace("todo/", "");
    return {
      // Return a mock todo with the supplied ID:
      id,
      type: "todo",
      name: `${id}-fetched-from-bulkGet`
    };
  });
});

const apiContext = {
  apiClient: {
    get: mockGet
  },
  bulkGet: mockBulkGet
} as any;

// Mock out the debounce function to avoid waiting during tests.
jest.mock("use-debounce", () => ({
  useDebounce: (fn) => [fn, { isPending: () => false }]
}));

describe("ResourceSelect component", () => {
  const DEFAULT_SELECT_PROPS: ResourceSelectProps<Todo> = {
    filter: (input) => ({ name: input }),
    model: "todo-api/todo",
    optionLabel: (todo) => todo.name
  };

  function mountWithContext(element: JSX.Element) {
    return mountWithAppContext(element, { apiContext });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders initially with a loading indicator and placeholder message.", async () => {
    const { container } = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    expect(
      container.querySelector(".react-select__loading-indicator")
    ).toBeInTheDocument();

    // Wait for the options to load.
    await new Promise(setImmediate);

    expect(
      container.querySelector(".react-select__loading-indicator")
    ).not.toBeInTheDocument();
  });

  it("Fetches a list of options from the back-end API.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    fireEvent.click(wrapper.getByText(/type here to search\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await new Promise(setImmediate);

    // There should be 4 options including the <None> option.
    const options = wrapper.getAllByRole("option");
    expect(options.length).toEqual(4);
    expect(options.map((option) => option.textContent)).toEqual([
      "<None>",
      "todo 1",
      "todo 2",
      "todo 3"
    ]);
  });

  it("Calls the 'onChange' prop with a resource value.", async () => {
    const mockOnChange = jest.fn();

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} onChange={mockOnChange} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    fireEvent.click(wrapper.getByText(/type here to search\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await new Promise(setImmediate);

    const options = wrapper.getAllByRole("option");

    // Select the third option.
    fireEvent.click(options[3]);
    await new Promise(setImmediate);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith(
      {
        id: "3",
        name: "todo 3",
        type: "todo"
      },
      expect.objectContaining({})
    );
  });

  it("Allows the 'onChange' prop to be undefined.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} onChange={undefined} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    fireEvent.click(wrapper.getByText(/type here to search\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await new Promise(setImmediate);

    const options = wrapper.getAllByRole("option");

    // Select the third option.
    fireEvent.click(options[3]);

    // Nothing should happen because no onChange prop was provided.
  });

  it("Passes optional 'include' prop for the JSONAPI GET request.", async () => {
    mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} include="group" />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith("todo-api/todo", {
      page: { limit: 6 },
      include: "group",
      sort: "-createdOn"
    });
  });

  it("Omits optional 'sort' and 'include' props from the GET request when they are not passed as props.", async () => {
    mountWithContext(<ResourceSelect {...DEFAULT_SELECT_PROPS} />);

    // Wait for the options to load.
    await new Promise(setImmediate);

    expect(mockGet).toHaveBeenCalledTimes(1);

    // Get the params of the last call to Kitsu's GET method.
    const [model, getParams] = mockGet.mock.calls[0];
    expect(model).toEqual("todo-api/todo");

    // The query's GET params should not have any values explicitly set to undefined.
    // This would create an invalid request URL, e.g. /api/todo?fields=undefined
    expect(Object.values(getParams).includes(undefined)).toBeFalsy();
  });

  it("Provides a 'filter' prop to filter results.", async () => {
    // Filter by the "description" attribute.
    const filter = (input) => ({ description: input });

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} filter={filter} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    // Simulate changing the value and filtering it.
    fireEvent.change(wrapper.getByRole("combobox"), {
      target: { value: "test filter value" }
    });
    await new Promise(setImmediate);

    // The GET function shsould have been called twice: for the initial query and again for the
    // filtered query.
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).lastCalledWith("todo-api/todo", {
      filter: {
        description: "test filter value"
      },
      sort: "-createdOn",
      page: { limit: 6 }
    });

    const options = wrapper.getAllByRole("option");

    // The <None> option should be hidden when a search value is specified.
    expect(options.map((option) => option.textContent)).toEqual([
      "todo 1",
      "todo 2",
      "todo 3"
    ]);
  });

  it("Provides a 'value' prop to specify the select's value.", () => {
    const value = {
      id: "300",
      name: "DEFAULT TODO",
      type: "todo"
    };

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} value={value} />
    );

    expect(wrapper.getByText(/default todo/i)).toBeInTheDocument();
  });

  it("Provides a <None> option to set the relationship as null.", async () => {
    const mockOnChange = jest.fn();

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} onChange={mockOnChange} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    // Display the options...
    fireEvent.click(wrapper.getByText(/type here to search\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await new Promise(setImmediate);

    const options = wrapper.getAllByRole("option");
    expect(options[0].textContent).toEqual("<None>");

    // Select the null option.
    fireEvent.click(options[0]);

    // This should call the onChange prop function with { id: null }.
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith(
      { id: null },
      expect.objectContaining({})
    );
  });

  it("Shows a <None> label when the <None> option is selected.", () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} value={{ id: null }} />
    );

    expect(wrapper.getByText(/<none>/i)).toBeInTheDocument();
  });

  it("Shows a '<None>' label in the select input when the passed value's id is null.", () => {
    const nullOption = {
      id: null
    };

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} value={nullOption} />
    );

    expect(wrapper.getByText(/<none>/i)).toBeInTheDocument();
  });

  it("Allows multi-select mode.", async () => {
    const mockOnChange = jest.fn();

    const TEST_MULTI_VALUE = [
      {
        id: "1",
        name: "todo 1",
        type: "todo"
      },
      {
        id: "2",
        name: "todo 2",
        type: "todo"
      },
      {
        id: "3",
        name: "todo 3",
        type: "todo"
      }
    ];

    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        isMulti={true}
        value={TEST_MULTI_VALUE}
        onChange={mockOnChange}
      />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    fireEvent.click(wrapper.getByRole("button", { name: /remove todo 1/i }));
    await new Promise(setImmediate);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith(
      [
        {
          id: "2",
          name: "todo 2",
          type: "todo"
        },
        {
          id: "3",
          name: "todo 3",
          type: "todo"
        }
      ],
      expect.objectContaining({})
    );
  });

  it("Renders a list of selected options in multi-select mode.", async () => {
    const TEST_MULTI_VALUE = [
      {
        id: "2",
        name: "todo 2",
        type: "todo"
      },
      {
        id: "3",
        name: "todo 3",
        type: "todo"
      }
    ];

    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        isMulti={true}
        value={TEST_MULTI_VALUE}
      />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    expect(wrapper.getByText(/todo 2/i)).toBeInTheDocument();
    expect(wrapper.getByText(/todo 3/i)).toBeInTheDocument();
  });

  it("Does not render the 'none' option in multi-select mode.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect<Todo> {...DEFAULT_SELECT_PROPS} isMulti={true} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    // Display the options...
    fireEvent.click(wrapper.getByText(/type here to search\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await new Promise(setImmediate);

    const options = wrapper.getAllByRole("option");

    // Only the todos should be options.
    expect(options.map((o) => o.textContent)).toEqual(
      MOCK_TODOS.data.map((o) => o.name)
    );
  });

  it("Allows a callback options prop to show special options that call a function (single dropdown mode).", async () => {
    const TEST_ASYNC_TODO = { id: "100", type: "todo", name: "async todo" };
    const mockGetResource = jest.fn(async () => TEST_ASYNC_TODO);
    const mockOnChange = jest.fn();

    const TEST_CALLBACK_OPTION: AsyncOption<Todo> = {
      label: "My Callback Option",
      getResource: mockGetResource
    };

    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        asyncOptions={[TEST_CALLBACK_OPTION]}
        onChange={mockOnChange}
      />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    // Display the options...
    fireEvent.click(wrapper.getByText(/type here to search\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await new Promise(setImmediate);

    const options = wrapper.getAllByRole("option");

    // There should be 5 options including the <None> option and the custom callback option:
    expect(options.length).toEqual(5);

    // Select the callback option, which should call the callback:
    fireEvent.click(options[4]);

    await new Promise(setImmediate);
    expect(mockGetResource).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith(
      TEST_ASYNC_TODO,
      expect.objectContaining({})
    );
  });

  it("Allows a callback options prop to show special options that call a function (multi dropdown mode).", async () => {
    const TEST_ASYNC_TODO = { id: "100", type: "todo", name: "async todo" };
    const mockGetResource = jest.fn(async () => TEST_ASYNC_TODO);
    const mockOnChange = jest.fn();

    const TEST_CALLBACK_OPTION: AsyncOption<Todo> = {
      label: "My Callback Option",
      getResource: mockGetResource
    };

    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        asyncOptions={[TEST_CALLBACK_OPTION]}
        isMulti={true}
        onChange={mockOnChange}
      />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    // Display the options...
    fireEvent.click(wrapper.getByText(/type here to search\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await new Promise(setImmediate);

    const options = wrapper.getAllByRole("option");

    // There should be 4 options including the custom callback option:
    expect(options.length).toEqual(4);

    // Select the callback option, which should call the callback:
    fireEvent.click(options[3]);

    await new Promise(setImmediate);

    expect(mockGetResource).toHaveBeenCalledTimes(1);
    // Called with the normal option plus the async-fetched value:
    expect(mockOnChange).lastCalledWith(
      [
        {
          id: "100",
          name: "async todo",
          type: "todo"
        }
      ],
      expect.objectContaining({})
    );
  });

  it("Always renders the async options, no matter what the search is", async () => {
    const TEST_ASYNC_TODO = { id: "100", type: "todo", name: "async todo" };
    const mockGetResource = jest.fn(async () => TEST_ASYNC_TODO);
    const mockOnChange = jest.fn();

    const TEST_CALLBACK_OPTION: AsyncOption<Todo> = {
      label: "asyncOption",
      getResource: mockGetResource
    };

    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        asyncOptions={[TEST_CALLBACK_OPTION]}
        onChange={mockOnChange}
      />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);

    // There should be 5 options including the custom callback option and the none option.
    fireEvent.click(wrapper.getByText(/type here to search\./i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await new Promise(setImmediate);

    const options = wrapper.getAllByRole("option");
    expect(options.length).toEqual(5);

    // Simulate changing the value and filtering it.
    fireEvent.change(wrapper.getByRole("combobox"), {
      target: { value: "incorrect search with no matches" }
    });
    fireEvent.keyPress(wrapper.getByRole("combobox"), { key: "Enter" });
    await new Promise(setImmediate);

    // Async option should always be displayed even in search results.
    expect(
      wrapper.getByRole("option", { name: /asyncoption/i })
    ).toBeInTheDocument();
  });

  it("Fetches the selected value's full object when only a shallow reference (id+type) is provided.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        value={{ id: "ABC", type: "todo" }} // Shallow reference
      />
    );

    await new Promise(setImmediate);

    expect(mockBulkGet).lastCalledWith(["todo/ABC"], {
      apiBaseUrl: "/todo-api",
      returnNullForMissingResource: true
    });

    expect(
      wrapper.getByText(/abc\-fetched\-from\-bulkget/i)
    ).toBeInTheDocument();
  });

  it("Doesn't fetch the selected value's full object when a full value (not shallow reference) provided.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        value={{ id: "ABC", type: "todo", name: "example-custom-name" }} // Shallow reference
      />
    );

    await new Promise(setImmediate);
    expect(mockBulkGet).toHaveBeenCalledTimes(0);

    expect(wrapper.getByText(/example\-custom\-name/i)).toBeInTheDocument();
  });
});
