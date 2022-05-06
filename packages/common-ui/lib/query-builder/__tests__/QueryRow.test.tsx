import Select from "react-select";
import React from "react";
import { DinaForm } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { ESIndexMapping, QueryRow } from "../QueryRow";

const testFieldsOptions: ESIndexMapping[] = [
  {
    label: "testA",
    value: "testA",
    type: "boolean",
    path: "data.attributes",
    distinctTerm: false
  },
  {
    label: "testB",
    value: "testB",
    type: "number",
    path: "data.attributes",
    distinctTerm: false
  },
  {
    label: "testC",
    value: "preparation-type.testC",
    type: "text",
    path: "data.attributes",
    distinctTerm: true
  },
  {
    label: "testD",
    value: "preparation-type.testD",
    type: "text",
    path: "attributes",
    distinctTerm: true,
    parentName: "preparation-type",
    parentPath: "included"
  }
];

/**
 * Mock of the elastic search suggestion query. This is used for the auto-complete dropdowns. This
 * is only supported on options with the distinctTerm option as true.
 *
 * The relationship one is a bit more complicated an uses the "included_aggregation" part.
 */
const MOCK_ELASTIC_SEARCH_RELATIONSHIP_SUGGESTIONS = {
  data: {
    hits: { total: { value: 8, relation: "eq" }, max_score: null, hits: [] },
    aggregations: {
      included_aggregation: {
        doc_count: 8,
        term_aggregation: {
          doc_count_error_upper_bound: 0,
          sum_other_doc_count: 0,
          buckets: [
            { key: "Suggestion 1", doc_count: 3 },
            { key: "Suggestion 2", doc_count: 2 },
            { key: "Suggestion 3", doc_count: 2 },
            { key: "Suggestion 4", doc_count: 1 }
          ]
        }
      }
    }
  }
};

/**
 * Mock of the elastic search suggestion query. This is used for the auto-complete dropdowns. This
 * is only supported on options with the distinctTerm option as true.
 *
 * This is the more simple version when using it with attributes.
 */
const MOCK_ELASTIC_SEARCH_ATTRIBUTE_SUGGESTIONS = {
  data: {
    hits: { total: { value: 8, relation: "eq" }, max_score: null, hits: [] },
    aggregations: {
      term_aggregation: {
        doc_count_error_upper_bound: 0,
        sum_other_doc_count: 0,
        buckets: [
          { key: "Suggestion 1", doc_count: 3 },
          { key: "Suggestion 2", doc_count: 2 },
          { key: "Suggestion 3", doc_count: 2 },
          { key: "Suggestion 4", doc_count: 1 }
        ]
      }
    }
  }
};

describe("QueryRow component", () => {
  it("Displays the Query Row with a dropdown whose items matching the input index mapping fields.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <QueryRow
          esIndexMapping={testFieldsOptions}
          index={0}
          name="test"
          indexName="testIndex"
        />
      </DinaForm>
    );
    expect(wrapper.find(".compoundQueryType0").length).toBe(0);

    expect(
      wrapper.find("SelectField[name='test[0].fieldName']").length
    ).toEqual(1);
    expect(
      wrapper
        .find("SelectField[name='test[0].fieldName']")
        .find(Select)
        .prop("options")
    ).toEqual([
      {
        label: "testA",
        value: "testA"
      },
      {
        label: "testB",
        value: "testB"
      },
      {
        label: "testC",
        value: "preparation-type.testC"
      },
      {
        label: "preparation-type",
        options: [
          {
            label: "testD",
            parentName: "preparation-type",
            value: "preparation-type.testD"
          }
        ]
      }
    ]);
  });

  it("Select a field from fieldName dropdown of query row, the correspondent fields should be set visible.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <QueryRow
          esIndexMapping={testFieldsOptions}
          index={0}
          name="test"
          indexName="testIndex"
        />
      </DinaForm>
    );

    // Select a boolean type item from the fieldName dropdown
    wrapper
      .find("SelectField[name='test[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({
      value: "testA"
    });

    await new Promise(setImmediate);
    wrapper.update();

    // Expect the boolean dropdown to be visible
    expect(wrapper.find("SelectField[name='test[0].boolean']").length).toEqual(
      1
    );
    expect(
      wrapper
        .find("SelectField[name='test[0].boolean']")
        .find(Select)
        .prop<any>("options")
    ).toEqual([
      { label: "TRUE", value: "true" },
      { label: "FALSE", value: "false" }
    ]);

    // Expect the other type dropdown to be invisible
    expect(wrapper.find("SelectField[name='test[0].number']").length).toEqual(
      0
    );
  });

  it("Select an auto complete field, ensure auto-complete is working for attributes.", async () => {
    // Setup elastic search response mock.
    const mockPost = jest.fn<any, any>(
      () => MOCK_ELASTIC_SEARCH_ATTRIBUTE_SUGGESTIONS
    );
    const apiContext: any = {
      apiClient: {
        axios: {
          post: mockPost
        }
      }
    };

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <QueryRow
          esIndexMapping={testFieldsOptions}
          index={0}
          name="test"
          indexName="testIndex"
        />
      </DinaForm>,
      { apiContext }
    );

    // Select the auto complete type from the dropdown menu. (The attribute version.)
    wrapper
      .find("SelectField[name='test[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({
      value: "testC"
    });

    await new Promise(setImmediate);
    wrapper.update();

    // console.log(wrapper.debug({verbose: true}))

    wrapper.find("AutoSuggestTextFieldInternal").prop<any>("onChange")({
      value: ""
    });

    expect(mockPost.mock.calls[0]).toEqual([
      "search-api/search-ws/search",
      {},
      {
        params: {
          indexName: "testIndex"
        }
      }
    ]);
  });

  it("Select an auto complete field, ensure auto-complete is working for relationships.", async () => {
    // Setup elastic search response mock.
    const apiContext: any = {
      apiClient: {
        axios: {
          post: jest.fn<any, any>(
            () => MOCK_ELASTIC_SEARCH_RELATIONSHIP_SUGGESTIONS
          )
        }
      }
    };

    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ group: ["aafc", "cnc"] }}>
        <QueryRow
          esIndexMapping={testFieldsOptions}
          index={0}
          name="test"
          indexName="testIndex"
        />
      </DinaForm>,
      { apiContext }
    );

    // Select the auto complete type from the dropdown menu. (The relationship version.)
    wrapper
      .find("SelectField[name='test[0].fieldName']")
      .find(Select)
      .prop<any>("onChange")({
      value: "testD"
    });

    await new Promise(setImmediate);
    wrapper.update();
  });
});
