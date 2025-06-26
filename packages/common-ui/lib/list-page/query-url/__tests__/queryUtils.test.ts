import { Utils } from "@react-awesome-query-builder/ui";
import { parseQueryTreeFromURL, serializeQueryTreeToURL } from "../queryUtils";
import { ManagedAttributeSearchStates } from "../../query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import { FieldExtensionSearchStates } from "../../query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";
import { IdentifierSearchStates } from "../../query-builder/query-builder-value-types/QueryBuilderIdentifierSearch";
import { ClassificationSearchStates } from "../../query-builder/query-builder-value-types/QueryBuilderClassificationSearch";
import { RelationshipPresenceSearchStates } from "../../query-builder/query-builder-value-types/QueryBuilderRelationshipPresenceSearch";

// Mock the @react-awesome-query-builder/ui module
jest.mock("@react-awesome-query-builder/ui", () => ({
  Utils: {
    getTree: jest.fn(),
    loadTree: jest.fn(),
    uuid: jest.fn(() => "mock-uuid")
  }
}));

describe("queryUtils", () => {
  describe("serializeQueryTreeToURL", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("Should correctly serialize a basic query tree", () => {
      // Set up the mock to return a simple JSON tree
      const mockJsonTree = {
        properties: { conjunction: "AND" },
        children1: [
          {
            properties: {
              field: "data.attributes.materialSampleName",
              operator: "exactMatch",
              value: ["Sample1"],
              valueType: ["text"]
            }
          }
        ]
      };
      (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

      // Expected result
      const expected = JSON.stringify({
        c: "a",
        p: [
          {
            f: "data.attributes.materialSampleName",
            o: "exactMatch",
            v: "Sample1",
            t: "text"
          }
        ]
      });

      // Test the function
      const result = serializeQueryTreeToURL({} as any); // mocked above.
      expect(result).toEqual(expected);
    });

    it("Should correctly serialize a query tree with multiple rules", () => {
      const mockJsonTree = {
        properties: { conjunction: "OR" },
        children1: [
          {
            properties: {
              field: "data.attributes.materialSampleName",
              operator: "exactMatch",
              value: ["Sample1"],
              valueType: ["text"]
            }
          },
          {
            properties: {
              field: "data.attributes.barcode",
              operator: "wildcard",
              value: ["barcode12345"],
              valueType: ["text"]
            }
          }
        ]
      };
      (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

      const expected = JSON.stringify({
        c: "o",
        p: [
          {
            f: "data.attributes.materialSampleName",
            o: "exactMatch",
            v: "Sample1",
            t: "text"
          },
          {
            f: "data.attributes.barcode",
            o: "wildcard",
            v: "barcode12345",
            t: "text"
          }
        ]
      });

      const result = serializeQueryTreeToURL({} as any); // mocked above.
      expect(result).toEqual(expected);
    });

    describe("Dynamic Field type special cases", () => {
      it("Should correctly serialize managed attribute rule", () => {
        const managedAttributeStates: ManagedAttributeSearchStates = {
          searchValue: "Test",
          selectedOperator: "exactMatch",
          selectedType: "STRING",
          selectedManagedAttribute: {
            id: "0193e571-2d0c-7517-928d-2c19e04bf6cd",
            key: "test-1",
            name: "test",
            type: "managed-attribute",
            vocabularyElementType: "STRING"
          }
        };

        const mockJsonTree = {
          properties: { conjunction: "AND" },
          children1: [
            {
              properties: {
                field: "data.attributes.managedAttributes",
                operator: "noOperator",
                value: [JSON.stringify(managedAttributeStates)],
                valueType: ["managedAttribute"]
              }
            }
          ]
        };
        (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

        const expected = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.attributes.managedAttributes",
              o: "exactMatch",
              v: managedAttributeStates.searchValue,
              t: "managedAttribute",
              d: managedAttributeStates?.selectedManagedAttribute?.id
            }
          ]
        });

        const result = serializeQueryTreeToURL({} as any);
        expect(result).toEqual(expected);
      });

      it("Should correctly serialize field extension rule", () => {
        const fieldExtensionStates: FieldExtensionSearchStates = {
          searchValue: "Extension value",
          selectedOperator: "contains",
          selectedField: "field-test",
          selectedExtension: "package-test"
        };

        const mockJsonTree = {
          properties: { conjunction: "AND" },
          children1: [
            {
              properties: {
                field: "data.attributes.extension",
                operator: "noOperator",
                value: [JSON.stringify(fieldExtensionStates)],
                valueType: ["fieldExtension"]
              }
            }
          ]
        };
        (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

        const expected = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.attributes.extension",
              o: "contains",
              v: fieldExtensionStates.searchValue,
              t: "fieldExtension",
              d: fieldExtensionStates.selectedExtension,
              d2: fieldExtensionStates.selectedField
            }
          ]
        });

        const result = serializeQueryTreeToURL({} as any);
        expect(result).toEqual(expected);
      });

      it("Should correctly serialize identifier rule", () => {
        const identifierStates: IdentifierSearchStates = {
          searchValue: "ID123456",
          selectedOperator: "startsWith",
          selectedType: "STRING",
          selectedIdentifier: {
            type: "identifier-type",
            id: "cc5b8bdc-52b8-41b7-ac5a-8e633034fb15",
            vocabularyElementType: "STRING"
          }
        };

        const mockJsonTree = {
          properties: { conjunction: "AND" },
          children1: [
            {
              properties: {
                field: "data.attributes.identifiers",
                operator: "noOperator",
                value: [JSON.stringify(identifierStates)],
                valueType: ["identifier"]
              }
            }
          ]
        };
        (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

        const expected = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.attributes.identifiers",
              o: "startsWith",
              v: identifierStates.searchValue,
              t: "identifier",
              d: identifierStates?.selectedIdentifier?.id
            }
          ]
        });

        const result = serializeQueryTreeToURL({} as any);
        expect(result).toEqual(expected);
      });

      it("Should correctly serialize classification rule", () => {
        const classificationStates: ClassificationSearchStates = {
          searchValue: "Mammalia",
          selectedOperator: "exactMatch",
          selectedClassificationRank: "class"
        };

        const mockJsonTree = {
          properties: { conjunction: "AND" },
          children1: [
            {
              properties: {
                field: "data.attributes.classification",
                operator: "noOperator",
                value: [JSON.stringify(classificationStates)],
                valueType: ["classification"]
              }
            }
          ]
        };
        (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

        const expected = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.attributes.classification",
              o: "exactMatch",
              v: classificationStates.searchValue,
              t: "classification",
              d: classificationStates.selectedClassificationRank
            }
          ]
        });

        const result = serializeQueryTreeToURL({} as any);
        expect(result).toEqual(expected);
      });

      it("Should correctly serialize relationship presence rule", () => {
        const relationshipPresenceStates: RelationshipPresenceSearchStates = {
          selectedOperator: "exists",
          selectedRelationship: "collecting-event",
          selectedValue: 0 // Future use.
        };

        const mockJsonTree = {
          properties: { conjunction: "AND" },
          children1: [
            {
              properties: {
                field: "data.relationships",
                operator: "noOperator",
                value: [JSON.stringify(relationshipPresenceStates)],
                valueType: ["relationshipPresence"]
              }
            }
          ]
        };
        (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

        const expected = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.relationships",
              o: "exists",
              v: relationshipPresenceStates.selectedRelationship,
              t: "relationshipPresence"
            }
          ]
        });

        const result = serializeQueryTreeToURL({} as any);
        expect(result).toEqual(expected);
      });
    });

    it("Should use default values for missing value and type", () => {
      const mockJsonTree = {
        properties: { conjunction: "AND" },
        children1: [
          {
            properties: {
              field: "data.attributes.barcode",
              operator: "isEmpty",
              value: [], // No value
              valueType: [] // No type
            }
          }
        ]
      };
      (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

      const expected = JSON.stringify({
        c: "a",
        p: [
          {
            f: "data.attributes.barcode",
            o: "isEmpty",
            v: "",
            t: "text"
          }
        ]
      });

      const result = serializeQueryTreeToURL({} as any);
      expect(result).toEqual(expected);
    });

    it("Should return null if a rule is missing a field", () => {
      const mockJsonTree = {
        properties: { conjunction: "AND" },
        children1: [
          {
            properties: {
              // field is missing
              operator: "exactMatch",
              value: ["John"],
              valueType: ["text"]
            }
          }
        ]
      };
      (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

      const result = serializeQueryTreeToURL({} as any);
      expect(result).toBeNull();
    });

    it("Should return null if some rules have fields and others don't", () => {
      const mockJsonTree = {
        properties: { conjunction: "AND" },
        children1: [
          {
            properties: {
              field: "user.name",
              operator: "exactMatch",
              value: ["John"],
              valueType: ["text"]
            }
          },
          {
            properties: {
              // field is missing
              operator: "greater",
              value: [30],
              valueType: ["number"]
            }
          }
        ]
      };
      (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

      const result = serializeQueryTreeToURL({} as any);
      expect(result).toBeNull();
    });

    it("Should handle an empty query tree (no children)", () => {
      const mockJsonTree = {
        properties: { conjunction: "AND" },
        children1: []
      };
      (Utils.getTree as jest.Mock).mockReturnValue(mockJsonTree);

      const expected = JSON.stringify({
        c: "a",
        p: []
      });

      const result = serializeQueryTreeToURL({} as any);
      expect(result).toEqual(expected);
    });
  });

  describe("parseQueryTreeFromURL", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("Should parse a basic query string correctly", () => {
      // Setup mock for loadTree to return a mock ImmutableTree
      const mockImmutableTree = { id: "mock-tree-id" };
      (Utils.loadTree as jest.Mock).mockReturnValue(mockImmutableTree);

      const queryString = JSON.stringify({
        c: "a",
        p: [
          {
            f: "data.attributes.materialSampleName",
            o: "exactMatch",
            v: "Sample1",
            t: "text"
          }
        ]
      });

      const result = parseQueryTreeFromURL(queryString);

      // Verify loadTree was called with the correct JsonTree structure
      expect(Utils.loadTree).toHaveBeenCalledWith({
        id: "mock-uuid",
        type: "group",
        properties: {
          conjunction: "AND"
        },
        children1: [
          {
            id: "mock-uuid",
            type: "rule",
            properties: {
              field: "data.attributes.materialSampleName",
              operator: "exactMatch",
              value: ["Sample1"],
              valueSrc: ["value"],
              valueType: ["text"]
            }
          }
        ]
      });

      expect(result).toBe(mockImmutableTree);
    });

    it("Should parse a query string with multiple rules correctly", () => {
      // Setup mock for loadTree
      const mockImmutableTree = { id: "mock-tree-id" };
      (Utils.loadTree as jest.Mock).mockReturnValue(mockImmutableTree);

      const queryString = JSON.stringify({
        c: "o",
        p: [
          {
            f: "data.attributes.materialSampleName",
            o: "exactMatch",
            v: "Sample1",
            t: "text"
          },
          {
            f: "data.attributes.barcode",
            o: "wildcard",
            v: "barcode12345",
            t: "text"
          }
        ]
      });

      const result = parseQueryTreeFromURL(queryString);

      // Verify the structure passed to loadTree
      expect(Utils.loadTree).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "group",
          properties: {
            conjunction: "OR"
          },
          children1: expect.arrayContaining([
            expect.objectContaining({
              type: "rule",
              properties: {
                field: "data.attributes.materialSampleName",
                operator: "exactMatch",
                value: ["Sample1"],
                valueSrc: ["value"],
                valueType: ["text"]
              }
            }),
            expect.objectContaining({
              type: "rule",
              properties: {
                field: "data.attributes.barcode",
                operator: "wildcard",
                value: ["barcode12345"],
                valueSrc: ["value"],
                valueType: ["text"]
              }
            })
          ])
        })
      );

      expect(result).toBe(mockImmutableTree);
    });

    describe("Dynamic field parsing", () => {
      it("Should parse a query string with managed attributes correctly", () => {
        const mockImmutableTree = { id: "mock-complex-tree" };
        (Utils.loadTree as jest.Mock).mockReturnValue(mockImmutableTree);

        const queryString = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.attributes.managedAttributes",
              o: "equals",
              v: "test value",
              t: "managedAttribute",
              d: "0193e571-2d0c-7517-928d-2c19e04bf6cd"
            }
          ]
        });

        const result = parseQueryTreeFromURL(queryString);

        expect(Utils.loadTree).toHaveBeenCalledWith({
          children1: [
            {
              id: "mock-uuid",
              properties: {
                field: "data.attributes.managedAttributes",
                operator: "noOperator",
                value: [
                  '{"searchValue":"test value","selectedOperator":"equals","selectedType":"","preloadId":"0193e571-2d0c-7517-928d-2c19e04bf6cd"}'
                ],
                valueSrc: ["value"],
                valueType: ["managedAttribute"]
              },
              type: "rule"
            }
          ],
          id: "mock-uuid", // Mocked above.
          properties: {
            conjunction: "AND"
          },
          type: "group"
        });

        expect(result).toBe(mockImmutableTree);
      });

      it("Should parse a query string with field extensions correctly", () => {
        const mockImmutableTree = { id: "mock-complex-tree" };
        (Utils.loadTree as jest.Mock).mockReturnValue(mockImmutableTree);

        const queryString = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.attributes.extension",
              o: "contains",
              v: "Extension value",
              t: "fieldExtension",
              d: "package-test",
              d2: "field-test"
            }
          ]
        });

        const result = parseQueryTreeFromURL(queryString);

        expect(Utils.loadTree).toHaveBeenCalledWith({
          children1: [
            {
              id: "mock-uuid",
              properties: {
                field: "data.attributes.extension",
                operator: "noOperator",
                value: [
                  '{"searchValue":"Extension value","selectedOperator":"contains","selectedExtension":"package-test","selectedField":"field-test"}'
                ],
                valueSrc: ["value"],
                valueType: ["fieldExtension"]
              },
              type: "rule"
            }
          ],
          id: "mock-uuid", // Mocked above.
          properties: {
            conjunction: "AND"
          },
          type: "group"
        });

        expect(result).toBe(mockImmutableTree);
      });

      it("Should parse a query string with identifiers correctly", () => {
        const mockImmutableTree = { id: "mock-complex-tree" };
        (Utils.loadTree as jest.Mock).mockReturnValue(mockImmutableTree);

        const queryString = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.attributes.identifiers",
              o: "startswith",
              v: "ID123456",
              t: "identifier",
              d: "cc5b8bdc-52b8-41b7-ac5a-8e633034fb15"
            }
          ]
        });

        const result = parseQueryTreeFromURL(queryString);

        expect(Utils.loadTree).toHaveBeenCalledWith({
          children1: [
            {
              id: "mock-uuid",
              properties: {
                field: "data.attributes.identifiers",
                operator: "noOperator",
                value: [
                  '{"searchValue":"ID123456","selectedOperator":"startswith","selectedType":"","selectedIdentifier":{"id":"cc5b8bdc-52b8-41b7-ac5a-8e633034fb15","type":"identifier-type","vocabularyElementType":"STRING"}}'
                ],
                valueSrc: ["value"],
                valueType: ["identifier"]
              },
              type: "rule"
            }
          ],
          id: "mock-uuid", // Mocked above.
          properties: {
            conjunction: "AND"
          },
          type: "group"
        });

        expect(result).toBe(mockImmutableTree);
      });

      it("Should parse a query string with classifications correctly", () => {
        const mockImmutableTree = { id: "mock-complex-tree" };
        (Utils.loadTree as jest.Mock).mockReturnValue(mockImmutableTree);

        const queryString = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.attributes.classification",
              o: "exactMatch",
              v: "Mammalia",
              t: "classification",
              d: "class"
            }
          ]
        });

        const result = parseQueryTreeFromURL(queryString);

        expect(Utils.loadTree).toHaveBeenCalledWith({
          children1: [
            {
              id: "mock-uuid",
              properties: {
                field: "data.attributes.classification",
                operator: "noOperator",
                value: [
                  '{"searchValue":"Mammalia","selectedOperator":"exactMatch","selectedClassificationRank":"class"}'
                ],
                valueSrc: ["value"],
                valueType: ["classification"]
              },
              type: "rule"
            }
          ],
          id: "mock-uuid",
          properties: {
            conjunction: "AND"
          },
          type: "group"
        });

        expect(result).toBe(mockImmutableTree);
      });

      it("Should parse a query string with relationship presence correctly", () => {
        const mockImmutableTree = { id: "mock-complex-tree" };
        (Utils.loadTree as jest.Mock).mockReturnValue(mockImmutableTree);

        const queryString = JSON.stringify({
          c: "a",
          p: [
            {
              f: "data.relationships",
              o: "exists",
              v: "collecting-event",
              t: "relationshipPresence"
            }
          ]
        });

        const result = parseQueryTreeFromURL(queryString);

        expect(Utils.loadTree).toHaveBeenCalledWith({
          children1: [
            {
              id: "mock-uuid",
              properties: {
                field: "data.relationships",
                operator: "noOperator",
                value: [
                  '{"selectedValue":0,"selectedOperator":"exists","selectedRelationship":"collecting-event"}'
                ],
                valueSrc: ["value"],
                valueType: ["relationshipPresence"]
              },
              type: "rule"
            }
          ],
          id: "mock-uuid",
          properties: {
            conjunction: "AND"
          },
          type: "group"
        });

        expect(result).toBe(mockImmutableTree);
      });
    });

    it("Should return null if queryParam is undefined", () => {
      const result = parseQueryTreeFromURL(undefined);
      expect(result).toBeNull();
      expect(Utils.loadTree).not.toHaveBeenCalled();
    });

    it("Should return null if queryParam is an empty string", () => {
      const result = parseQueryTreeFromURL("");
      expect(result).toBeNull();
      expect(Utils.loadTree).not.toHaveBeenCalled();
    });
  });
});
