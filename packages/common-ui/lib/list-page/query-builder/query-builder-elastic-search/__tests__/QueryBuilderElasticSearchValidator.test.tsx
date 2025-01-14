import { JsonTree, Utils } from "react-awesome-query-builder";
import { ESIndexMapping } from "../../../types";
import { generateBuilderConfig } from "../../useQueryBuilderConfig";
import { getElasticSearchValidationResults } from "../QueryBuilderElasticSearchValidator";

const mockFormatMessage = jest.fn((message) => message.id);

const testIndexMap: ESIndexMapping[] = [
  {
    label: "startEventDateTime",
    value: "collectingEvent.startEventDateTime",
    type: "date",
    path: "attributes",
    parentName: "collectingEvent",
    parentType: "collecting-event",
    parentPath: "included",
    keywordMultiFieldSupport: true,
    keywordNumericSupport: false,
    optimizedPrefix: false,
    containsSupport: false,
    endsWithSupport: false,
    distinctTerm: false,
    hideField: false
  }
];

describe("QueryBuilderElasticSearchValidator functionality", () => {
  describe("getElasticSearchValidationResults", () => {
    test("Given empty query tree, return no validation errors", async () => {
      const validationErrors = getElasticSearchValidationResults(
        Utils.loadTree({
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [{}],
          properties: {
            conjunction: "AND"
          }
        } as JsonTree),
        generateBuilderConfig(
          testIndexMap,
          "dina-material-sample-index",
          mockFormatMessage,
          []
        ),
        mockFormatMessage
      );

      // Should be an empty array.
      expect(validationErrors.length).toBe(0);
    });

    test("Valid date given, no validation errors should be present", async () => {
      const validationErrors = getElasticSearchValidationResults(
        Utils.loadTree({
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [
            {
              type: "rule",
              properties: {
                field: "collectingEvent.startEventDateTime",
                value: ["1998-05-19"],
                operator: "equals", // No longer supported prefix.
                valueSrc: [],
                valueType: [],
                valueError: []
              }
            }
          ],
          properties: {
            conjunction: "AND"
          }
        } as JsonTree),
        generateBuilderConfig(
          testIndexMap,
          "dina-material-sample-index",
          mockFormatMessage,
          []
        ),
        mockFormatMessage
      );

      // One validation error should be present.
      expect(validationErrors.length).toBe(0);
    });

    test("Valid date given using sub-groups, no validation error should be given", async () => {
      const validationErrors = getElasticSearchValidationResults(
        Utils.loadTree({
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [
            {
              type: "rule",
              properties: {
                field: "collectingEvent.startEventDateTime",
                value: ["1998-05-19"],
                operator: "equals",
                valueSrc: [],
                valueType: [],
                valueError: []
              }
            },
            {
              type: "group",
              properties: {
                conjunction: "AND"
              },
              children1: [
                {
                  type: "rule",
                  properties: {
                    field: "collectingEvent.startEventDateTime",
                    value: ["1998-05-19"],
                    operator: "equals",
                    valueSrc: [],
                    valueType: [],
                    valueError: []
                  }
                }
              ]
            }
          ],
          properties: {
            conjunction: "AND"
          }
        } as any),
        generateBuilderConfig(
          testIndexMap,
          "dina-material-sample-index",
          mockFormatMessage,
          []
        ),
        mockFormatMessage
      );

      // One validation error should be present.
      expect(validationErrors.length).toBe(0);
    });

    test("Invalid date given, validation error should be present", async () => {
      const validationErrors = getElasticSearchValidationResults(
        Utils.loadTree({
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [
            {
              type: "rule",
              properties: {
                field: "collectingEvent.startEventDateTime",
                value: ["today"],
                operator: "equals", // No longer supported prefix.
                valueSrc: [],
                valueType: [],
                valueError: []
              }
            }
          ],
          properties: {
            conjunction: "AND"
          }
        } as JsonTree),
        generateBuilderConfig(
          testIndexMap,
          "dina-material-sample-index",
          mockFormatMessage,
          []
        ),
        mockFormatMessage
      );

      // One validation error should be present.
      expect(validationErrors.length).toBe(1);
      expect(validationErrors[0].fieldName).toEqual("field_startEventDateTime");
      expect(mockFormatMessage).toHaveBeenLastCalledWith({
        id: "dateMustBeFormattedYyyyMmDd"
      });
    });

    test("Invalid date given on subquery level, validation error should be present", async () => {
      const validationErrors = getElasticSearchValidationResults(
        Utils.loadTree({
          id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
          type: "group",
          children1: [
            {
              type: "rule",
              properties: {
                field: "collectingEvent.startEventDateTime",
                value: ["1998-05-19"],
                operator: "equals",
                valueSrc: [],
                valueType: [],
                valueError: []
              }
            },
            {
              type: "group",
              properties: {
                conjunction: "AND"
              },
              children1: [
                {
                  type: "rule",
                  properties: {
                    field: "collectingEvent.startEventDateTime",
                    value: ["today"],
                    operator: "equals",
                    valueSrc: [],
                    valueType: [],
                    valueError: []
                  }
                }
              ]
            }
          ],
          properties: {
            conjunction: "AND"
          }
        } as any),
        generateBuilderConfig(
          testIndexMap,
          "dina-material-sample-index",
          mockFormatMessage,
          []
        ),
        mockFormatMessage
      );

      // One validation error should be present.
      expect(validationErrors.length).toBe(1);
      expect(validationErrors[0].fieldName).toEqual("field_startEventDateTime");
      expect(mockFormatMessage).toHaveBeenLastCalledWith({
        id: "dateMustBeFormattedYyyyMmDd"
      });
    });
  });
});
