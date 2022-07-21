import { KitsuResource } from "kitsu";
import AutoSuggest from "react-autosuggest";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { AutoSuggestTextField } from "../AutoSuggestTextField";
import { DinaForm } from "../DinaForm";

interface Person extends KitsuResource {
  name: string;
}

// JSON API mock response.
const mockGet = jest.fn(async () => {
  return {
    data: [
      { name: "person1-json-api" },
      { name: "person2-json-api" },
      { name: "person3-json-api" }
    ]
  };
});

// Elastic Search mock response.
const mockGetAxios = jest.fn(async () => {
  return {
    data: {
      hits: {
        total: {
          value: 3
        },
        hits: [
          {
            _source: {
              data: {
                attributes: {
                  name: "person1-elastic-search"
                }
              }
            }
          },
          {
            _source: {
              data: {
                attributes: {
                  name: "person2-elastic-search"
                }
              }
            }
          },
          {
            _source: {
              data: {
                attributes: {
                  name: "person3-elastic-search"
                }
              }
            }
          }
        ]
      }
    }
  };
});

const apiContextJsonAPIOnly = {
  apiClient: {
    get: mockGet
  }
} as any;

const apiContextElasticSearchOnly = {
  apiClient: {
    axios: {
      get: mockGetAxios
    }
  }
} as any;

const apiContextBothProviders = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGetAxios
    }
  }
} as any;

describe("AutoSuggestTextField", () => {
  it("JSON API only provided, results are fetched from JSON API", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          jsonApiBackend={{
            query: searchValue => ({
              path: "agent-api/person",
              filter: {
                rsql: `name==*${searchValue}*`
              }
            }),
            option: person => person?.name
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
            option: person => person?.name
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

    expect(mockGetAxios).lastCalledWith("search-api/search-ws/auto-complete", {
      params: {
        additionalField: "",
        indexName: "dina_agent_index",
        autoCompleteField: "data.attributes.name",
        prefix: "p",
        documentId: undefined
      }
    });

    expect(mockGetAxios).toHaveBeenCalledTimes(1);

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "person1-elastic-search",
      "person2-elastic-search",
      "person3-elastic-search"
    ]);

    // Test to ensure number of API calls does is not excessive.
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
          customOptions={() => ["suggestion-1", "suggestion-2"]}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext: {} }
    );

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "suggestion-1",
      "suggestion-2"
    ]);
  });

  it("Both backend providers are used, preferred backend is used.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          elasticSearchBackend={{
            indexName: "dina_agent_index",
            searchField: "data.attributes.name",
            option: person => person?.name
          }}
          jsonApiBackend={{
            query: searchValue => ({
              path: "agent-api/person",
              filter: {
                rsql: `name==*${searchValue}*`
              }
            }),
            option: person => person?.name
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

    expect(mockGet).lastCalledWith("agent-api/person", {
      filter: { rsql: "name==*p*" },
      sort: "-createdOn"
    });

    expect(wrapper.find(AutoSuggest).prop("suggestions")).toEqual([
      "person1-json-api",
      "person2-json-api",
      "person3-json-api"
    ]);
  });

  it("Both backend providers are used, preferred backend fails, other backend is used.", async () => {
    // This test needs to be created.
  });

  it("Blank search provider not supplied, options do not appear when empty search.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <AutoSuggestTextField<Person>
          name="examplePersonNameField"
          jsonApiBackend={{
            query: searchValue => ({
              path: "agent-api/person",
              filter: {
                rsql: `name==*${searchValue}*`
              }
            }),
            option: person => person?.name
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

  it("Blank search provider supplied, options come from blank search provider only.", async () => {
    // This test needs to be created.
  });
});
