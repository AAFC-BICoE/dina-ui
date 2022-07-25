import { doSearch } from "../useSearch";

describe("doSearch function", () => {
  it("Fetches the search result data.", async () => {
    const mockGet = jest.fn<any, any>(async () => ({
      data: {
        hits: [
          {
            source: {
              data: {
                id: "100",
                type: "person",
                attributes: {
                  displayName: "Mat Poff"
                }
              }
            }
          }
        ]
      }
    }));

    const results = await doSearch(
      { get: mockGet },
      {
        indexName: "dina_agent_index",
        searchField: "data.attributes.displayName",
        searchValue: "test-search"
      }
    );

    expect(results).toEqual([
      {
        displayName: "Mat Poff",
        id: "100",
        type: "person"
      }
    ]);

    expect(mockGet.mock.calls).toEqual([
      [
        "search-api/search-ws/auto-complete",
        {
          params: {
            additionalField: "",
            autoCompleteField: "data.attributes.displayName",
            indexName: "dina_agent_index",
            prefix: "test-search"
          }
        }
      ]
    ]);
  });
});
