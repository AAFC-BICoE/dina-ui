import { KitsuResource } from "kitsu";
import lodash, { last } from "lodash";
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

const apiContext = {
  apiClient: {
    get: mockGet
  }
} as any;

// Mock out the debounce function to avoid waiting during tests.
jest.spyOn(lodash, "debounce").mockImplementation(fn => fn as any);

describe("ResourceSelect component", () => {
  const DEFAULT_SELECT_PROPS: ResourceSelectProps<any> = {
    filter: input => ({ name: input }),
    model: "todo",
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
    await Promise.resolve();
    wrapper.update();

    const options = (wrapper.find(Select).props() as any).options;

    // There should be 4 options including the <none> option.
    expect(options.length).toEqual(4);
    expect(options.map(option => option.label)).toEqual([
      "<none>",
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
    await Promise.resolve();
    wrapper.update();

    const selectProps = wrapper.find(Select).props();
    const { options, onChange } = selectProps;

    // Select the third option (excluding the <none option>).
    onChange(options[3], null);

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

  it("Passes optional 'sort' and 'include' props for the JSONAPI GET request.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} include="group" sort="name" />
    );

    // Wait for the options to load.
    await Promise.resolve();
    wrapper.update();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).lastCalledWith("todo", { include: "group", sort: "name" });
  });

  it("Omits optional 'sort' and 'include' props from the GET request when they are not passed as props.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} />
    );

    // Wait for the options to load.
    await Promise.resolve();
    wrapper.update();

    expect(mockGet).toHaveBeenCalledTimes(1);

    // Get the params of the last call to Kitsu's GET method.
    const [model, getParams] = mockGet.mock.calls[0];
    expect(model).toEqual("todo");

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
    onInputChange("test filter value", { action: "input-change" });

    // Wait for the options to load.
    await Promise.resolve();
    wrapper.update();

    // The GET function shsould have been called twice: for the initial query and again for the
    // filtered query.
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).lastCalledWith("todo", {
      filter: {
        description: "test filter value"
      }
    });

    const { options } = wrapper.find(Select).props();

    // The <none> option should be hidden when a search value is specified.
    expect(options).toEqual([
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

  it("Provides a <none> option to set the relationship as null.", async () => {
    const mockOnChange = jest.fn();

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} onChange={mockOnChange} />
    );

    // Wait for the options to load.
    await Promise.resolve();
    wrapper.update();

    const { options, onChange } = wrapper.find(Select).props();

    const nullOption = options[0];

    expect(nullOption).toEqual({
      label: "<none>",
      resource: {
        id: null
      },
      value: null
    });

    // Select the null option.
    onChange(nullOption, null);

    // This should call the onChange prop function with { id: null }.
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith({ id: null });
  });

  it("Shows a <none> label when the <none> option is selected.", () => {
    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} value={{ id: null }} />
    );

    expect(wrapper.containsMatchingElement(<div>{"<none>"}</div>)).toEqual(
      true
    );
  });

  it("Shows a '<none>' label in the select input when the passed value's id is null.", () => {
    const nullOption = {
      id: null
    };

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} value={nullOption} />
    );

    expect(wrapper.containsMatchingElement(<div>{"<none>"}</div>)).toEqual(
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
    await Promise.resolve();
    wrapper.update();

    const { options, onChange } = wrapper.find(Select).props();

    // Select the second and third options.
    onChange([options[1], options[2]], null);

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
    await Promise.resolve();
    wrapper.update();

    expect(wrapper.text()).toEqual("todo 2todo 3");
  });

  it("Does not render the 'none' option in multi-select mode.", async () => {
    const wrapper = mountWithContext(
      <ResourceSelect<Todo> {...DEFAULT_SELECT_PROPS} isMulti={true} />
    );

    // Wait for the options to load.
    await Promise.resolve();
    wrapper.update();

    const { options } = wrapper.find(Select).props();

    // Only the todos should be options.
    expect((options as any[]).map(o => o.resource)).toEqual(MOCK_TODOS.data);
  });

  it("Allows a callback options prop to show special options that call a function (single dropdown mode).", async () => {
    const TEST_ASYNC_TODO = { id: "100", type: "todo", name: "async todo" };
    const mockGetResource = jest.fn(async () => TEST_ASYNC_TODO);
    const mockOnChange = jest.fn();

    const TEST_CALLBACK_OPTION: AsyncOption<Todo> = {
      label: <>My Callback Option</>,
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
    await Promise.resolve();
    wrapper.update();

    const options = wrapper.find(Select).prop("options");

    // There should be 5 options including the <none> option and the custom callback option:
    expect(options.length).toEqual(5);

    // Select the callback option, which should call the callback:
    wrapper.find(Select).prop("onChange")(last(options));

    await Promise.resolve();
    wrapper.update();

    expect(mockGetResource).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith(TEST_ASYNC_TODO);
  });

  it("Allows a callback options prop to show special options that call a function (multi dropdown mode).", async () => {
    const TEST_ASYNC_TODO = { id: "100", type: "todo", name: "async todo" };
    const mockGetResource = jest.fn(async () => TEST_ASYNC_TODO);
    const mockOnChange = jest.fn();

    const TEST_CALLBACK_OPTION: AsyncOption<Todo> = {
      label: <>My Callback Option</>,
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
    await Promise.resolve();
    wrapper.update();

    const options = wrapper.find(Select).prop("options");

    // There should be 4 options including the custom callback option:
    expect(options.length).toEqual(4);

    // Select the callback option, which should call the callback:
    wrapper.find(Select).prop("onChange")([options[0], last(options)]);

    await Promise.resolve();
    wrapper.update();

    expect(mockGetResource).toHaveBeenCalledTimes(1);
    // Called with the normal option plus the async-fetched value:
    expect(mockOnChange).lastCalledWith([options[0].resource, TEST_ASYNC_TODO]);
  });
});
