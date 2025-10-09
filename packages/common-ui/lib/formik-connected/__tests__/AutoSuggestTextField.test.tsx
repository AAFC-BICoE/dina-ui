import { KitsuResource } from "kitsu";
import { mountWithAppContext, SimpleSearchFilterBuilder } from "common-ui";
import { AutoSuggestTextField } from "../AutoSuggestTextField";
import { DinaForm } from "../DinaForm";
import { act, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { simpleSearchFilterToFiql } from "../../filter-builder/fiql";

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
              fiql: simpleSearchFilterToFiql(
                SimpleSearchFilterBuilder.create<Person>()
                  .searchFilter("name", searchValue)
                  .build()
              )
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
    expect(wrapper.asFragment()).toMatchSnapshot();

    // Simulate clicking an option, first need to provide a search.
    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "p" } }
    );

    // Select the first option in the list.
    await waitFor(() => {
      expect(wrapper.getByText(/person1\-json\-api/i)).toBeInTheDocument();
    });
    fireEvent.click(wrapper.getByText(/person1\-json\-api/i));

    await waitFor(() => {
      expect(suggestionSelectedMock).toBeCalledTimes(1);
    });
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
              fiql: simpleSearchFilterToFiql(
                SimpleSearchFilterBuilder.create<Person>()
                  .searchFilter("name", searchValue)
                  .build()
              )
            }),
            option: (person) => person?.name
          }}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext: apiContextJsonAPIOnly }
    );

    // Simulate clicking an option, first need to provide a search.
    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "p" } }
    );

    await waitFor(() => {
      expect(mockGet).lastCalledWith("agent-api/person", {
        fiql: "name==*p*",
        sort: "-createdOn"
      });
    });

    expect(mockGet).toHaveBeenCalledTimes(1);

    // Verify all the suggestions are shown...
    await waitFor(() => {
      expect(wrapper.getByText(/person1\-json\-api/i)).toBeInTheDocument();
      expect(wrapper.getByText(/person2\-json\-api/i)).toBeInTheDocument();
      expect(wrapper.getByText(/person3\-json\-api/i)).toBeInTheDocument();
    });

    // Test to ensure number of API calls does is not excessive.
    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "pe" } }
    );
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    // Try an empty search, since blankSearchProvider is not supplied it should not do any requests.
    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "" } }
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

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

    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "p" } }
    );

    // Expected suggestions to appear.
    await waitFor(() => {
      expect(
        wrapper.getByText(/person1\-elastic\-search/i)
      ).toBeInTheDocument();
      expect(
        wrapper.getByText(/person2\-elastic\-search/i)
      ).toBeInTheDocument();
      expect(
        wrapper.getByText(/person3\-elastic\-search/i)
      ).toBeInTheDocument();
    });

    // Take a snapshot of the suggestion popup being displayed in the UI.
    expect(wrapper.asFragment()).toMatchSnapshot();

    // Remove focus from input, the suggestions should no longer be displayed.
    fireEvent.blur(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    expect(
      wrapper.queryByText(/person1\-elastic\-search/i)
    ).not.toBeInTheDocument();
    expect(
      wrapper.queryByText(/person2\-elastic\-search/i)
    ).not.toBeInTheDocument();
    expect(
      wrapper.queryByText(/person3\-elastic\-search/i)
    ).not.toBeInTheDocument();

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
    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "pe" } }
    );

    await waitFor(() => {
      expect(mockGetAxios).toHaveBeenCalledTimes(2);
    });

    // Try an empty search, since blankSearchProvider is not supplied it should not do any requests.
    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "" } }
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
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

    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "3" } }
    );

    // Expected suggestions to appear.
    await waitFor(() => {
      expect(wrapper.getByText(/suggestion\-1/i)).toBeInTheDocument();
      expect(wrapper.getByText(/suggestion\-2/i)).toBeInTheDocument();
      expect(wrapper.getByText(/suggestion\-3/i)).toBeInTheDocument();
    });

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
              fiql: simpleSearchFilterToFiql(
                SimpleSearchFilterBuilder.create<Person>()
                  .searchFilter("name", searchValue)
                  .build()
              )
            }),
            option: (person) => person?.name
          }}
          preferredBackend={"json-api"}
          timeoutMs={0}
        />
      </DinaForm>,
      { apiContext: apiContextBothProviders }
    );

    fireEvent.focus(
      wrapper.getByRole("textbox", { name: /example person name field/i })
    );
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /example person name field/i }),
      { target: { value: "p" } }
    );

    await waitFor(() => {
      expect(mockGetAll).lastCalledWith("agent-api/person", {
        fiql: "name==*p*",
        sort: "-createdOn"
      });
    });

    // Verify all the suggestions are shown...
    await waitFor(() => {
      expect(wrapper.getByText(/person1\-json\-api/i)).toBeInTheDocument();
      expect(wrapper.getByText(/person2\-json\-api/i)).toBeInTheDocument();
      expect(wrapper.getByText(/person3\-json\-api/i)).toBeInTheDocument();
    });

    // Should not have any calls to elastic search.
    expect(mockGetAll.mock.calls).toEqual([
      [
        "agent-api/person",
        {
          fiql: "name==*p*",
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
                fiql: simpleSearchFilterToFiql(
                  SimpleSearchFilterBuilder.create<Person>()
                    .searchFilter("name", searchValue)
                    .build()
                )
              }),
              option: (person) => person?.name
            }}
            preferredBackend={"json-api"}
            timeoutMs={5}
          />
        </DinaForm>,
        { apiContext: apiContextJsonAPIFailure }
      );

      const textField = wrapper.getByRole("textbox", {
        name: /example person name field/i
      });

      // Simulate typing "p"
      await act(async () => {
        fireEvent.focus(textField);
        fireEvent.change(textField, { target: { value: "p" } });
      });

      // JSON API should be tried first but fails, then Elastic Search is used.
      await waitFor(() => {
        // mockGetFailure should be called once for "p"
        expect(mockGetFailure).toHaveBeenCalledTimes(1);
        // mockGetAxios should be called once as the fallback for "p"
        expect(mockGetAxios).toHaveBeenCalledTimes(1);
      });

      // Assert suggestions after the first search term
      expect(
        wrapper.queryByText(/person1\-elastic\-search/i)
      ).toBeInTheDocument();
      expect(
        wrapper.queryByText(/person2\-elastic\-search/i)
      ).toBeInTheDocument();
      expect(
        wrapper.queryByText(/person3\-elastic\-search/i)
      ).toBeInTheDocument();

      // Simulate typing "pe" (change from "p" to "pe")
      await act(async () => {
        fireEvent.change(textField, { target: { value: "pe" } });
      });

      // JSON API should *not* be called again for "pe" because it failed previously and should have switched permanently to Elastic Search.
      // Elastic Search should be called a second time for the new "pe" search term.
      await waitFor(() => {
        expect(mockGetFailure).toHaveBeenCalledTimes(1); // Still 1 call for the failed JSON API
        expect(mockGetAxios).toHaveBeenCalledTimes(2); // Elastic Search should be called a second time
      });
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
                fiql: simpleSearchFilterToFiql(
                  SimpleSearchFilterBuilder.create<Person>()
                    .searchFilter("name", searchValue)
                    .build()
                )
              }),
              option: (person) => person?.name
            }}
            preferredBackend={"elastic-search"}
            timeoutMs={0}
          />
        </DinaForm>,
        { apiContext: apiContextElasticSearchFailure }
      );

      fireEvent.focus(
        wrapper.getByRole("textbox", { name: /example person name field/i })
      );
      fireEvent.change(
        wrapper.getByRole("textbox", { name: /example person name field/i }),
        { target: { value: "p" } }
      );

      // Elastic Search should be tried first, but fails.
      await waitFor(() => {
        expect(mockGetFailure).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledTimes(1);

        expect(wrapper.queryByText(/person1\-json\-api/i)).toBeInTheDocument();
        expect(wrapper.queryByText(/person2\-json\-api/i)).toBeInTheDocument();
        expect(wrapper.queryByText(/person3\-json\-api/i)).toBeInTheDocument();
      });

      fireEvent.focus(
        wrapper.getByRole("textbox", { name: /example person name field/i })
      );
      fireEvent.change(
        wrapper.getByRole("textbox", { name: /example person name field/i }),
        { target: { value: "pe" } }
      );

      // JSON API should not be called again at this point. Already failed and should have switched to
      // json api.
      await waitFor(() => {
        expect(mockGetFailure).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledTimes(2);
      });
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
                fiql: simpleSearchFilterToFiql(
                  SimpleSearchFilterBuilder.create<Person>()
                    .searchFilter("name", searchValue)
                    .build()
                )
              }),
              option: (person) => person?.name
            }}
            timeoutMs={0}
          />
        </DinaForm>,
        { apiContext: apiContextJsonAPIOnly }
      );

      fireEvent.focus(
        wrapper.getByRole("textbox", { name: /example person name field/i })
      );

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
                fiql: simpleSearchFilterToFiql(
                  SimpleSearchFilterBuilder.create<Person>()
                    .searchFilter("name", searchValue)
                    .build()
                )
              }),
              option: (person) => person?.name
            }}
            blankSearchBackend={"json-api"}
            timeoutMs={0}
          />
        </DinaForm>,
        { apiContext: apiContextJsonAPIOnly }
      );

      fireEvent.focus(
        wrapper.getByRole("textbox", { name: /example person name field/i })
      );

      // Expected suggestions to appear.
      await waitFor(() => {
        expect(wrapper.getByText(/person1\-json\-api/i)).toBeInTheDocument();
        expect(wrapper.getByText(/person2\-json\-api/i)).toBeInTheDocument();
        expect(wrapper.getByText(/person3\-json\-api/i)).toBeInTheDocument();
      });
    });
  });
});
