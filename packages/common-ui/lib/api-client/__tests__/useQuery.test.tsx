import { DocWithErrors } from "jsonapi-typescript";
import { KitsuResource, KitsuResponse, KitsuResponseData } from "kitsu";
import { last } from "lodash";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { ClientSideJoinSpec } from "../client-side-join";
import { MetaWithTotal } from "../operations-types";
import {
  JsonApiQuerySpec,
  QueryOptions,
  QueryState,
  useQuery
} from "../useQuery";

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

/**
 * Mock response for a list of todos.
 */
const MOCK_TODOS_RESPONSE: KitsuResponse<Todo[], MetaWithTotal> = {
  data: [
    { id: "1", type: "todo", name: "todo 1" },
    { id: "2", type: "todo", name: "todo 2" },
    { id: "3", type: "todo", name: "todo 3" }
  ],
  meta: {
    totalResourceCount: 300
  }
};

/**
 * Mock response for a second page of todos data.
 */
const MOCK_TODOS_RESPONSE_PAGE_2: KitsuResponse<Todo[], MetaWithTotal> = {
  data: [
    { id: "4", type: "todo", name: "todo 1" },
    { id: "5", type: "todo", name: "todo 2" },
    { id: "6", type: "todo", name: "todo 3" }
  ],
  meta: {
    totalResourceCount: 300
  }
};

const MOCK_500_ERROR: DocWithErrors = {
  errors: [
    {
      detail:
        "Unable to locate Attribute [unknownAttribute] on this ManagedType [ca.gc.aafc.seqdb.entities.Todo]",
      status: "500",
      title: "INTERNAL_SERVER_ERROR"
    }
  ]
};

const mockGet = jest.fn<any, any>();

const mockBulkGet = jest.fn();

/** Query component props. */
interface QueryProps<TData extends KitsuResponseData, TMeta> {
  onSuccess?: (response: KitsuResponse<TData, TMeta>) => void;
  query: JsonApiQuerySpec;
  options?: QueryOptions<TData, TMeta>;
  children: (state: QueryState<TData, TMeta>) => React.ReactElement | null;
}

/** Exposes the useQuery return value as "render props" to the children. */
function Query<TData extends KitsuResponseData, TMeta = undefined>({
  children,
  options,
  onSuccess = options?.onSuccess,
  query
}: QueryProps<TData, TMeta>) {
  const queryState = useQuery<TData, TMeta>(query, { ...options, onSuccess });
  return children(queryState);
}

/**
 * Helper method to create a paged query element without the required context.
 */
function pagedQuery(pageSpec, childFunction?) {
  return (
    <Query<Todo[]> query={{ path: "todo", page: pageSpec }}>
      {childFunction || (() => null)}
    </Query>
  );
}

const testCtx = {
  apiContext: { apiClient: { get: mockGet }, bulkGet: mockBulkGet }
};

