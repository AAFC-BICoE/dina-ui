import { doSearch } from "../SearchBox";

describe("SearchBox", () => {
  it("Fetches the search result data.", async () => {
    const mockGet = jest.fn<any, any>(async () => ({
      data: {
        hits: {
          hits: [
            {
              sourceAsMap: {
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
      }
    }));

    const results = await doSearch({ get: mockGet }, "test-search");

    expect(results).toEqual([
      {
        link: "/person/view?id=100",
        name: "Person: Mat Poff"
      }
    ]);

    expect(mockGet.mock.calls).toEqual([
      [
        "search-api/search/auto-complete",
        {
          params: {
            additionalField: "",
            autoCompleteField: "data.attributes.displayName",
            indexName: "dina_document_index",
            prefix: "test-search"
          }
        }
      ]
    ]);
  });
});
