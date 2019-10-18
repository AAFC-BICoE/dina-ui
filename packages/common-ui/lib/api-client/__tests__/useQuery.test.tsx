import { mount } from "enzyme";
import { KitsuResource, KitsuResponse } from "kitsu";
import { ApiClientContext, createContextValue } from "../ApiClientContext";
import { useQuery } from "../useQuery";

/** Example of an API resource interface definition for a todo-list entry. */
interface Todo extends KitsuResource {
  type: "todo";
  name: string;
}

/**
 * Mock response for a single Todo.
 */
const MOCK_TODO_RESPONSE: KitsuResponse<Todo> = {
  data: { id: "25", type: "todo", name: "todo 25" },
  meta: undefined
};

const mockGet = jest.fn();

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

const contextValue = createContextValue();

function MockContextProvider({ children }) {
  return (
    <ApiClientContext.Provider value={contextValue}>
      {children}
    </ApiClientContext.Provider>
  );
}

describe("useQuery hook", () => {
  const mockOnSuccess = jest.fn();

  function TestComponent({ deps = null }) {
    useQuery({ path: "todo/1" }, { deps, onSuccess: mockOnSuccess });
    return null;
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Provides an onSuccess callback arg", async () => {
    mockGet.mockImplementationOnce(async () => MOCK_TODO_RESPONSE);
    mount(
      <MockContextProvider>
        <TestComponent />
      </MockContextProvider>
    );

    await new Promise(setImmediate);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).lastCalledWith(MOCK_TODO_RESPONSE);
  });

  it("Re-fetches the data if the 'deps' prop changes.", async () => {
    mockGet.mockImplementation(async () => MOCK_TODO_RESPONSE);

    // Render with an initial 'deps' prop.
    const wrapper = mount(
      <MockContextProvider>
        <TestComponent deps={[1]} />
      </MockContextProvider>
    );
    await new Promise(setImmediate);
    // Update with a different 'deps' prop.
    wrapper.setProps({
      children: <TestComponent deps={[2]} />
    });
    await new Promise(setImmediate);

    // The request should have been sent twice.
    expect(mockOnSuccess).toHaveBeenCalledTimes(2);
    expect(mockOnSuccess).lastCalledWith(MOCK_TODO_RESPONSE);
  });

  it("Does not re-fetch the data if the 'deps' prop stays the same.", async () => {
    mockGet.mockImplementation(async () => MOCK_TODO_RESPONSE);

    // Render with an initial 'deps' prop.
    const wrapper = mount(
      <MockContextProvider>
        <TestComponent deps={[1]} />
      </MockContextProvider>
    );
    await new Promise(setImmediate);
    // Update with the same 'deps' prop.
    wrapper.setProps({
      children: <TestComponent deps={[1]} />
    });
    await new Promise(setImmediate);

    // The request should only have been sent once.
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).lastCalledWith(MOCK_TODO_RESPONSE);
  });
});
