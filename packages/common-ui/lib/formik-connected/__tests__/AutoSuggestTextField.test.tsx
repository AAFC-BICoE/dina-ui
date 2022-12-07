import { KitsuResource } from "kitsu";
import AutoSuggest from "react-autosuggest";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { AutoSuggestTextField } from "../AutoSuggestTextField";
import { DinaForm } from "../DinaForm";

interface Person extends KitsuResource {
  name: string;
}

const PERSON_TEST_DATA_JSON_API = {
  data: [
    { name: "person1-json-api" },
    { name: "person2-json-api" },
    { name: "person3-json-api" }
  ]
};

const PERSON_TEST_DATA_ELASTICSEARCH = {
  data: {
    hits: [
      {
        source: {
          data: {
            id: "b7b24707-ad21-4957-a7ad-de423ba67094",
            type: "person",
            attributes: {
              name: "person1-elastic-search"
            }
          }
        }
      },
      {
        source: {
          data: {
            id: "a5f67abb-d9a5-4c21-8a5a-5339b71f8fd5",
            type: "person",
            attributes: {
              name: "person2-elastic-search"
            }
          }
        }
      },
      {
        source: {
          data: {
            id: "a4728a07-ad44-4086-a990-0d4ab7cf2105",
            type: "person",
            attributes: {
              name: "person3-elastic-search"
            }
          }
        }
      }
    ]
  }
};

// JSON API mock response.
const mockGet = jest.fn(async () => PERSON_TEST_DATA_JSON_API);

const mockGetFailure = jest.fn(async () => {
  throw new Error("Something went wrong!");
});

// Elastic Search mock response.
const mockGetAxios = jest.fn(async () => PERSON_TEST_DATA_ELASTICSEARCH);

// JSON API and Elastic Search mock responses.
const mockGetAll = jest.fn(async (path) => {
  if (path === "agent-api/person") {
    return PERSON_TEST_DATA_JSON_API;
  } else if (path === "search-api/search-ws/auto-complete") {
    return PERSON_TEST_DATA_ELASTICSEARCH;
  }
});

// JSON API only.
const apiContextJsonAPIOnly = {
  apiClient: {
    get: mockGet
  }
} as any;

// Elastic search only.
const apiContextElasticSearchOnly = {
  apiClient: {
    axios: {
      get: mockGetAxios
    }
  }
} as any;

// Both elastic search and JSON are working.
const apiContextBothProviders = {
  apiClient: {
    get: mockGetAll,
    axios: {
      get: mockGetAll
    }
  }
} as any;

// Elastic search works, but JSON API failure.
const apiContextJsonAPIFailure = {
  apiClient: {
    get: mockGetFailure,
    axios: {
      get: mockGetAxios
    }
  }
} as any;

// Json API works, but elastic search is not working.
const apiContextElasticSearchFailure = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGetFailure
    }
  }
} as any;

const suggestionSelectedMock = jest.fn();

