import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import { QueryBuilderAutoSuggestionTextSearchMemo } from "../QueryBuilderAutoSuggestionSearch";
import { waitFor } from "@testing-library/react";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { ESIndexMapping } from "../../../types";
import { QueryBuilderContextProvider } from "../../QueryBuilder";
import { noop } from "lodash";
import userEvent from "@testing-library/user-event";

const INDEX_NAME = "dina-material-sample-index";

const CURRENT_FIELD_NAME = "data.attributes.materialSampleType";

const INDEX_MAP: ESIndexMapping[] = [
  {
    label: "materialSampleType",
    value: "data.attributes.materialSampleType",
    type: "text",
    path: "data.attributes",
    distinctTerm: true,
    keywordMultiFieldSupport: true,
    optimizedPrefix: false,
    containsSupport: false,
    endsWithSupport: false,
    hideField: false,
    keywordNumericSupport: false
  }
];

const mockAutoSuggestionRequest = jest.fn<any, any>(async (path) => {
  if (path === "search-api/search-ws/search") {
    return {
      data: {
        took: 3,
        timed_out: false,
        _shards: {
          failed: 0.0,
          successful: 1.0,
          total: 1.0,
          skipped: 0.0
        },
        hits: {
          total: {
            relation: "eq",
            value: 0
          },
          hits: []
        },
        aggregations: {
          "sterms#term_aggregation": {
            buckets: [
              {
                doc_count: 7,
                key: "WHOLE_ORGANISM"
              },
              {
                doc_count: 6,
                key: "MIXED_ORGANISMS"
              },
              {
                doc_count: 5,
                key: "MOLECULAR_SAMPLE"
              },
              {
                doc_count: 1,
                key: "CULTURE_STRAIN"
              }
            ],
            doc_count_error_upper_bound: 0,
            sum_other_doc_count: 0
          }
        }
      }
    };
  }
});

const apiClientMock = {
  apiClient: {
    axios: { post: mockAutoSuggestionRequest } as any
  }
};

describe("QueryBuilderAutoSuggestionSearch", () => {
  beforeEach(jest.clearAllMocks);

  describe("QueryBuilderAutoSuggestionSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const autoSuggestionEquals = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: ["aafc", "cnc"] }}
          >
            <QueryBuilderAutoSuggestionTextSearchMemo
              indexName={INDEX_NAME}
              indexMap={INDEX_MAP}
              currentFieldName={CURRENT_FIELD_NAME}
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Expect a snapshot with the date field being displayed.
      expect(autoSuggestionEquals.asFragment()).toMatchSnapshot(
        "Expect date field to be displayed since match type is equals"
      );

      const autoSuggestionEmpty = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: ["aafc", "cnc"] }}
          >
            <QueryBuilderAutoSuggestionTextSearchMemo
              indexName={INDEX_NAME}
              indexMap={INDEX_MAP}
              currentFieldName={CURRENT_FIELD_NAME}
              matchType="empty"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Expect a snapshot without the date field being displayed.
      expect(autoSuggestionEmpty.asFragment()).toMatchSnapshot(
        "Expect date field not to be displayed since the match type is not equals"
      );
    });

    it("Display different placeholder on IN operators", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const autoSuggestionIn = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: ["aafc", "cnc"] }}
          >
            <QueryBuilderAutoSuggestionTextSearchMemo
              indexName={INDEX_NAME}
              indexMap={INDEX_MAP}
              currentFieldName={CURRENT_FIELD_NAME}
              matchType="in"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Expect a snapshot with a specific placeholder.
      expect(autoSuggestionIn.asFragment()).toMatchSnapshot(
        "Expect auto-suggestion field to be displayed with a different placeholder."
      );

      const autoSuggestionNotIn = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: ["aafc", "cnc"] }}
          >
            <QueryBuilderAutoSuggestionTextSearchMemo
              indexName={INDEX_NAME}
              indexMap={INDEX_MAP}
              currentFieldName={CURRENT_FIELD_NAME}
              matchType="notIn"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Expect a snapshot with a specific placeholder.
      expect(autoSuggestionNotIn.asFragment()).toMatchSnapshot(
        "Expect auto-suggestion field to be displayed with a different placeholder."
      );
    });

    it("Display suggestions on equals or not equals operators", async () => {
      const autoSuggestionComponent = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: ["aafc", "cnc"] }}
          >
            <QueryBuilderAutoSuggestionTextSearchMemo
              indexName={INDEX_NAME}
              indexMap={INDEX_MAP}
              currentFieldName={CURRENT_FIELD_NAME}
              matchType="equals"
              value=""
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Wait for the auto-suggestion element to be loaded in.
      await waitFor(() =>
        expect(autoSuggestionComponent.findByRole("textbox")).not.toBeNull()
      );

      // Wait for the api call to be made.
      await waitFor(() => expect(mockAutoSuggestionRequest).toBeCalledTimes(1));

      // Ensure the API request was made correctly.
      expect(mockAutoSuggestionRequest).toBeCalledWith(
        "search-api/search-ws/search", // Search endpoint
        {
          aggs: {
            term_aggregation: {
              terms: {
                field: "data.attributes.materialSampleType.keyword",
                size: 100
              }
            }
          },
          query: {
            terms: {
              "data.attributes.group.keyword": ["aafc", "cnc"]
            }
          },
          size: 0
        },
        { params: { indexName: "dina-material-sample-index" } }
      );

      // Simulate focus, to display the suggestions dialog.
      autoSuggestionComponent.getByRole("textbox").focus();

      // Wait for the component to update after focus change
      await waitFor(
        () => expect(autoSuggestionComponent.getByRole("textbox")).toHaveFocus
      );

      // Get each suggestion item and assert its content
      const suggestions = autoSuggestionComponent.getAllByRole("option");
      expect(suggestions.length).toBe(4); // Ensure there are 4 options

      // Assert the text content of each suggestion
      expect(suggestions[0].textContent).toBe("WHOLE_ORGANISM");
      expect(suggestions[1].textContent).toBe("MIXED_ORGANISMS");
      expect(suggestions[2].textContent).toBe("MOLECULAR_SAMPLE");
      expect(suggestions[3].textContent).toBe("CULTURE_STRAIN");
    });

    it("Should call performSubmit on enter key press in textfield", async () => {
      const mockPerformSubmit = jest.fn();
      const { getByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{
              performSubmit: mockPerformSubmit,
              groups: ["aafc", "cnc"]
            }}
          >
            <QueryBuilderAutoSuggestionTextSearchMemo
              indexName={INDEX_NAME}
              indexMap={INDEX_MAP}
              currentFieldName={CURRENT_FIELD_NAME}
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Find the text field element
      const textField = getByRole("textbox");

      // Expect performSubmit to not be called yet.
      expect(mockPerformSubmit).toHaveBeenCalledTimes(0);

      // Simulate user typing "enter" key
      userEvent.type(textField, "{enter}");

      // Expect performSubmit to be called once
      expect(mockPerformSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
