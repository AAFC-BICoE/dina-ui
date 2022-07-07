import { useState } from "react";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Person } from "../../../types/objectstore-api";
import { useAutocompleteSearchButFallbackToRsqlApiSearch } from "../useAutocompleteSearchButFallbackToRsqlApiSearch";

// Mock out the debounce function to avoid waiting during tests.
jest.mock("use-debounce", () => ({
  useDebounce: fn => [fn, { isPending: () => false }]
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

const EMPTY_SEARCH_RESPONSE = {
  data: {
    hits: []
  }
};

const mockSearchApiGet = jest.fn<any, any>(async () => ONE_PERSON_RESPONSE);
const mockSearchApiGetWithEmptyResponse = jest.fn<any, any>(
  async () => EMPTY_SEARCH_RESPONSE
);
const mockSearchApiGetWithError = jest.fn<any, any>(async () => {
  throw new Error("Mock Search Error.");
});

const mockAgentApiGet = jest.fn<any, any>(path => {
  switch (path) {
    case "agent-api/person":
      return {
        data: [
          { id: "200", type: "person", displayName: "Person from Agent API" }
        ]
      };
  }
});

function TestPersonSearchComponent() {
  const [searchQuery] = useState("test-query");

  const { loading, response } =
    useAutocompleteSearchButFallbackToRsqlApiSearch<Person>({
      indexName: "dina_agent_index",
      searchField: "displayName",
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
        {response.data.map(it => (
          <li key={it.id}>{it.displayName}</li>
        ))}
      </ul>
    </div>
  );
}

describe("useAutocompleteSearchButFallbackToRsqlApiSearch hook", () => {
  beforeEach(jest.clearAllMocks);

  it("Searches the dina-search-api.", async () => {
    const wrapper = mountWithAppContext(<TestPersonSearchComponent />, {
      apiContext: {
        apiClient: {
          axios: { get: mockSearchApiGet } as any,
          get: mockAgentApiGet
        }
      }
    });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSearchApiGet).toHaveBeenCalledTimes(1);
    expect(mockSearchApiGet).lastCalledWith(
      "search-api/search-ws/auto-complete",
      {
        params: {
          additionalField: "",
          autoCompleteField: "data.attributes.displayName",
          indexName: "dina_agent_index",
          prefix: "test-query",
          restrictedField: "data.attributes.testRestrictedField",
          restrictedFieldValue: "testRestrictedValue"
        }
      }
    );
    expect(mockAgentApiGet).toHaveBeenCalledTimes(1);

    expect(wrapper.find(".person-list li").length).toEqual(1);
    expect(wrapper.find(".person-list li").first().text()).toEqual(
      "Person from Search API"
    );
  });

  it("Falls back to the RSQL filter API with disabled query when the search API returns empty hits.", async () => {
    const wrapper = mountWithAppContext(<TestPersonSearchComponent />, {
      apiContext: {
        apiClient: {
          axios: { get: mockSearchApiGetWithEmptyResponse } as any,
          get: mockAgentApiGet
        }
      }
    });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSearchApiGetWithEmptyResponse).toHaveBeenCalledTimes(1);
    expect(mockSearchApiGetWithEmptyResponse).lastCalledWith(
      "search-api/search-ws/auto-complete",
      {
        params: {
          additionalField: "",
          autoCompleteField: "data.attributes.displayName",
          indexName: "dina_agent_index",
          prefix: "test-query",
          restrictedField: "data.attributes.testRestrictedField",
          restrictedFieldValue: "testRestrictedValue"
        }
      }
    );
    expect(mockAgentApiGet).toHaveBeenCalledTimes(1);
    expect(mockAgentApiGet).lastCalledWith("agent-api/person", {
      sort: "-createdOn"
    });

    // The rsql api is called as a disabled query so no field is populated with data
    expect(wrapper.find(".person-list li").length).toEqual(0);
  });

  it("Falls back to the RSQL filter API when the search API throws an error.", async () => {
    const wrapper = mountWithAppContext(<TestPersonSearchComponent />, {
      apiContext: {
        apiClient: {
          axios: { get: mockSearchApiGetWithError } as any,
          get: mockAgentApiGet
        }
      }
    });

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