describe("AutoSuggestTextField", () => {
  // Clear the mocks between tests.
  beforeEach(jest.clearAllMocks);

  it("Snapshot test", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          jsonApiBackend={{
            query: (searchValue) => ({
              path: "agent-api/person",
              filter: {
                rsql: `name==*${searchValue}*`
              }
            }),
            option: (person) => person?.name
          }}
          onSuggestionSelected={suggestionSelectedMock}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext: apiContextJsonAPIOnly }
    );

    // Snapshot test will check to ensure the layout does not change for unknown reasons.
    expect(wrapper.find(AutoSuggestTextField).debug()).toMatchSnapshot();

    // Simulate clicking an option, first need to provide a search.
    wrapper.find("input").simulate("focus");
    wrapper.find("input").simulate("change", { target: { value: "p" } });

    await new Promise(setImmediate);
    wrapper.update();

    // Select the first option in the list.
    wrapper.find(AutoSuggestTextField).find("Item").at(0).simulate("click");
    wrapper.update();

    expect(suggestionSelectedMock).toBeCalledTimes(1);
    expect(suggestionSelectedMock.mock.calls[0][0]).toEqual("person1-json-api");
  });

  it("JSON API only provided, results are fetched from JSON API", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          jsonApiBackend={{
            query: (searchValue) => ({
              path: "agent-api/person",
              filter: {
                rsql: `name==*${searchValue}*`
              }
            }),
            option: (person) => person?.name
          }}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext: apiContextJsonAPIOnly }
    );

    wrapper.find("input").simulate("focus");
    wrapper.find("input").simulate("change", { target: { value: "p" } });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet).lastCalledWith("agent-api/person", {
      filter: { rsql: "name==*p*" },
      sort: "-createdOn"
    });

    expect(mockGet).toHaveBeenCalledTimes(1);

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "person1-json-api",
      "person2-json-api",
      "person3-json-api"
    ]);

    // Test to ensure number of API calls does is not excessive.
    wrapper.find("input").simulate("change", { target: { value: "pe" } });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet).toHaveBeenCalledTimes(2);

    // Try an empty search, since blankSearchProvider is not supplied it should not do any requests.
    wrapper.find("input").simulate("change", { target: { value: "" } });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("Elastic Search only provided, results are fetched from elastic search.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          elasticSearchBackend={{
            indexName: "dina_agent_index",
            searchField: "data.attributes.name",
            option: (person) => person?.name
          }}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext: apiContextElasticSearchOnly }
    );

    wrapper.find("input").simulate("focus");
    wrapper.find("input").simulate("change", { target: { value: "p" } });

    await new Promise(setImmediate);
    wrapper.update();

    // Expected suggestions to appear.
    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "person1-elastic-search",
      "person2-elastic-search",
      "person3-elastic-search"
    ]);

    // Take a snapshot of the suggestion popup being displayed in the UI.
    expect(
      wrapper.find(AutoSuggestTextField).find(".list-group").debug()
    ).toMatchSnapshot();

    // Remove focus from input, the suggestions should no longer be displayed.
    wrapper.find("input").simulate("blur");
    wrapper.update();
    expect(
      wrapper.find(AutoSuggestTextField).find(".list-group").exists()
    ).toBe(false);

    expect(mockGetAxios).lastCalledWith("search-api/search-ws/auto-complete", {
      params: {
        indexName: "dina_agent_index",
        autoCompleteField: "data.attributes.name",
        prefix: "p",
        additionalField: undefined,
        group: undefined
      }
    });

    expect(mockGetAxios).toHaveBeenCalledTimes(1);

    // Test to ensure number of API calls does is not excessive.
    wrapper.find("input").simulate("focus");
    wrapper.find("input").simulate("change", { target: { value: "pe" } });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGetAxios).toHaveBeenCalledTimes(2);

    // Try an empty search, since blankSearchProvider is not supplied it should not do any requests.
    wrapper.find("input").simulate("change", { target: { value: "" } });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGetAxios).toHaveBeenCalledTimes(2);
  });

  it("Custom options only provided, results come from custom options.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          customOptions={(value) => [
            "suggestion-1",
            "suggestion-2",
            "suggestion-" + value
          ]}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext: apiContextBothProviders }
    );

    wrapper.find("input").simulate("focus");
    wrapper.find("input").simulate("change", { target: { value: "3" } });

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "suggestion-1",
      "suggestion-2",
      "suggestion-3"
    ]);

    expect(mockGetAll).toHaveBeenCalledTimes(0);
  });

  it("Both backend providers are used, preferred backend is used.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          elasticSearchBackend={{
            indexName: "dina_agent_index",
            searchField: "data.attributes.name",
            option: (person) => person?.name
          }}
          jsonApiBackend={{
            query: (searchValue) => ({
              path: "agent-api/person",
              filter: {
                rsql: `name==*${searchValue}*`
              }
            }),
            option: (person) => person?.name
          }}
          preferredBackend={"json-api"}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext: apiContextBothProviders }
    );

    wrapper.find("input").simulate("focus");
    wrapper.find("input").simulate("change", { target: { value: "p" } });

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockGetAll).lastCalledWith("agent-api/person", {
      filter: { rsql: "name==*p*" },
      sort: "-createdOn"
    });

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "person1-json-api",
      "person2-json-api",
      "person3-json-api"
    ]);

    // Should not have any calls to elastic search.
    expect(mockGetAll.mock.calls).toEqual([
      [
        "agent-api/person",
        {
          filter: { rsql: "name==*p*" },
          sort: "-createdOn"
        }
      ]
    ]);
  });

  describe("Both backend providers are supplied, test what happens when a backend fails", () => {
    it("JSON-API is preferred, but fails, elastic search should be used instead.", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <AutoSuggestTextField<Person>
            name="examplePersonNameField"
            elasticSearchBackend={{
              indexName: "dina_agent_index",
              searchField: "data.attributes.name",
              option: (person) => person?.name
            }}
            jsonApiBackend={{
              query: (searchValue) => ({
                path: "agent-api/person",
                filter: {
                  rsql: `name==*${searchValue}*`
                }
              }),
              option: (person) => person?.name
            }}
            preferredBackend={"json-api"}
            timeoutMs={0}
          />
        </DinaForm>,
        { apiContext: apiContextJsonAPIFailure }
      );

      wrapper.find("input").simulate("focus");
      wrapper.find("input").simulate("change", { target: { value: "p" } });

      await new Promise(setImmediate);
      wrapper.update();

      // JSON API should be tried first but fails.
      expect(mockGetFailure).toHaveBeenCalledTimes(1);
      expect(mockGetAxios).toHaveBeenCalledTimes(1);

      expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
        "person1-elastic-search",
        "person2-elastic-search",
        "person3-elastic-search"
      ]);

      wrapper.find("input").simulate("change", { target: { value: "pe" } });

      await new Promise(setImmediate);
      wrapper.update();

      // JSON API should not be called again at this point. Already failed and should have switched to
      // elastic search.
      expect(mockGetFailure).toHaveBeenCalledTimes(1);
      expect(mockGetAxios).toHaveBeenCalledTimes(2);
    });

    it("Elastic-search is preferred, but fails, JSON-API should be used instead.", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <AutoSuggestTextField<Person>
            name="examplePersonNameField"
            elasticSearchBackend={{
              indexName: "dina_agent_index",
              searchField: "data.attributes.name",
              option: (person) => person?.name
            }}
            jsonApiBackend={{
              query: (searchValue) => ({
                path: "agent-api/person",
                filter: {
                  rsql: `name==*${searchValue}*`
                }
              }),
              option: (person) => person?.name
            }}
            preferredBackend={"elastic-search"}
            timeoutMs={0}
          />
        </DinaForm>,
        { apiContext: apiContextElasticSearchFailure }
      );

      wrapper.find("input").simulate("focus");
      wrapper.find("input").simulate("change", { target: { value: "p" } });

      await new Promise(setImmediate);
      wrapper.update();
      await new Promise(setImmediate);
      wrapper.update();

      // Elastic Search should be tried first, but fails.
      expect(mockGetFailure).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledTimes(1);

      expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
        "person1-json-api",
        "person2-json-api",
        "person3-json-api"
      ]);

      wrapper.find("input").simulate("change", { target: { value: "pe" } });

      await new Promise(setImmediate);
      wrapper.update();

      // JSON API should not be called again at this point. Already failed and should have switched to
      // json api.
      expect(mockGetFailure).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  describe("Blank search provider tests", () => {
    it("Blank search provider not supplied, options do not appear when empty search.", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <AutoSuggestTextField<Person>
            name="examplePersonNameField"
            jsonApiBackend={{
              query: (searchValue) => ({
                path: "agent-api/person",
                filter: {
                  rsql: `name==*${searchValue}*`
                }
              }),
              option: (person) => person?.name
            }}
            timeoutMs={0}
          />
        </DinaForm>,
        { apiContext: apiContextJsonAPIOnly }
      );

      wrapper.find("input").simulate("focus");

      // Api should not be requested when search is empty since no blank search provider is supplied.
      expect(mockGet).toHaveBeenCalledTimes(0);
    });

    it("Blank search provider supplied, options should appear when empty search is focused.", async () => {
      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <AutoSuggestTextField<Person>
            name="examplePersonNameField"
            jsonApiBackend={{
              query: (searchValue) => ({
                path: "agent-api/person",
                filter: {
                  rsql: `name==*${searchValue}*`
                }
              }),
              option: (person) => person?.name
            }}
            blankSearchBackend={"json-api"}
            timeoutMs={0}
          />
        </DinaForm>,
        { apiContext: apiContextJsonAPIOnly }
      );

      wrapper.find("input").simulate("focus");

      await new Promise(setImmediate);
      wrapper.update();

      // Expected suggestions to appear.
      expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
        "person1-json-api",
        "person2-json-api",
        "person3-json-api"
      ]);

      // Take a snapshot of the suggestion popup being displayed in the UI.
      expect(
        wrapper.find(AutoSuggestTextField).find(".list-group").debug()
      ).toMatchSnapshot();
    });
  });
});
