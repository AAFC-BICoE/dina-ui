import { Person } from "packages/dina-ui/types/agent-api";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useAutocompleteSearchButFallbackToRsqlApiSearch } from "../useAutocompleteSearchButFallbackToRsqlApiSearch";

// Mock out the debounce function to avoid waiting during tests.
jest.mock("use-debounce", () => ({
  useDebounce: (fn) => [fn, { isPending: () => false }]
}));

const ONE_PERSON_RESPONSE = {
  data: {
    hits: [
      {
        source: {
          data: {
            id: "100",
            type: "person",
            attributes: {
              displayName: "Person from Search API"
            }
          }
        }
      }
    ]
  }
};

const mockSearchApiGet = jest.fn<any, any>(async () => ONE_PERSON_RESPONSE);
const mockSearchApiGetWithError = jest.fn<any, any>(async () => {
  throw new Error("Mock Search Error.");
});

const mockAgentApiGet = jest.fn<any, any>((path) => {
  switch (path) {
    case "agent-api/person":
      return {
        data: [
          { id: "200", type: "person", displayName: "Person from Agent API" }
        ]
      };
  }
});

interface TestPersonSearchComponentProps {
  searchQuery: string;
}

function TestPersonSearchComponent({
  searchQuery = ""
}: TestPersonSearchComponentProps) {
  const { loading, response } =
    useAutocompleteSearchButFallbackToRsqlApiSearch<Person>({
      indexName: "dina_agent_index",
      searchField: "data.attributes.displayName",
      querySpec: {
        path: "agent-api/person",
        sort: "-createdOn"
      },
      searchQuery,
      restrictedField: "testRestrictedField",
      restrictedFieldValue: "testRestrictedValue"
    });

  return (
    <div>
      Loading: {String(loading)}
      <ul className="person-list">
        {response.data.map((it) => (
          <li key={it.id}>{it.displayName}</li>
        ))}
      </ul>
    </div>
  );
}

describe("useAutocompleteSearchButFallbackToRsqlApiSearch hook", () => {
  beforeEach(jest.clearAllMocks);

  it("Able to perform searches with elastic search, RSQL should be called for an empty response.", async () => {
    const wrapper = mountWithAppContext(
      <TestPersonSearchComponent searchQuery={""} />,
      {
        apiContext: {
          apiClient: {
            axios: { get: mockSearchApiGet } as any,
            get: mockAgentApiGet
          }
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockAgentApiGet).toHaveBeenCalledTimes(1);

    expect(wrapper.find(".person-list li").length).toEqual(1);
    expect(wrapper.find(".person-list li").first().text()).toEqual(
      "Person from Agent API"
    );

    // Try again with a full query
    const wrapper2 = mountWithAppContext(
      <TestPersonSearchComponent searchQuery={"test-query"} />,
      {
        apiContext: {
          apiClient: {
            axios: { get: mockSearchApiGet } as any,
            get: mockAgentApiGet
          }
        }
      }
    );

    await new Promise(setImmediate);
    wrapper2.update();

    expect(mockSearchApiGet).toHaveBeenCalledTimes(1);
    expect(mockSearchApiGet).lastCalledWith(
      "search-api/search-ws/auto-complete",
      {
        params: {
          additionalField: undefined,
          group: undefined,
          autoCompleteField: "data.attributes.displayName",
          indexName: "dina_agent_index",
          prefix: "test-query",
          restrictedField: "testRestrictedField",
          restrictedFieldValue: "testRestrictedValue"
        }
      }
    );
    expect(wrapper2.find(".person-list li").length).toEqual(1);
    expect(wrapper2.find(".person-list li").first().text()).toEqual(
      "Person from Search API"
    );
  });

  it("Falls back to the RSQL filter API when the search API throws an error.", async () => {
    const wrapper = mountWithAppContext(
      <TestPersonSearchComponent searchQuery={"test-query"} />,
      {
        apiContext: {
          apiClient: {
            axios: { get: mockSearchApiGetWithError } as any,
            get: mockAgentApiGet
          }
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSearchApiGetWithError).toHaveBeenCalledTimes(1);
    expect(mockAgentApiGet).toHaveBeenCalledTimes(1);
    expect(mockAgentApiGet).lastCalledWith("agent-api/person", {
      sort: "-createdOn"
    });

    expect(wrapper.find(".person-list li").length).toEqual(1);
    expect(wrapper.find(".person-list li").first().text()).toEqual(
      "Person from Agent API"
    );
  });
});
