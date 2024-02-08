import { mountWithAppContext2 } from "common-ui/lib/test-util/mock-app-context";
import { QueryBuilderAutoSuggestionTextSearchMemo } from "../QueryBuilderAutoSuggestionSearch";
import { waitFor } from "@testing-library/react";
import {fireEvent, screen} from '@testing-library/dom';

const INDEX_NAME = "dina-material-sample-index";

const CURRENT_FIELD_NAME = "data.attributes.materialSampleType";

const INDEX_MAP = [
  {
    label: "materialSampleType",
    value: "data.attributes.materialSampleType",
    type: "text",
    path: "data.attributes",
    distinctTerm: true,
    keywordMultiFieldSupport: true,
    optimizedPrefix: false,
    containsSupport: false,
    endsWithSupport: false
  }
]

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
}

describe("QueryBuilderAutoSuggestionSearch", () => {
  describe("QueryBuilderAutoSuggestionSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const autoSuggestionEquals = mountWithAppContext2(
        <QueryBuilderAutoSuggestionTextSearchMemo
          indexName={INDEX_NAME}
          indexMap={INDEX_MAP}
          currentFieldName={CURRENT_FIELD_NAME}
          matchType="equals"
          value="test"
          setValue={jest.fn}
        />,
        { apiContext: apiClientMock }
      );
    
      // Expect a snapshot with the date field being displayed.
      expect(autoSuggestionEquals.asFragment()).toMatchSnapshot(
        "Expect date field to be displayed since match type is equals"
      );
    
      const autoSuggestionEmpty = mountWithAppContext2(
        <QueryBuilderAutoSuggestionTextSearchMemo
          indexName={INDEX_NAME}
          indexMap={INDEX_MAP}
          currentFieldName={CURRENT_FIELD_NAME}
          matchType="empty"
          value="test"
          setValue={jest.fn}
        />,
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
      const autoSuggestionIn = mountWithAppContext2(
        <QueryBuilderAutoSuggestionTextSearchMemo
          indexName={INDEX_NAME}
          indexMap={INDEX_MAP}
          currentFieldName={CURRENT_FIELD_NAME}
          matchType="in"
          value="test"
          setValue={jest.fn}
        />,
        { apiContext: apiClientMock }
      );
    
      // Expect a snapshot with a specific placeholder.
      expect(autoSuggestionIn.asFragment()).toMatchSnapshot(
        "Expect auto-suggestion field to be displayed with a different placeholder."
      );
    
      const autoSuggestionNotIn = mountWithAppContext2(
        <QueryBuilderAutoSuggestionTextSearchMemo
          indexName={INDEX_NAME}
          indexMap={INDEX_MAP}
          currentFieldName={CURRENT_FIELD_NAME}
          matchType="notIn"
          value="test"
          setValue={jest.fn}
        />,
        { apiContext: apiClientMock }
      );
    
      // Expect a snapshot with a specific placeholder.
      expect(autoSuggestionNotIn.asFragment()).toMatchSnapshot(
        "Expect auto-suggestion field to be displayed with a different placeholder."
      );
    });

    it("Display suggestions on equals or not equals operators", async () => {
      const autoSuggestionComponent = mountWithAppContext2(
        <QueryBuilderAutoSuggestionTextSearchMemo
          indexName={INDEX_NAME}
          indexMap={INDEX_MAP}
          currentFieldName={CURRENT_FIELD_NAME}
          matchType="equals"
          value=""
          setValue={jest.fn}
        />,
        { apiContext: apiClientMock }
      );

      // Wait for the auto-suggestion element to be loaded in.
      await waitFor(() => expect(autoSuggestionComponent.findByRole("textbox")).not.toBeNull());

      // Wait for the api call to be made.
      await waitFor(() => expect(mockAutoSuggestionRequest).toBeCalledTimes(1));

      // Click on the textbox to make the dropdown options appear.
      fireEvent.click(autoSuggestionComponent.getByRole("textbox"));

      // Debugging: screen.logTestingPlaygroundURL();
    });
  });
});