describe("useQuery hook", () => {
  const mockOnSuccess = jest.fn();
  let queryState;

  function TestComponent({
    deps = [] as any[],
    joinSpecs = [] as ClientSideJoinSpec[],
    disabled = false
  }) {
    queryState = useQuery(
      { path: "todo/1" },
      { deps, onSuccess: mockOnSuccess, joinSpecs, disabled }
    );

    return null;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation(async (path, { fields, page }) => {
      if (path === "todo") {
        if (fields && fields.todo === "unknownAttribute") {
          throw MOCK_500_ERROR;
        }
        if (page && page.offset === 3) {
          return MOCK_TODOS_RESPONSE_PAGE_2;
        }
        return MOCK_TODOS_RESPONSE;
      } else if (path === "todo/25") {
        return MOCK_TODO_RESPONSE;
      }
    });
  });

  it("Provides an onSuccess callback arg", async () => {
    mockGet.mockImplementationOnce(async () => MOCK_TODO_RESPONSE);
    mountWithAppContext(<TestComponent />, testCtx);

    await new Promise(setImmediate);

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).lastCalledWith(MOCK_TODO_RESPONSE);
  });

  it("Re-fetches the data if the 'deps' prop changes.", async () => {
    mockGet.mockImplementation(async () => MOCK_TODO_RESPONSE);

    // Render with an initial 'deps' prop.
    const wrapper = mountWithAppContext(<TestComponent deps={[1]} />, testCtx);
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
    const wrapper = mountWithAppContext(<TestComponent deps={[1]} />, testCtx);
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
    mountWithAppContext(
      <TestComponent
        joinSpecs={[
          {
            apiBaseUrl: "/people-api",
            idField: "creatorId",
            joinField: "creator",
            path: todo => `person/${todo.creatorId}`
          }
        ]}
      />,
      testCtx
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

  it("Lets you disable the query.", async () => {
    // Render with an initial 'deps' prop.
    mountWithAppContext(<TestComponent disabled={true} />, testCtx);
    await new Promise(setImmediate);

    expect(mockGet).toHaveBeenCalledTimes(0);
  });

  it("Renders with loading as true before sending a request", done => {
    let renderCount = 0;
    mountWithAppContext(
      <Query<Todo[]> query={{ path: "todo" }}>
        {({ loading }) => {
          // Query should be rendered once with loading as true.
          if (renderCount === 0) {
            expect(loading).toEqual(true);
            done();
          }
          renderCount++;
          return <div />;
        }}
      </Query>,
      testCtx
    );
  });

  it("Passes single-resource data from the mocked API to child components", done => {
    mountWithAppContext(
      <Query<Todo> query={{ path: "todo/25" }}>
        {({ loading, response }) => {
          if (response) {
            expect(loading).toEqual(false);
            expect(response).toEqual(MOCK_TODO_RESPONSE);
            // Make sure the response data field has the Todo type.
            expect(response.data.name).toBeDefined();
            done();
          }
          return <div />;
        }}
      </Query>,
      testCtx
    );
  });

  it("Passes list data from the mocked API to child components", done => {
    mountWithAppContext(
      <Query<Todo[], MetaWithTotal> query={{ path: "todo" }}>
        {({ loading, response }) => {
          if (response) {
            expect(loading).toEqual(false);
            expect(response).toEqual(MOCK_TODOS_RESPONSE);
            // Make sure the response data field has the Todo array type.
            expect(response.data[0].name).toBeDefined();
            // Make sure the response meta field has the MetaWithTotal type.
            expect(response.meta.totalResourceCount).toBeDefined();
            done();
          }
          return <div />;
        }}
      </Query>,
      testCtx
    );

    expect(mockGet).toHaveBeenCalledTimes(1);

    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = last(mockGet.mock.calls) || [
      undefined,
      undefined
    ];
    expect(path).toEqual("todo");

    // The Query's GET params should not have any values explicitly set to undefined.
    // This would create an invalid request URL, e.g. /api/todo?fields=undefined
    expect(Object.values(getParams).includes(undefined)).toBeFalsy();
  });

  it("Supports JSONAPI GET params", () => {
    mountWithAppContext(
      <Query<Todo[]>
        query={{
          fields: { todo: "name,description" },
          filter: { name: "todo 2" },
          include: "group",
          page: { offset: 200, limit: 100 },
          path: "todo",
          sort: "name"
        }}
      >
        {() => <div />}
      </Query>,
      testCtx
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = last(mockGet.mock.calls) || [
      undefined,
      undefined
    ];
    expect(path).toEqual("todo");
    expect(getParams).toEqual({
      fields: { todo: "name,description" },
      filter: { name: "todo 2" },
      include: "group",
      page: { offset: 200, limit: 100 },
      sort: "name"
    });
  });

  it("Renders an error to child components", done => {
    // Get an error by requesting an attribute that the resource doesn't have.
    mountWithAppContext(
      <Query<Todo[]>
        query={{ path: "todo", fields: { todo: "unknownAttribute" } }}
      >
        {({ loading, error, response }) => {
          if (!loading) {
            expect(error).toEqual(MOCK_500_ERROR);
            expect(response).toBeUndefined();
            done();
          }
          return <div />;
        }}
      </Query>,
      testCtx
    );
  });

  it("Re-fetches data if the query is changed via new props.", async () => {
    const mockChild = jest.fn(() => null);

    // The first render will fetch the data once.
    const wrapper = mountWithAppContext(
      pagedQuery({ offset: 0, limit: 3 }, mockChild),
      testCtx
    );
    expect(mockGet).toHaveBeenCalledTimes(1);

    // The response is undefined before sending the first request.
    expect(mockChild).not.lastCalledWith(
      expect.objectContaining({ response: expect.anything() })
    );

    // Continue the test after the first request finishes.
    await new Promise(setImmediate);

    expect(mockChild).lastCalledWith(
      expect.objectContaining({ response: MOCK_TODOS_RESPONSE })
    );

    // The second render with different props will fetch the data again.
    wrapper.setProps({
      children: pagedQuery({ offset: 3, limit: 3 }, mockChild)
    });

    // Wait for the second request to start:
    await Promise.resolve();

    expect(mockGet).toHaveBeenCalledTimes(2);

    // The loading state is returned when waiting for the second fetch.
    expect(mockChild).lastCalledWith({
      isDisabled: false,
      loading: true
    });

    // Continue the test after the second request finishes.
    await new Promise(setImmediate);
    expect(mockChild).lastCalledWith(
      expect.objectContaining({ response: MOCK_TODOS_RESPONSE_PAGE_2 })
    );
  });

  it("Renders with loading as the correct value when fetching and re-fetching data.", async () => {
    // Mock Query Component's child function to check what render props are passed down.
    const mockChild = jest.fn(() => null);

    // Initial render.
    const wrapper = mountWithAppContext(
      pagedQuery({ offset: 0, limit: 3 }, mockChild),
      testCtx
    );

    // Renders with loading as true when initially fetching data.
    expect(mockChild).lastCalledWith(
      expect.objectContaining({ loading: true })
    );

    // Continue the test after the first query finishes.
    await new Promise(setImmediate);

    // The component renders a third time when the first query finishes.
    expect(mockChild).toHaveBeenCalledTimes(2);
    expect(mockChild).lastCalledWith(
      expect.objectContaining({ loading: false })
    );

    // Render the component again with new props.
    wrapper.setProps({
      children: pagedQuery({ offset: 3, limit: 3 }, mockChild)
    });

    // Query component renders with loading as true when re-fetching data.
    expect(mockChild).lastCalledWith(
      expect.objectContaining({ loading: true })
    );

    // Continue the test after the second query finishes.
    await new Promise(setImmediate);

    // Renders with loading as false after the second query finishes.
    expect(mockChild).lastCalledWith(
      expect.objectContaining({ loading: false })
    );
  });

  it("Does not re-fetch data if the same props are passed in multiple times.", () => {
    const pageSpec = { offset: 0, limit: 3 };

    // The first render will fetch the data once.
    const wrapper = mountWithAppContext(pagedQuery(pageSpec), testCtx);
    expect(mockGet).toHaveBeenCalledTimes(1);

    // The second render with the same props will not fetch again.
    wrapper.setProps({
      children: pagedQuery(pageSpec)
    });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
