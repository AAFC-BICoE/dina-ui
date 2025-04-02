import { Utils } from "react-awesome-query-builder";
import { parseQueryTreeFromURL, serializeQueryTreeToURL } from "../queryUtils";
import { ManagedAttributeSearchStates } from "../../query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";

// Mock the react-awesome-query-builder module
jest.mock("react-awesome-query-builder", () => ({
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

      expect(Utils.loadTree).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "group",
          properties: { conjunction: "AND" },
          children1: [
            expect.objectContaining({
              type: "rule",
              properties: {
                field: "data.attributes.managedAttributes",
                operator: "equals",
                value: "test value",
                valueSrc: ["value"],
                valueType: ["managedAttribute"]
              }
            })
          ]
        })
      );

      expect(result).toBe(mockImmutableTree);
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
