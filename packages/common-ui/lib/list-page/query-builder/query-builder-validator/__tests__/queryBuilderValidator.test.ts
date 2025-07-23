import { JsonTree } from "@react-awesome-query-builder/ui";
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
    keywordNumericSupport: false,
    label: "dwcRecordNumber",
    optimizedPrefix: false,
    parentName: "collectingEvent",
    parentPath: "included",
    parentType: "collecting-event",
    path: "attributes",
    subType: undefined,
    type: "text",
    value: "collectingEvent.dwcRecordNumber",
    hideField: false
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

  test("Given a valid empty query tree, return true", async () => {
    expect(
      validateQueryTree(
        {
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [
            {
              id: "f76a54f6-0112-4ac9-b2a1-f6dced58b3d6",
              type: "rule",
              properties: {
                field: null,
                value: [],
                operator: null,
                valueSrc: [],
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

  test("Given invalid field in query tree, return false", async () => {
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
