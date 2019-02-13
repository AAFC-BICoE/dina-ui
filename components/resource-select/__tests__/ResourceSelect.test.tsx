import { mount } from "enzyme";
import Kitsu from "kitsu";
import lodash from "lodash";
import Select from "react-select/lib/Select";
import { ApiClientContext } from "../../api-client/ApiClientContext";
import { ResourceSelect } from "../ResourceSelect";

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
jest.spyOn(lodash, "debounce").mockImplementation(fn => fn);

describe("ResourceSelect component", () => {
  /** JSONAPI client. */
  const testClient = new Kitsu({
    baseURL: "/api",
    pluralize: false,
    resourceCase: "none"
  });

  function mountWithContext(element: JSX.Element) {
    return mount(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        {element}
      </ApiClientContext.Provider>
    );
  }

  it("Renders initially with a loading indicator.", () => {
    const optionLabel = todo => todo.name;

    const wrapper = mountWithContext(
      <ResourceSelect model="todo" optionLabel={optionLabel} />
    );

    expect((wrapper.find(Select).props() as any).isLoading).toEqual(true);
  });

  it("Fetches a list of options from the back-end API.", async () => {
    const optionLabel = todo => todo.name;

    const wrapper = mountWithContext(
      <ResourceSelect model="todo" optionLabel={optionLabel} />
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

  it("Calls the 'onChange' prop with a JSONAPI relationship value.", async () => {
    const optionLabel = todo => todo.name;

    const mockOnChange = jest.fn();

    const wrapper = mountWithContext(
      <ResourceSelect
        model="todo"
        onChange={mockOnChange}
        optionLabel={optionLabel}
      />
    );

    // Wait for the options to load.
    await Promise.resolve();
    wrapper.update();

    const selectProps = wrapper.find(Select).props();
    const { options, onChange } = selectProps;

    // Select the third option
    onChange(options[2]);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).lastCalledWith({ data: { id: 3, type: "todo" } });
  });
});
