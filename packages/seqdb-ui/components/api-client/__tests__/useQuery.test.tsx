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

function mountWithContext(Component: React.ComponentType) {
  return mount(
    <ApiClientContext.Provider value={contextValue}>
      <Component />
    </ApiClientContext.Provider>
  );
}

describe("useQuery hook", () => {
  it("Provides an onSuccess callback arg", async () => {
    const mockOnSuccess = jest.fn();

    mockGet.mockImplementationOnce(async () => MOCK_TODO_RESPONSE);

    function TestComponent() {
      useQuery({ path: "todo/1" }, { onSuccess: mockOnSuccess });
      return null;
    }

    mountWithContext(TestComponent);

    await new Promise(setImmediate);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).lastCalledWith(MOCK_TODO_RESPONSE);
  });
});
