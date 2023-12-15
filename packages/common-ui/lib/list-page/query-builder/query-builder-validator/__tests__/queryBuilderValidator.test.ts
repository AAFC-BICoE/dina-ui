import { JsonTree } from "react-awesome-query-builder";
import { validateQueryTree } from "../queryBuilderValidator";
import { generateBuilderConfig } from "../../useQueryBuilderConfig";
import { ESIndexMapping } from "../../../types";

const mockFormatMessage = jest.fn((message) => message.id);

const testIndexMap: ESIndexMapping[] = [
  {
    containsSupport: false,
    distinctTerm: false,
    endsWithSupport: false,
    keywordMultiFieldSupport: true,
    label: "dwcRecordNumber",
    optimizedPrefix: false,
    parentName: "collectingEvent",
    parentPath: "included",
    parentType: "collecting-event",
    path: "attributes",
    subType: undefined,
    type: "text",
    value: "collectingEvent.dwcRecordNumber"
  }
];

describe("validateQueryTree", () => {
  test("Given invalid operator in query tree, return false", async () => {
    expect(
      validateQueryTree(
        {
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [
            {
              type: "rule",
              properties: {
                field: "collectingEvent.dwcRecordNumber",
                value: [],
                operator: "prefix", // No longer supported prefix.
                valueSrc: [],
                valueType: [],
                valueError: []
              }
            }
          ],
          properties: {
            conjunction: "AND"
          }
        } as JsonTree,
        generateBuilderConfig(
          testIndexMap,
          "dina-material-sample-index",
          mockFormatMessage,
          []
        )
      )
    ).toBe(false);
  });

  test("Given invalid operator in query tree, return false", async () => {
    expect(
      validateQueryTree(
        {
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [
            {
              type: "rule",
              properties: {
                field: "collectingEvent.invalidField", // Invalid field
                value: [],
                operator: "notEmpty",
                valueSrc: [],
                valueType: [],
                valueError: []
              }
            }
          ],
          properties: {
            conjunction: "AND"
          }
        } as JsonTree,
        generateBuilderConfig(
          testIndexMap,
          "dina-material-sample-index",
          mockFormatMessage,
          []
        )
      )
    ).toBe(false);
  });

  test("Given valid query tree, return true", async () => {
    expect(
      validateQueryTree(
        {
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [
            {
              type: "rule",
              properties: {
                field: "collectingEvent.dwcRecordNumber",
                value: [],
                operator: "notEmpty",
                valueSrc: [],
                valueType: [],
                valueError: []
              }
            }
          ],
          properties: {
            conjunction: "AND"
          }
        } as JsonTree,
        generateBuilderConfig(
          testIndexMap,
          "dina-material-sample-index",
          mockFormatMessage,
          []
        )
      )
    ).toBe(true);
  });
});
