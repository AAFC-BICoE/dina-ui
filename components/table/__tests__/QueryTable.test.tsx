import { mount } from "enzyme";
import Kitsu, { KitsuResource, KitsuResponse } from "kitsu";
import { range } from "lodash";
import ReactTable from "react-table";
import { ApiClientContext } from "../../api-client/ApiClientContext";
import { QueryTable } from "../QueryTable";

/** Example of an API resource interface definition for a todo-list entry. */
interface Todo extends KitsuResource {
  type: "todo";
  name: string;
  description: string;
}

/** Example interface of a "meta" response field. */
interface MetaWithTotal {
  totalResourceCount: number;
}

/**
 * Mock response for a page of 25 todos.
 */
const MOCK_TODOS_RESPONSE: KitsuResponse<Todo[], MetaWithTotal> = {
  data: range(25).map<Todo>(i => ({
    id: `${i}`,
    type: "todo",
    name: `todo ${i}`,
    description: `todo description ${i}`
  })),
  meta: {
    totalResourceCount: 300
  }
};

const mockGet = jest.fn(async () => {
  return MOCK_TODOS_RESPONSE;
});

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      get = mockGet;
    }
);

describe("QueryTable component", () => {
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

  it("Renders loading state initially.", () => {
    const wrapper = mountWithContext(
      <QueryTable
        initialQuery={{ path: "todo" }}
        columns={["id", "name", "description"]}
      />
    );

    expect(
      wrapper.find(ReactTable).contains(
        <div className="-loading -active">
          <div className="-loading-inner">Loading...</div>
        </div>
      )
    ).toEqual(true);
  });

  it("Renders the data from the mocked backend.", done => {
    const wrapper = mountWithContext(
      <QueryTable
        initialQuery={{ path: "todo" }}
        columns={["id", "name", "description"]}
      />
    );

    // Continue the test after the data fetch is done.
    setImmediate(() => {
      wrapper.update();

      // The loading screen should be gone.
      expect(wrapper.find(".-loading.-active").exists()).toEqual(false);

      const rows = wrapper.find(".rt-tr-group");

      // Expect 25 rows for the 25 mock todos.
      expect(rows.length).toEqual(25);

      // Expect the first row to show the first todo's data.
      expect(
        rows
          .first()
          .find(".rt-td")
          .map(cell => cell.text())
      ).toEqual(["0", "todo 0", "todo description 0"]);

      // Expect the last row to show the last todo's data.
      expect(
        rows
          .last()
          .find(".rt-td")
          .map(cell => cell.text())
      ).toEqual(["24", "todo 24", "todo description 24"]);

      done();
    });
  });

  it("Renders the headers defined in the columns prop.", () => {
    const headers = ["id", "name", "description"];

    const wrapper = mountWithContext(
      <QueryTable initialQuery={{ path: "todo" }} columns={headers} />
    );

    for (const header of headers) {
      expect(
        wrapper.contains(
          <div className="rt-resizable-header-content">{header}</div>
        )
      ).toEqual(true);
    }
  });
});
