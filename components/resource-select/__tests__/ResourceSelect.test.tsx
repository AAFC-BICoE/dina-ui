import { mount } from "enzyme";
import lodash from "lodash";
import Select from "react-select/lib/Select";
import {
  ApiClientContext,
  createContextValue
} from "../../api-client/ApiClientContext";
import { ResourceSelect, ResourceSelectProps } from "../ResourceSelect";

/** Mock resources to select as dropdown options. */
const MOCK_TODOS = {
  data: [
    { id: 1, type: "todo", name: "todo 1" },
    { id: 2, type: "todo", name: "todo 2" },
    { id: 3, type: "todo", name: "todo 3" }
  ]
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (_, {}) => {
  return MOCK_TODOS;
});

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

// Mock out the debounce function to avoid waiting during tests.
jest.spyOn(lodash, "debounce").mockImplementation(fn => fn as any);

describe("ResourceSelect component", () => {
  const DEFAULT_SELECT_PROPS: ResourceSelectProps<any> = {
    filter: input => ({ name: input }),
    model: "todo",
    optionLabel: todo => todo.name
  };

  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={createContextValue()}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Renders initially with a loading indicator.", () => {
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

    expect(options.length).toEqual(3);
    expect(options.map(option => option.label)).toEqual([
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

    // Select the third option
    onChange(options[2]);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith({
      id: 3,
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
      value: {}
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

    // Simulate the select component's input change.
    (wrapper.find(Select).props() as any).onInputChange(
      "test filter value",
      "input-change"
    );

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
  });

  it("Provides a 'value' prop to specify the select's value.", () => {
    const value = {
      id: 300,
      name: "DEFAULT TODO",
      type: "todo"
    };

    const wrapper = mountWithContext(
      <ResourceSelect {...DEFAULT_SELECT_PROPS} value={value} />
    );

    const currentValue = (wrapper.find(Select).props() as any).value;

    expect(currentValue).toEqual({
      label: "DEFAULT TODO",
      value: {
        id: 300,
        name: "DEFAULT TODO",
        type: "todo"
      }
    });
  });
});
