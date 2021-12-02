import { KitsuResource } from "kitsu";
import Select from "react-select/base";
import { ResourceSelect, ResourceSelectProps } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { AsyncOption } from "../ResourceSelect";

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
  useDebounce: fn => [fn, { isPending: () => false }]
}));

describe("ResourceSelect component", () => {
  const DEFAULT_SELECT_PROPS: ResourceSelectProps<Todo> = {
    filter: input => ({ name: input }),
    model: "todo-api/todo",
    optionLabel: todo => todo.name
  };

  function mountWithContext(element: JSX.Element) {
    return mountWithAppContext(element, { apiContext });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders initially with a loading indicator and placeholder message.", () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    expect((wrapper.find(Select).props() as any).isLoading).toEqual(true);
  });

  it("Fetches a list of options from the back-end API.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);
    wrapper.update();

    const options = (wrapper.find(Select).props() as any).options;

    // There should be 4 options including the <None> option.
    expect(options[0].options.length).toEqual(4);
    expect(options[0].options.map(option => option.label)).toEqual([
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
    wrapper.update();

    const options = wrapper.find(Select).prop<any>("options")[0].options;
    const onChange = wrapper.find(Select).prop("onChange");

    // Select the third option (excluding the <none option>).
    onChange(options[3], null as any);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith({
      id: "3",
      name: "todo 3",
      type: "todo"
    });
  });

  it("Allows the 'onChange' prop to be undefined.", () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} onChange={undefined} />
    );

    // Select an option.
    (wrapper.find(Select).props() as any).onChange({
      label: "a todo",
      resource: {},
      value: "1"
    });

    // Nothing should happen because no onChange prop was provided.
  });

  it("Passes optional 'include' prop for the JSONAPI GET request.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} include="group" />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith("todo-api/todo", {
      page: { limit: 6 },
      include: "group",
      sort: "-createdOn"
    });
  });

  it("Omits optional 'sort' and 'include' props from the GET request when they are not passed as props.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);
    wrapper.update();

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
    const filter = input => ({ description: input });

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} filter={filter} />
    );

    const { onInputChange } = wrapper.find(Select).props();

    // Simulate the select component's input change.
    onInputChange("test filter value", null as any);

    // Wait for the options to load.
    await new Promise(setImmediate);
    wrapper.update();

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

    const { options } = wrapper.find(Select).props();

    // The <None> option should be hidden when a search value is specified.
    expect(options).toEqual([
      {
        label: "Search results",
        options: [
          {
            label: "todo 1",
            resource: { id: "1", name: "todo 1", type: "todo" },
            value: "1"
          },
          {
            label: "todo 2",
            resource: { id: "2", name: "todo 2", type: "todo" },
            value: "2"
          },
          {
            label: "todo 3",
            resource: { id: "3", name: "todo 3", type: "todo" },
            value: "3"
          }
        ]
      }
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

    const currentValue = (wrapper.find(Select).props() as any).value;

    expect(currentValue).toEqual({
      label: "DEFAULT TODO",
      resource: {
        id: "300",
        name: "DEFAULT TODO",
        type: "todo"
      },
      value: "300"
    });
  });

  it("Provides a <None> option to set the relationship as null.", async () => {
    const mockOnChange = jest.fn();

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} onChange={mockOnChange} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);
    wrapper.update();

    const options = wrapper.find(Select).prop<any>("options")[0].options;
    const onChange = wrapper.find(Select).prop("onChange");

    const nullOption = options[0];

    expect(nullOption).toEqual({
      label: "<None>",
      resource: {
        id: null
      },
      value: null
    });

    // Select the null option.
    onChange(nullOption, null as any);

    // This should call the onChange prop function with { id: null }.
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith({ id: null });
  });

  it("Shows a <None> label when the <None> option is selected.", () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} value={{ id: null }} />
    );

    expect(wrapper.containsMatchingElement(<div>{"<None>"}</div>)).toEqual(
      true
    );
  });

  it("Shows a '<None>' label in the select input when the passed value's id is null.", () => {
    const nullOption = {
      id: null
    };

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} value={nullOption} />
    );

    expect(wrapper.containsMatchingElement(<div>{"<None>"}</div>)).toEqual(
      true
    );
  });

  it("Allows multi-select mode.", async () => {
    const mockOnChange = jest.fn();

    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        isMulti={true}
        onChange={mockOnChange}
      />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);
    wrapper.update();

    const options = wrapper.find<any>(Select).prop("options")[0].options;
    const onChange = wrapper.find(Select).prop("onChange");

    // Select the second and third options.
    onChange([options[1], options[2]], null as any);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith([
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
    ]);
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
    wrapper.update();

    expect(wrapper.text()).toEqual("todo 2todo 3");
  });

  it("Does not render the 'none' option in multi-select mode.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect<Todo> {...DEFAULT_SELECT_PROPS} isMulti={true} />
    );

    // Wait for the options to load.
    await new Promise(setImmediate);
    wrapper.update();

    const options = wrapper.find(Select).prop<any>("options")[0].options;

    // Only the todos should be options.
    expect(options.map(o => o.resource)).toEqual(MOCK_TODOS.data);
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
    wrapper.update();

    const options = wrapper.find(Select).prop<any>("options")[0].options;
    const asyncOptions = wrapper.find(Select).prop<any>("options")[1].options;

    // There should be 5 options including the <None> option and the custom callback option:
    expect(options.length).toEqual(4);
    expect(asyncOptions.length).toEqual(1);

    // Select the callback option, which should call the callback:
    wrapper.find(Select).prop<any>("onChange")(asyncOptions[0]);

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGetResource).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith(TEST_ASYNC_TODO);
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
    wrapper.update();

    const options = wrapper.find(Select).prop<any>("options")[0].options;
    const asyncOptions = wrapper.find(Select).prop<any>("options")[1].options;

    // There should be 4 options including the custom callback option:
    expect(options.length).toEqual(3);
    expect(asyncOptions.length).toEqual(1);

    // Select the callback option, which should call the callback:
    wrapper.find(Select).prop<any>("onChange")([options[0], asyncOptions[0]]);

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGetResource).toHaveBeenCalledTimes(1);
    // Called with the normal option plus the async-fetched value:
    expect(mockOnChange).lastCalledWith([options[0].resource, TEST_ASYNC_TODO]);
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
    wrapper.update();

    // There should be 5 options including the custom callback option and the none option.
    const options = wrapper.find(Select).prop<any>("options")[0].options;
    const asyncOptions = wrapper.find(Select).prop<any>("options")[1].options;
    expect(options.length).toEqual(4);
    expect(asyncOptions.length).toEqual(1);

    const { onInputChange } = wrapper.find(Select).props();

    // Simulate searching something that does not exist.
    onInputChange("incorrect search with no matches", null as any);

    // Wait for the options to load after the search has been entered.
    await new Promise(setImmediate);
    wrapper.update();

    // Select the last option, which should be the custom callback option.
    wrapper.find(Select).prop<any>("onChange")(asyncOptions[0]);

    await new Promise(setImmediate);
    wrapper.update();

    // If the resource has been called, then the selected option was the async option.
    expect(mockGetResource).toHaveBeenCalledTimes(1);
  });

  it("Fetches the selected value's full object when only a shallow reference (id+type) is provided.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        value={{ id: "ABC", type: "todo" }} // Shallow reference
      />
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockBulkGet).lastCalledWith(["todo/ABC"], {
      apiBaseUrl: "/todo-api",
      returnNullForMissingResource: true
    });

    expect(wrapper.find(Select).prop("value")).toEqual({
      label: "ABC-fetched-from-bulkGet",
      resource: {
        id: "ABC",
        name: "ABC-fetched-from-bulkGet", // The name was fetched using bulkGet.
        type: "todo"
      },
      value: "ABC"
    });
  });

  it("Doesn't fetch the selected value's full object when a full value (not shallow reference) provided.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect<Todo>
        {...DEFAULT_SELECT_PROPS}
        value={{ id: "ABC", type: "todo", name: "example-custom-name" }} // Shallow reference
      />
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockBulkGet).toHaveBeenCalledTimes(0);

    expect(wrapper.find(Select).prop("value")).toEqual({
      label: "example-custom-name",
      resource: {
        id: "ABC",
        name: "example-custom-name", // The name was fetched using bulkGet.
        type: "todo"
      },
      value: "ABC"
    });
  });
});
