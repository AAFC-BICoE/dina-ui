import { mount } from "enzyme";
import { KitsuResource, KitsuResponse } from "kitsu";
import { ApiClientContext } from "../ApiClientContext";
import { ClientSideJoinSpec } from "../client-side-join";
import { useQuery } from "../useQuery";

/** Example of an API resource interface definition for a todo-list entry. */
interface Todo extends KitsuResource {
  type: "todo";
  name: string;

  // Fields for client-side joining to another back-end API:
  creatorId?: string;
  creator?: any;
}

/**
 * Mock response for a single Todo.
 */
const MOCK_TODO_RESPONSE: KitsuResponse<Todo> = {
  data: { id: "25", type: "todo", name: "todo 25" },
  meta: undefined
};

const MOCK_TODO_RESPONSE_WITH_CREATOR_ID: KitsuResponse<Todo[]> = {
  data: [{ id: "25", type: "todo", name: "todo 25", creatorId: "100" }],
  meta: undefined
};

const mockGet = jest.fn();
const mockBulkGet = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

function MockContextProvider({ children }) {
  return (
    <ApiClientContext.Provider value={apiContext}>
      {children}
    </ApiClientContext.Provider>
  );
}

describe("useQuery hook", () => {
  const mockOnSuccess = jest.fn();
  let queryState;

  function TestComponent({
    deps = [] as any[],
    joinSpecs = [] as ClientSideJoinSpec[]
  }) {
    queryState = useQuery(
      { path: "todo/1" },
      { deps, onSuccess: mockOnSuccess, joinSpecs }
    );

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

  it("Lets you do client-side data joins across multiple back-end APIs", async () => {
    mockGet.mockImplementation(async () => MOCK_TODO_RESPONSE_WITH_CREATOR_ID);
    mockBulkGet.mockImplementation(async () => [
      { id: "100", name: "Mat", type: "person" }
    ]);

    // Render with a joinSpec to a "people-api".
    mount(
      <MockContextProvider>
        <TestComponent
          joinSpecs={[
            {
              apiBaseUrl: "/people-api",
              idField: "creatorId",
              joinField: "creator",
              path: todo => `person/${todo.creatorId}`
            }
          ]}
        />
      </MockContextProvider>
    );

    // Await response:
    await new Promise(setImmediate);

    expect(mockBulkGet).toHaveBeenCalledTimes(1);
    expect(mockBulkGet).lastCalledWith(["person/100"], {
      apiBaseUrl: "/people-api",
      returnNullForMissingResource: true
    });

    // The "creator" field from the additional "people" API should have been joined
    // to data from the main "todo" API:
    expect(queryState.response.data).toEqual([
      {
        creator: {
          id: "100",
          name: "Mat",
          type: "person"
        },
        creatorId: "100",
        id: "25",
        name: "todo 25",
        type: "todo"
      }
    ]);
  });
});
