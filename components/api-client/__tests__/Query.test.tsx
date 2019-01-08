import Kitsu, { KitsuResource, KitsuResponse } from "kitsu";
import { create } from "react-test-renderer";
import { ApiClientContext } from "../ApiClientContext";
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

const MOCK_500_ERROR: JsonApiErrorResponse = {
  errors: [
    {
      status: "500",
      title: "INTERNAL_SERVER_ERROR",
      detail:
        "Unable to locate Attribute [unknownAttribute] on this ManagedType [ca.gc.aafc.seqdb.entities.Todo]"
    }
  ]
};

// Mock Kitsu class' "get" method.
const mockGet = jest.fn((path, { fields }) => {
  if (path == "todo") {
    if (fields && fields.todo == "unknownAttribute") {
      throw MOCK_500_ERROR;
    }
    return MOCK_TODOS_RESPONSE;
  } else if (path == "todo/25") {
    return MOCK_TODO_RESPONSE;
  }
});

/** JSONAPI client. */
const testClient = new Kitsu({
  baseURL: "/api",
  pluralize: false,
  resourceCase: "none"
});

/**
 * Helper method to create a paged query element.
 * @param pageSpec the pagination params.
 */
const pagedQuery = pageSpec => (
  <ApiClientContext.Provider value={{ apiClient: testClient }}>
    <Query<Todo[]> query={{ path: "todo", page: pageSpec }}>{() => null}</Query>
  </ApiClientContext.Provider>
);

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      get = mockGet;
    }
);

describe("Query component", () => {
  beforeEach(() => {
    // Clear the spy's call and instance data.
    mockGet.mockClear();
  });

  it("Renders with loading as true before sending a request", done => {
    let renderCount = 0;
    create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Query<Todo[]> query={{ path: "todo" }}>
          {({ loading }) => {
            // Query should be rendered once with loading as true.
            if (renderCount == 0) {
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
    create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Query<Todo> query={{ path: "todo/25" }}>
          {({ loading, response }) => {
            if (response) {
              expect(loading).toEqual(false);
              expect(response).toEqual(MOCK_TODO_RESPONSE);
              // Make sure the response data field has the Todo type.
              response.data.name;
              done();
            }
            return <div />;
          }}
        </Query>
      </ApiClientContext.Provider>
    );
  });

  it("Passes list data from the mocked API to child components", done => {
    create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Query<Todo[], MetaWithTotal> query={{ path: "todo" }}>
          {({ loading, response }) => {
            if (response) {
              expect(loading).toEqual(false);
              expect(response).toEqual(MOCK_TODOS_RESPONSE);
              // Make sure the response data field has the Todo array type.
              response.data[0].name;
              // Make sure the response meta field has the MetaWithTotal type.
              response.meta.totalResourceCount;
              done();
            }
            return <div />;
          }}
        </Query>
      </ApiClientContext.Provider>
    );

    expect(mockGet).toHaveBeenCalledTimes(1);

    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = mockGet.mock.calls.pop();
    expect(path).toEqual("todo");

    // The Query's GET params should not have any values explicitly set to undefined.
    // This would create an invalid request URL, e.g. /api/todo?fields=undefined
    expect(Object.values(getParams).includes(undefined)).toBeFalsy();
  });

  it("Supports JSONAPI GET params", () => {
    create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
        <Query<Todo[]>
          query={{
            path: "todo",
            fields: { todo: "name,description" },
            filter: { name: "todo 2" },
            sort: "name",
            include: "group",
            page: { offset: 200, limit: 100 }
          }}
        >
          {() => <div />}
        </Query>
      </ApiClientContext.Provider>
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = mockGet.mock.calls.pop();
    expect(path).toEqual("todo");
    expect(getParams).toEqual({
      fields: { todo: "name,description" },
      filter: { name: "todo 2" },
      sort: "name",
      include: "group",
      page: { offset: 200, limit: 100 }
    });
  });

  it("Renders an error to child components", done => {
    // Get an error by requesting an attribute that the resource doesn't have.
    create(
      <ApiClientContext.Provider value={{ apiClient: testClient }}>
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

  it("Re-fetches data if the query is changed via new props.", () => {
    // The first render will fetch the data once.
    const render = create(pagedQuery({ offset: 0, limit: 100 }));
    expect(mockGet).toHaveBeenCalledTimes(1);

    // The second render with different props will fetch the data again.
    render.update(pagedQuery({ offset: 100, limit: 100 }));
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("Does not re-fetch data if the same props are passed in multiple times.", () => {
    const pageSpec = { offset: 0, limit: 100 };

    // The first render will fetch the data once.
    const render = create(pagedQuery(pageSpec));
    expect(mockGet).toHaveBeenCalledTimes(1);

    // The second render with the same props will not fetch again.
    render.update(pagedQuery(pageSpec));
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
