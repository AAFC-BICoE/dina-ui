import { JsonApiErrorResponse, KitsuResource, KitsuResponse } from "kitsu";
import { create } from "react-test-renderer";
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

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      async get(path, { fields }) {
        if (path == "todo") {
          if (fields && fields.todo == "unknownAttribute") {
            throw MOCK_500_ERROR;
          }
          return MOCK_TODOS_RESPONSE;
        } else if (path == "todo/25") {
          return MOCK_TODO_RESPONSE;
        }
      }
    }
);

// Spy on Kitsu class' "get" method.
const kitsuGet = jest.spyOn(require("kitsu").prototype, "get");

describe("Query component", () => {
  beforeEach(() => {
    // Clear the spy's call and instance data.
    kitsuGet.mockClear();
  });

  it("Renders with loading as true before sending a request", done => {
    let renderCount = 0;
    create(
      <Query<Todo[]> path="todo">
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
    );
  });

  it("Passes single-resource data from the mocked API to child components", done => {
    create(
      <Query<Todo> path="todo/25">
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
    );
  });

  it("Passes list data from the mocked API to child components", done => {
    create(
      <Query<Todo[], MetaWithTotal> path="todo">
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
    );

    expect(kitsuGet).toHaveBeenCalledTimes(1);

    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = kitsuGet.mock.calls.pop();
    expect(path).toEqual("todo");

    // The Query's GET params should not have any values explicitly set to undefined.
    // This would create an invalid request URL, e.g. /api/todo?fields=undefined
    expect(Object.values(getParams).includes(undefined)).toBeFalsy();
  });

  it("Supports JSONAPI GET params", () => {
    create(
      <Query<Todo[]>
        path="todo"
        fields={{ todo: "name,description" }}
        filter={{ name: "todo 2" }}
        sort="name"
        include="group"
        page={{ offset: 200, limit: 100 }}
      >
        {() => <div />}
      </Query>
    );

    expect(kitsuGet).toHaveBeenCalledTimes(1);
    // Get the params of the last call to Kitsu's GET method.
    const [path, getParams] = kitsuGet.mock.calls.pop();
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
      <Query<Todo[]> path="todo" fields={{ todo: "unknownAttribute" }}>
        {({ loading, error, response }) => {
          if (!loading) {
            expect(error).toEqual(MOCK_500_ERROR);
            expect(response).toBeUndefined();
            done();
          }
          return <div />;
        }}
      </Query>
    );
  });
});
