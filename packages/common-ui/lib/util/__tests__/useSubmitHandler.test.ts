import { renderHook } from "@testing-library/react";
import { useSubmitHandler } from "../useSubmitHandler";

const mockSave = jest.fn();
const mockApiClient = { save: mockSave } as any;
const mockFormik = {} as any;
const mockAccount = {} as any;

// Helper to create submit params
const createSubmitParams = (submittedValues: any) => ({
  submittedValues,
  api: mockApiClient,
  formik: mockFormik,
  account: mockAccount
});

describe("useSubmitHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic CRUD operations", () => {
    it("Should create a new resource", async () => {
      mockSave.mockResolvedValueOnce([
        { id: "new-id", type: "person", attributes: { name: "John" } }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/agent-api" }
        })
      );

      await result.current(createSubmitParams({ name: "John" }));

      expect(mockSave).toHaveBeenCalledWith(
        [{ resource: { name: "John", type: "person" }, type: "person" }],
        { apiBaseUrl: "/agent-api" }
      );
    });

    it("Should only send changed fields on update", async () => {
      const original = {
        id: "id-1",
        type: "person",
        name: "John",
        email: "john@example.com"
      };

      mockSave.mockResolvedValueOnce([
        { id: "id-1", type: "person", attributes: { email: "new@example.com" } }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/agent-api" }
        })
      );

      await result.current(
        createSubmitParams({ name: "John", email: "new@example.com" })
      );

      const savedCall = mockSave.mock.calls[0][0][0];
      expect(savedCall.resource).toEqual({
        id: "id-1",
        email: "new@example.com",
        type: "person"
      });
      expect(savedCall.resource.name).toBeUndefined();
    });

    it("Should not save if nothing changed", async () => {
      const original = { id: "id-1", type: "person", name: "John" };
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/agent-api" },
          onSuccess
        })
      );

      await result.current(createSubmitParams({ name: "John" }));

      expect(mockSave).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(original);
    });
  });

  describe("Managed Attributes", () => {
    it("Should handle managedAttributes changes on update", async () => {
      const original = {
        id: "s1",
        type: "material-sample",
        managedAttributes: { attr1: "old", attr2: "unchanged" }
      };

      mockSave.mockResolvedValueOnce([{ id: "s1", type: "material-sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "material-sample",
          saveOptions: { apiBaseUrl: "/collection-api" }
        })
      );

      await result.current(
        createSubmitParams({
          managedAttributes: { attr1: "new", attr2: "unchanged" }
        })
      );

      expect(mockSave.mock.calls[0][0][0].resource.managedAttributes).toEqual({
        attr1: "new",
        attr2: "unchanged"
      });
    });

    it("Should handle deleted managedAttributes", async () => {
      const original = {
        id: "s1",
        type: "material-sample",
        managedAttributes: { attr1: "value1", attr2: "value2" }
      };

      const deletedFields = new Set(["managedAttributes.attr2"]);
      mockSave.mockResolvedValueOnce([{ id: "s1", type: "material-sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "material-sample",
          saveOptions: { apiBaseUrl: "/collection-api" },
          deletedManagedAttrFields: deletedFields
        })
      );

      await result.current(
        createSubmitParams({
          managedAttributes: { attr1: "value1", attr2: "value2" }
        })
      );

      const savedAttrs = mockSave.mock.calls[0][0][0].resource.managedAttributes;
      expect(savedAttrs).toEqual({ attr1: "value1" });
      expect(savedAttrs.attr2).toBeUndefined();
    });

    it("Should handle multiple managedAttribute fields", async () => {
      const original = {
        id: "s1",
        type: "material-sample",
        managedAttributes: { field1: "old1", field2: "unchanged1" },
        preparationManagedAttributes: { prepField1: "oldPrep", prepField2: "unchanged2" }
      };

      mockSave.mockResolvedValueOnce([{ id: "s1", type: "material-sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "material-sample",
          saveOptions: { apiBaseUrl: "/collection-api" },
          managedAttributeFields: ["managedAttributes", "preparationManagedAttributes"]
        })
      );

      await result.current(
        createSubmitParams({
          managedAttributes: { field1: "new1", field2: "unchanged1" },
          preparationManagedAttributes: {
            prepField1: "newPrep",
            prepField2: "unchanged2"
          }
        })
      );

      const saved = mockSave.mock.calls[0][0][0].resource;
      expect(saved.managedAttributes).toEqual({
        field1: "new1",
        field2: "unchanged1"
      });
      expect(saved.preparationManagedAttributes).toEqual({
        prepField1: "newPrep",
        prepField2: "unchanged2"
      });
    });
  });

  describe("Transforms and Lifecycle hooks", () => {
    it("Should apply transforms before diffing", async () => {
      const transform = jest.fn(async (values) => ({
        ...values,
        transformed: "yes"
      }));

      mockSave.mockResolvedValueOnce([{ id: "id-1", type: "person" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/agent-api" },
          transforms: [transform]
        })
      );

      await result.current(createSubmitParams({ name: "John" }));

      expect(transform).toHaveBeenCalledWith({ name: "John" }, mockApiClient);
      expect(mockSave.mock.calls[0][0][0].resource).toEqual({
        name: "John",
        transformed: "yes",
        type: "person"
      });
    });

    it("Should call hooks in correct order", async () => {
      const callOrder: string[] = [];

      const beforeSave = jest.fn(async () => { callOrder.push("beforeSave"); });
      const onSuccess = jest.fn(async () => { callOrder.push("onSuccess"); });
      const afterSave = jest.fn(async () => { callOrder.push("afterSave"); });

      mockSave.mockImplementation(async () => {
        callOrder.push("save");
        return [{ id: "id-1", type: "person" }];
      });

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/agent-api" },
          beforeSave,
          onSuccess,
          afterSave
        })
      );

      await result.current(createSubmitParams({ name: "John" }));

      expect(callOrder).toEqual(["beforeSave", "save", "onSuccess", "afterSave"]);
    });

    it("Should re-throw errors from save", async () => {
      mockSave.mockRejectedValueOnce(new Error("Save failed"));

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/agent-api" }
        })
      );

      await expect(
        result.current(createSubmitParams({ name: "John" }))
      ).rejects.toThrow("Save failed");
    });
  });

  describe("Relationship Mappings", () => {
    it("Should map SINGLE relationship", async () => {
      const relationshipMappings = [
        {
          sourceAttribute: "collectingEvent",
          relationshipName: "collectingEvent",
          relationshipType: "SINGLE" as const,
          removeSourceAttribute: true
        }
      ];

      mockSave.mockResolvedValueOnce([
        {
          id: "sample-1",
          type: "material-sample",
          attributes: { materialSampleName: "Sample 1" }
        }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "material-sample",
          saveOptions: { apiBaseUrl: "/collection-api" },
          relationshipMappings
        })
      );

      await result.current(
        createSubmitParams({
          materialSampleName: "Sample 1",
          collectingEvent: { id: "event-123", type: "collecting-event" }
        })
      );

      const savedCall = mockSave.mock.calls[0][0][0];
      expect(savedCall.resource.relationships.collectingEvent).toEqual({
        data: [{ id: "event-123", type: "collecting-event" }]
      });
      expect(savedCall.resource.collectingEvent).toBeUndefined();
    });

    it("Should map ARRAY relationship", async () => {
      const relationshipMappings = [
        {
          sourceAttribute: "preparationProtocol",
          relationshipName: "preparationProtocol",
          relationshipType: "ARRAY" as const,
          removeSourceAttribute: true
        }
      ];

      mockSave.mockResolvedValueOnce([
        { id: "sample-1", type: "material-sample" }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "material-sample",
          saveOptions: { apiBaseUrl: "/collection-api" },
          relationshipMappings
        })
      );

      await result.current(
        createSubmitParams({
          materialSampleName: "Sample 1",
          preparationProtocol: [
            { id: "protocol-1", type: "protocol" },
            { id: "protocol-2", type: "protocol" }
          ]
        })
      );

      const savedCall = mockSave.mock.calls[0][0][0];
      expect(savedCall.resource.relationships.preparationProtocol).toEqual({
        data: [
          { id: "protocol-1", type: "protocol" },
          { id: "protocol-2", type: "protocol" }
        ]
      });
      expect(savedCall.resource.preparationProtocol).toBeUndefined();
    });

    it("Should use CUSTOM relationship mapping function", async () => {
      const customMapping = jest.fn((value) => {
        return value.items.map((item: any) => ({
          id: item.resourceId,
          type: item.resourceType
        }));
      });

      const relationshipMappings = [
        {
          sourceAttribute: "customField",
          relationshipName: "relatedResources",
          relationshipType: "CUSTOM" as const,
          customRelationshipMapping: customMapping,
          removeSourceAttribute: true
        }
      ];

      mockSave.mockResolvedValueOnce([{ id: "res-1", type: "resource" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "any-resource",
          saveOptions: { apiBaseUrl: "/any-api" },
          relationshipMappings
        })
      );

      const customValue = {
        items: [
          { resourceId: "r1", resourceType: "type1" },
          { resourceId: "r2", resourceType: "type2" }
        ]
      };

      await result.current(
        createSubmitParams({
          name: "Test",
          customField: customValue
        })
      );

      expect(customMapping).toHaveBeenCalledWith(customValue);
      const savedCall = mockSave.mock.calls[0][0][0];
      expect(savedCall.resource.relationships.relatedResources).toEqual({
        data: [
          { id: "r1", type: "type1" },
          { id: "r2", type: "type2" }
        ]
      });
    });

    it("Should only include changed relationships on update", async () => {
      const original = {
        id: "sample-1",
        type: "material-sample",
        materialSampleName: "Sample 1",
        relationships: {
          collectingEvent: { data: [{ id: "event-1", type: "collecting-event" }] },
          preparationProtocol: {
            data: [{ id: "protocol-1", type: "protocol" }]
          }
        }
      };

      const relationshipMappings = [
        {
          sourceAttribute: "collectingEvent",
          relationshipName: "collectingEvent",
          relationshipType: "SINGLE" as const,
          removeSourceAttribute: true
        },
        {
          sourceAttribute: "preparationProtocol",
          relationshipName: "preparationProtocol",
          relationshipType: "ARRAY" as const,
          removeSourceAttribute: true
        }
      ];

      mockSave.mockResolvedValueOnce([{ id: "sample-1", type: "material-sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "material-sample",
          saveOptions: { apiBaseUrl: "/collection-api" },
          relationshipMappings
        })
      );

      // Change only preparationProtocol, keep collectingEvent the same
      await result.current(
        createSubmitParams({
          materialSampleName: "Sample 1",
          collectingEvent: { id: "event-1", type: "collecting-event" },
          preparationProtocol: [
            { id: "protocol-1", type: "protocol" },
            { id: "protocol-2", type: "protocol" }
          ]
        })
      );

      const savedCall = mockSave.mock.calls[0][0][0];
      // Should only include changed relationship (preparationProtocol)
      expect(savedCall.resource.relationships).toEqual({
        preparationProtocol: {
          data: [
            { id: "protocol-1", type: "protocol" },
            { id: "protocol-2", type: "protocol" }
          ]
        }
      });
      expect(savedCall.resource.relationships.collectingEvent).toBeUndefined();
    });
  });

  describe("Nested Resources", () => {
    it("Should create new nested resources", async () => {
      const relationshipMappings = [
        {
          sourceAttribute: "identifiers",
          relationshipName: "identifiers",
          relationshipType: "ARRAY" as const,
          removeSourceAttribute: true,
          nestedResource: {
            resourceType: "identifier",
            apiBaseUrl: "/agent-api"
          }
        }
      ];

      // First call saves the nested resources
      mockSave.mockResolvedValueOnce([
        { id: "identifier-1", type: "identifier", namespace: "barcode", value: "123" },
        { id: "identifier-2", type: "identifier", namespace: "catalog", value: "ABC" }
      ]);

      // Second call saves the main resource
      mockSave.mockResolvedValueOnce([
        { id: "sample-1", type: "material-sample" }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "material-sample",
          saveOptions: { apiBaseUrl: "/collection-api" },
          relationshipMappings
        })
      );

      await result.current(
        createSubmitParams({
          materialSampleName: "Sample 1",
          identifiers: [
            { namespace: "barcode", value: "123" },
            { namespace: "catalog", value: "ABC" }
          ]
        })
      );

      expect(mockSave).toHaveBeenCalledTimes(2);

      // Check nested resources were saved first
      const nestedSaveCall = mockSave.mock.calls[0];
      expect(nestedSaveCall[0]).toEqual([
        { resource: { namespace: "barcode", value: "123" }, type: "identifier" },
        { resource: { namespace: "catalog", value: "ABC" }, type: "identifier" }
      ]);

      // Check main resource was saved with returned identifiers
      const mainSaveCall = mockSave.mock.calls[1];
      expect(mainSaveCall[0][0].resource.relationships.identifiers).toEqual({
        data: [
          { id: "identifier-1", type: "identifier" },
          { id: "identifier-2", type: "identifier" }
        ]
      });
    });

    it("Should update modified nested resources", async () => {
      const original = {
        id: "person-1",
        type: "person",
        identifiers: [
          { id: "identifier-1", namespace: "barcode", value: "123" },
          { id: "identifier-2", namespace: "catalog", value: "ABC" }
        ]
      };

      const relationshipMappings = [
        {
          sourceAttribute: "identifiers",
          relationshipName: "identifiers",
          relationshipType: "ARRAY" as const,
          removeSourceAttribute: true,
          nestedResource: {
            resourceType: "identifier",
            apiBaseUrl: "/agent-api"
          }
        }
      ];

      mockSave.mockResolvedValueOnce([
        { id: "identifier-1", type: "identifier", namespace: "barcode", value: "999" }
      ]);

      mockSave.mockResolvedValueOnce([
        { id: "person-1", type: "person" }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/agent-api" },
          relationshipMappings
        })
      );

      await result.current(
        createSubmitParams({
          personName: "Person 1",
          identifiers: [
            { id: "identifier-1", namespace: "barcode", value: "999" },
            { id: "identifier-2", namespace: "catalog", value: "ABC" }
          ]
        })
      );

      // Should save only the modified nested resource
      const nestedSaveCall = mockSave.mock.calls[0];
      expect(nestedSaveCall[0]).toEqual([
        { resource: { id: "identifier-1", namespace: "barcode", value: "999" }, type: "identifier" }
      ]);
    });

    it("Should delete removed nested resources", async () => {
      const original = {
        id: "person-1",
        type: "person",
        identifiers: [
          { id: "identifier-1", namespace: "barcode", value: "123" },
          { id: "identifier-2", namespace: "catalog", value: "ABC" }
        ]
      };

      const relationshipMappings = [
        {
          sourceAttribute: "identifiers",
          relationshipName: "identifiers",
          relationshipType: "ARRAY" as const,
          removeSourceAttribute: true,
          nestedResource: {
            resourceType: "identifier",
            apiBaseUrl: "/agent-api"
          }
        }
      ];

      mockSave.mockResolvedValueOnce([]);
      mockSave.mockResolvedValueOnce([
        { id: "person-1", type: "person" }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/agent-api" },
          relationshipMappings
        })
      );

      // Keep only identifier-1, remove identifier-2
      await result.current(
        createSubmitParams({
          personName: "Person 1",
          identifiers: [
            { id: "identifier-1", namespace: "barcode", value: "123" }
          ]
        })
      );

      // Should call delete for removed resource
      const deleteCall = mockSave.mock.calls[0];
      expect(deleteCall[0]).toEqual([
        { delete: { id: "identifier-2", namespace: "catalog", value: "ABC" } }
      ]);
    });

    it("Should handle create, update, and delete simultaneously", async () => {
      const original = {
        id: "sample-1",
        type: "material-sample",
        identifiers: [
          { id: "identifier-1", namespace: "barcode", value: "123" },
          { id: "identifier-2", namespace: "catalog", value: "ABC" }
        ]
      };

      const relationshipMappings = [
        {
          sourceAttribute: "identifiers",
          relationshipName: "identifiers",
          relationshipType: "ARRAY" as const,
          removeSourceAttribute: true,
          nestedResource: {
            resourceType: "identifier",
            apiBaseUrl: "/agent-api"
          }
        }
      ];

      mockSave.mockResolvedValueOnce([
        { id: "identifier-3", type: "identifier", namespace: "new", value: "NEW" },
        { id: "identifier-1", type: "identifier", namespace: "barcode", value: "999" }
      ]);

      mockSave.mockResolvedValueOnce([]);

      mockSave.mockResolvedValueOnce([
        { id: "sample-1", type: "material-sample" }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "material-sample",
          saveOptions: { apiBaseUrl: "/collection-api" },
          relationshipMappings
        })
      );

      await result.current(
        createSubmitParams({
          materialSampleName: "Sample 1",
          identifiers: [
            { id: "identifier-1", namespace: "barcode", value: "999" }, // modified
            { namespace: "new", value: "NEW" }
          ]
        })
      );

      expect(mockSave).toHaveBeenCalledTimes(3);

      // Check save call for new + modified
      const saveCall = mockSave.mock.calls[0];
      expect(saveCall[0]).toHaveLength(2);

      // Check delete call
      const deleteCall = mockSave.mock.calls[1];
      expect(deleteCall[0]).toEqual([
        { delete: { id: "identifier-2", namespace: "catalog", value: "ABC" } }
      ]);
    });
  });
});
