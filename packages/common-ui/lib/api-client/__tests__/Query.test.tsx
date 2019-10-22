import { mount } from "enzyme";
import { KitsuResource, KitsuResponse } from "kitsu";
import { last } from "lodash";
import { ApiClientContext, createContextValue } from "../ApiClientContext";
import { JsonApiErrorResponse } from "../jsonapi-types";
import { Query } from "../Query";

/** Example of an API resource interface definition for a todo-list entry. */
interface Todo extends KitsuResource {
  type: "todo";
  name: string;
}

/** Example interface of a "meta" response field. */
interface MetaWithTotal {
  totalResourceCount: number;
}

/**
 * Mock response for a single Todo.
 */
const MOCK_TODO_RESPONSE: KitsuResponse<Todo> = {
  data: { id: "25", type: "todo", name: "todo 25" },
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

const MOCK_500_ERROR: JsonApiErrorResponse = {
  errors: [
    {
      detail:
        "Unable to locate Attribute [unknownAttribute] on this ManagedType [ca.gc.aafc.seqdb.entities.Todo]",
      status: "500",
      title: "INTERNAL_SERVER_ERROR"
    }
  ],
  status: 500
};

// Mock Kitsu class' "get" method.
const mockGet = jest.fn((path, { fields, page }) => {
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

const contextValue = createContextValue();

/**
 * Helper method to create a paged query element with the required context.
 */
function pagedQueryWithContext(pageSpec, childFunction?) {
  return (
    <ApiClientContext.Provider value={contextValue}>
      {pagedQuery(pageSpec, childFunction)}
    </ApiClientContext.Provider>
  );
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

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

describe("Query component", () => {
  const { objectContaining, anything } = expect;

  beforeEach(() => {
    // Clear the spy's call and instance data.
    mockGet.mockClear();
  });

  it("Renders with loading as true before sending a request", done => {
    let renderCount = 0;
    mount(
      <ApiClientContext.Provider value={contextValue}>
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
        </Query>
      </ApiClientContext.Provider>
    );
  });

  it("Passes single-resource data from the mocked API to child components", done => {
    mount(
      <ApiClientContext.Provider value={contextValue}>
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
        </Query>
      </ApiClientContext.Provider>
    );
  });

  it("Passes list data from the mocked API to child components", done => {
    mount(
      <ApiClientContext.Provider value={contextValue}>
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
        </Query>
      </ApiClientContext.Provider>
    );

    expect(mockGet).toHaveBeenCalledTimes(1);

    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = last(mockGet.mock.calls);
    expect(path).toEqual("todo");

    // The Query's GET params should not have any values explicitly set to undefined.
    // This would create an invalid request URL, e.g. /api/todo?fields=undefined
    expect(Object.values(getParams).includes(undefined)).toBeFalsy();
  });

  it("Supports JSONAPI GET params", () => {
    mount(
      <ApiClientContext.Provider value={contextValue}>
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
        </Query>
      </ApiClientContext.Provider>
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = last(mockGet.mock.calls);
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
    mount(
      <ApiClientContext.Provider value={contextValue}>
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
        </Query>
      </ApiClientContext.Provider>
    );
  });

  it("Re-fetches data if the query is changed via new props.", async () => {
    const mockChild = jest.fn(() => null);

    // The first render will fetch the data once.
    const wrapper = mount(
      pagedQueryWithContext({ offset: 0, limit: 3 }, mockChild)
    );
    expect(mockGet).toHaveBeenCalledTimes(1);

    // The response is undefined before sending the first request.
    expect(mockChild).not.lastCalledWith(
      objectContaining({ response: anything() })
    );

    // Continue the test after the first request finishes.
    await Promise.resolve();

    expect(mockChild).lastCalledWith(
      objectContaining({ response: MOCK_TODOS_RESPONSE })
    );

    // The second render with different props will fetch the data again.
    wrapper.setProps({
      children: pagedQuery({ offset: 3, limit: 3 }, mockChild)
    });

    expect(mockGet).toHaveBeenCalledTimes(2);

    // The first response is still rendered when waiting for the second fetch.
    expect(mockChild).lastCalledWith(
      objectContaining({ response: MOCK_TODOS_RESPONSE })
    );

    // Continue the test after the second request finishes.
    await Promise.resolve();
    expect(mockChild).lastCalledWith(
      objectContaining({ response: MOCK_TODOS_RESPONSE_PAGE_2 })
    );
  });

  it("Renders with loading as the correct value when fetching and re-fetching data.", async () => {
    // Mock Query Component's child function to check what render props are passed down.
    const mockChild = jest.fn(() => null);

    // Initial render.
    const wrapper = mount(
      pagedQueryWithContext({ offset: 0, limit: 3 }, mockChild)
    );

    // The react async hook renders the component twice when initializing.
    // Renders with loading as true when initially fetching data.
    expect(mockChild).toHaveBeenCalledTimes(2);
    expect(mockChild).lastCalledWith(objectContaining({ loading: true }));

    // Continue the test after the first query finishes.
    await Promise.resolve();

    // The component renders a third time when the first query finishes.
    expect(mockChild).toHaveBeenCalledTimes(3);
    expect(mockChild).lastCalledWith(objectContaining({ loading: false }));

    // Render the component again with new props.
    wrapper.setProps({
      children: pagedQuery({ offset: 3, limit: 3 }, mockChild)
    });

    // Updating causes two more renders: one to pass in the new props, and one when Query sets
    // loading to true.
    expect(mockChild).toHaveBeenCalledTimes(5);

    // Query component renders with loading as true when re-fetching data.
    expect(mockChild).lastCalledWith(objectContaining({ loading: true }));

    // Continue the test after the second query finishes.
    await Promise.resolve();

    expect(mockChild).toHaveBeenCalledTimes(6);

    // Renders with loading as false after the second query finishes.
    expect(mockChild).lastCalledWith(objectContaining({ loading: false }));
  });

  it("Does not re-fetch data if the same props are passed in multiple times.", () => {
    const pageSpec = { offset: 0, limit: 3 };

    // The first render will fetch the data once.
    const wrapper = mount(pagedQueryWithContext(pageSpec));
    expect(mockGet).toHaveBeenCalledTimes(1);

    // The second render with the same props will not fetch again.
    wrapper.setProps({
      children: pagedQuery(pageSpec)
    });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
