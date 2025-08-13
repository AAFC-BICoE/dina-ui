import { JsonTree } from "@react-awesome-query-builder/ui";
import {
  validateQueryTree,
  validateSavedSearchVerison
} from "../queryBuilderValidator";
import { generateBuilderConfig } from "../../useQueryBuilderConfig";
import { ESIndexMapping } from "../../../types";
import {
  SAVED_SEARCH_VERSION,
  SingleSavedSearch
} from "../../../saved-searches/types";

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

describe("queryBuilderValidator", () => {
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

  describe("validateSearchVerison", () => {
    const queryTreeTest: JsonTree = {
      id: "8c6dc2c8-4070-48ce-b700-13a931f9ebaf",
      type: "group",
      children1: [
        {
          id: "f76a54f6-0112-4ac9-b2a1-f6dced58b3d6",
          type: "rule",
          properties: {
            field: "data.attributes.managedAttributes",
            value: [
              '{"searchValue":"F-unknown","selectedOperator":"partialMatch","selectedType":"STRING","selectedManagedAttribute":{"id":"8504783b-cf16-4702-b2fe-88c2db2ee475","type":"managed-attribute","name":"Folder Barcode","key":"folder_barcode","vocabularyElementType":"STRING","acceptedValues":null,"createdOn":"2022-12-23T20:18:04.564264Z","createdBy":"gendreauc","multilingualDescription":{"descriptions":[{"lang":"en","desc":"Folder Barcode"}]}}}'
            ],
            operator: "noOperator",
            valueSrc: ["value"],
            valueType: ["managedAttribute"],
            valueError: [null]
          }
        }
      ],
      properties: {
        conjunction: "AND"
      }
    };

    test("Current verison is supplied, return true", async () => {
      const savedSearch: SingleSavedSearch = {
        version: SAVED_SEARCH_VERSION,
        default: false,
        groups: ["aafc"],
        columnVisibility: ["managedAttributes/ENTITY/ocr"],
        queryTree: queryTreeTest,
        savedSearchName: "latestVerison"
      };

      expect(validateSavedSearchVerison(savedSearch)).toBe(true);
    });

    test("Earlier verison is supplied, return false", async () => {
      const savedSearch: SingleSavedSearch = {
        version: SAVED_SEARCH_VERSION - 2,
        default: false,
        groups: ["aafc"],
        columnVisibility: [],
        queryTree: queryTreeTest,
        savedSearchName: "olderVerison"
      };

      expect(validateSavedSearchVerison(savedSearch)).toBe(false);
    });

    test("No verison number found, return false", async () => {
      const savedSearch: SingleSavedSearch = {
        default: false,
        groups: ["aafc"],
        queryTree: queryTreeTest,
        savedSearchName: "noVerison"
      };

      expect(validateSavedSearchVerison(savedSearch)).toBe(false);
    });

    test("Managed attributes stored the legacy way, returns false", async () => {
      const savedSearch: SingleSavedSearch = {
        version: SAVED_SEARCH_VERSION,
        default: false,
        groups: ["aafc"],
        columnVisibility: ["managedAttributes.ocr", "barcode"],
        queryTree: queryTreeTest,
        savedSearchName: "latestVerison"
      };

      expect(validateSavedSearchVerison(savedSearch)).toBe(false);
    });
  });
});
