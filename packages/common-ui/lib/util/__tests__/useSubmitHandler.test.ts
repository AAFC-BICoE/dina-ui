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

  describe("Basic functionality", () => {
    it("Should create a new resource", async () => {
      mockSave.mockResolvedValueOnce([
        { id: "new-id", type: "person", attributes: { name: "John" } }
      ]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/api" }
        })
      );

      await result.current(createSubmitParams({ name: "John" }));

      expect(mockSave).toHaveBeenCalledWith(
        [{ resource: { name: "John", type: "person" }, type: "person" }],
        { apiBaseUrl: "/api" }
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
          saveOptions: { apiBaseUrl: "/api" }
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
          saveOptions: { apiBaseUrl: "/api" },
          onSuccess
        })
      );

      await result.current(createSubmitParams({ name: "John" }));

      expect(mockSave).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(original);
    });
  });

  describe("Managed Attributes - Single field", () => {
    it("Should include managedAttributes on create", async () => {
      mockSave.mockResolvedValueOnce([{ id: "s1", type: "sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "sample",
          saveOptions: { apiBaseUrl: "/api" }
        })
      );

      await result.current(
        createSubmitParams({
          name: "Sample",
          managedAttributes: { attr1: "value1" }
        })
      );

      expect(mockSave.mock.calls[0][0][0].resource).toEqual({
        name: "Sample",
        managedAttributes: { attr1: "value1" },
        type: "sample"
      });
    });

    it("Should handle managedAttributes changes on update", async () => {
      const original = {
        id: "s1",
        type: "sample",
        managedAttributes: { attr1: "old", attr2: "unchanged" }
      };

      mockSave.mockResolvedValueOnce([{ id: "s1", type: "sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "sample",
          saveOptions: { apiBaseUrl: "/api" }
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
        type: "sample",
        managedAttributes: { attr1: "value1", attr2: "value2" }
      };

      const deletedFields = new Set(["managedAttributes.attr2"]);
      mockSave.mockResolvedValueOnce([{ id: "s1", type: "sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "sample",
          saveOptions: { apiBaseUrl: "/api" },
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
  });

  describe("Managed Attributes - Multiple fields", () => {
    it("Should handle multiple managedAttribute fields", async () => {
      mockSave.mockResolvedValueOnce([{ id: "s1", type: "sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "sample",
          saveOptions: { apiBaseUrl: "/api" },
          managedAttributeFields: ["managedAttributes", "preparationManagedAttributes"]
        })
      );

      await result.current(
        createSubmitParams({
          name: "Sample",
          managedAttributes: { field1: "value1" },
          preparationManagedAttributes: { prepField1: "prepValue1" }
        })
      );

      const saved = mockSave.mock.calls[0][0][0].resource;
      expect(saved.managedAttributes).toEqual({ field1: "value1" });
      expect(saved.preparationManagedAttributes).toEqual({
        prepField1: "prepValue1"
      });
    });

    it("Should handle changes in multiple managedAttribute fields", async () => {
      const original = {
        id: "s1",
        type: "sample",
        managedAttributes: { field1: "old1", field2: "unchanged1" },
        preparationManagedAttributes: { prepField1: "oldPrep", prepField2: "unchanged2" }
      };

      mockSave.mockResolvedValueOnce([{ id: "s1", type: "sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "sample",
          saveOptions: { apiBaseUrl: "/api" },
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

    it("Should handle deletions in multiple managedAttribute fields", async () => {
      const original = {
        id: "s1",
        type: "sample",
        managedAttributes: { field1: "value1", field2: "value2" },
        preparationManagedAttributes: { prepField1: "prepValue1", prepField2: "prepValue2" }
      };

      const deletedFields = new Set([
        "managedAttributes.field2",
        "preparationManagedAttributes.prepField1"
      ]);

      mockSave.mockResolvedValueOnce([{ id: "s1", type: "sample" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "sample",
          saveOptions: { apiBaseUrl: "/api" },
          deletedManagedAttrFields: deletedFields,
          managedAttributeFields: ["managedAttributes", "preparationManagedAttributes"]
        })
      );

      await result.current(
        createSubmitParams({
          managedAttributes: { field1: "value1", field2: "value2" },
          preparationManagedAttributes: {
            prepField1: "prepValue1",
            prepField2: "prepValue2"
          }
        })
      );

      const saved = mockSave.mock.calls[0][0][0].resource;
      expect(saved.managedAttributes).toEqual({ field1: "value1" });
      expect(saved.managedAttributes.field2).toBeUndefined();
      expect(saved.preparationManagedAttributes).toEqual({ prepField2: "prepValue2" });
      expect(saved.preparationManagedAttributes.prepField1).toBeUndefined();
    });
  });

  describe("Transforms", () => {
    it("Should apply transforms before diffing", async () => {
      const transform = jest.fn(async (values) => ({
        ...values,
        transformed: "yes"
      }));

      mockSave.mockResolvedValueOnce([{ id: "id-1", type: "person" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/api" },
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
  });

  describe("Lifecycle hooks", () => {
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
          saveOptions: { apiBaseUrl: "/api" },
          beforeSave,
          onSuccess,
          afterSave
        })
      );

      await result.current(createSubmitParams({ name: "John" }));

      expect(callOrder).toEqual(["beforeSave", "save", "onSuccess", "afterSave"]);
    });
  });

  describe("Error handling", () => {
    it("Should re-throw errors from save", async () => {
      mockSave.mockRejectedValueOnce(new Error("Save failed"));

      const { result } = renderHook(() =>
        useSubmitHandler({
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/api" }
        })
      );

      await expect(
        result.current(createSubmitParams({ name: "John" }))
      ).rejects.toThrow("Save failed");
    });
  });

  describe("UUID handling", () => {
    it("Should use uuid if id is not present", async () => {
      const original = { uuid: "uuid-123", type: "person", name: "John" };

      mockSave.mockResolvedValueOnce([{ id: "uuid-123", type: "person" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/api" }
        })
      );

      await result.current(createSubmitParams({ name: "Jane" }));

      expect(mockSave.mock.calls[0][0][0].resource.id).toBe("uuid-123");
    });

    it("Should prefer id over uuid", async () => {
      const original = {
        id: "id-123",
        uuid: "uuid-456",
        type: "person",
        name: "John"
      };

      mockSave.mockResolvedValueOnce([{ id: "id-123", type: "person" }]);

      const { result } = renderHook(() =>
        useSubmitHandler({
          original,
          resourceType: "person",
          saveOptions: { apiBaseUrl: "/api" }
        })
      );

      await result.current(createSubmitParams({ name: "Jane" }));

      expect(mockSave.mock.calls[0][0][0].resource.id).toBe("id-123");
    });
  });

  describe("Relationship Mappings", () => {
    describe("SINGLE relationship type", () => {
      it("Should map a single relationship", async () => {
        const relationshipMappings = [
          {
            sourceAttribute: "collector",
            relationshipName: "collector",
            relationshipType: "SINGLE" as const,
            removeSourceAttribute: true
          }
        ];

        mockSave.mockResolvedValueOnce([
          {
            id: "event-1",
            type: "collecting-event",
            attributes: { startEventDateTime: "2024-01-01" }
          }
        ]);

        const { result } = renderHook(() =>
          useSubmitHandler({
            resourceType: "collecting-event",
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        await result.current(
          createSubmitParams({
            startEventDateTime: "2024-01-01",
            collector: { id: "person-123", type: "person" }
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        expect(savedCall.resource.relationships).toBeDefined();
        expect(savedCall.resource.relationships.collector).toEqual({
          data: [{ id: "person-123", type: "person" }]
        });
        // Source attribute should be removed
        expect(savedCall.resource.collector).toBeUndefined();
      });

      it("Should handle null/undefined single relationship", async () => {
        const relationshipMappings = [
          {
            sourceAttribute: "collector",
            relationshipName: "collector",
            relationshipType: "SINGLE" as const
          }
        ];

        mockSave.mockResolvedValueOnce([
          { id: "event-1", type: "collecting-event" }
        ]);

        const { result } = renderHook(() =>
          useSubmitHandler({
            resourceType: "collecting-event",
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        await result.current(
          createSubmitParams({
            startEventDateTime: "2024-01-01",
            collector: null
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        // Should not include empty relationships
        expect(savedCall.resource.relationships).toBeUndefined();
      });

      it("Should keep source attribute when removeSourceAttribute is false", async () => {
        const relationshipMappings = [
          {
            sourceAttribute: "collector",
            relationshipName: "collector",
            relationshipType: "SINGLE" as const,
            removeSourceAttribute: false
          }
        ];

        mockSave.mockResolvedValueOnce([
          { id: "event-1", type: "collecting-event" }
        ]);

        const { result } = renderHook(() =>
          useSubmitHandler({
            resourceType: "collecting-event",
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        const collectorValue = { id: "person-123", type: "person" };

        await result.current(
          createSubmitParams({
            startEventDateTime: "2024-01-01",
            collector: collectorValue
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        expect(savedCall.resource.collector).toEqual(collectorValue);
        expect(savedCall.resource.relationships.collector).toBeDefined();
      });
    });

    describe("ARRAY relationship type", () => {
      it("Should map an array relationship", async () => {
        const relationshipMappings = [
          {
            sourceAttribute: "protocols",
            relationshipName: "protocols",
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
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        await result.current(
          createSubmitParams({
            materialSampleName: "Sample 1",
            protocols: [
              { id: "protocol-1", type: "protocol" },
              { id: "protocol-2", type: "protocol" }
            ]
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        expect(savedCall.resource.relationships.protocols).toEqual({
          data: [
            { id: "protocol-1", type: "protocol" },
            { id: "protocol-2", type: "protocol" }
          ]
        });
        expect(savedCall.resource.protocols).toBeUndefined();
      });

      it("Should handle empty array relationship", async () => {
        const relationshipMappings = [
          {
            sourceAttribute: "protocols",
            relationshipName: "protocols",
            relationshipType: "ARRAY" as const
          }
        ];

        mockSave.mockResolvedValueOnce([
          { id: "sample-1", type: "material-sample" }
        ]);

        const { result } = renderHook(() =>
          useSubmitHandler({
            resourceType: "material-sample",
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        await result.current(
          createSubmitParams({
            materialSampleName: "Sample 1",
            protocols: []
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        // Empty arrays should not be included
        expect(savedCall.resource.relationships).toBeUndefined();
      });
    });

    describe("CUSTOM relationship type", () => {
      it("Should use custom relationship mapping function", async () => {
        const customMapping = jest.fn((value) => {
          // Custom logic: extract IDs from nested structure
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
            resourceType: "resource",
            saveOptions: { apiBaseUrl: "/api" },
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
    });

    describe("Multiple relationships", () => {
      it("Should handle multiple relationship mappings", async () => {
        const relationshipMappings = [
          {
            sourceAttribute: "collector",
            relationshipName: "collector",
            relationshipType: "SINGLE" as const,
            removeSourceAttribute: true
          },
          {
            sourceAttribute: "protocols",
            relationshipName: "protocols",
            relationshipType: "ARRAY" as const,
            removeSourceAttribute: true
          },
          {
            sourceAttribute: "parentMaterialSample",
            relationshipName: "parentMaterialSample",
            relationshipType: "SINGLE" as const,
            removeSourceAttribute: true
          }
        ];

        mockSave.mockResolvedValueOnce([
          { id: "sample-1", type: "material-sample" }
        ]);

        const { result } = renderHook(() =>
          useSubmitHandler({
            resourceType: "material-sample",
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        await result.current(
          createSubmitParams({
            materialSampleName: "Sample 1",
            collector: { id: "person-1", type: "person" },
            protocols: [
              { id: "protocol-1", type: "protocol" },
              { id: "protocol-2", type: "protocol" }
            ],
            parentMaterialSample: {
              id: "parent-sample-1",
              type: "material-sample"
            }
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        expect(savedCall.resource.relationships).toEqual({
          collector: { data: [{ id: "person-1", type: "person" }] },
          protocols: {
            data: [
              { id: "protocol-1", type: "protocol" },
              { id: "protocol-2", type: "protocol" }
            ]
          },
          parentMaterialSample: {
            data: [{ id: "parent-sample-1", type: "material-sample" }]
          }
        });
        // All source attributes should be removed
        expect(savedCall.resource.collector).toBeUndefined();
        expect(savedCall.resource.protocols).toBeUndefined();
        expect(savedCall.resource.parentMaterialSample).toBeUndefined();
      });
    });

    describe("Relationship diffing", () => {
      it("Should only include changed relationships", async () => {
        const original = {
          id: "sample-1",
          type: "material-sample",
          materialSampleName: "Sample 1",
          relationships: {
            collector: { data: [{ id: "person-1", type: "person" }] },
            protocols: {
              data: [{ id: "protocol-1", type: "protocol" }]
            }
          }
        };

        const relationshipMappings = [
          {
            sourceAttribute: "collector",
            relationshipName: "collector",
            relationshipType: "SINGLE" as const,
            removeSourceAttribute: true
          },
          {
            sourceAttribute: "protocols",
            relationshipName: "protocols",
            relationshipType: "ARRAY" as const,
            removeSourceAttribute: true
          }
        ];

        mockSave.mockResolvedValueOnce([{ id: "sample-1", type: "material-sample" }]);

        const { result } = renderHook(() =>
          useSubmitHandler({
            original,
            resourceType: "material-sample",
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        // Change only protocols, keep collector the same
        await result.current(
          createSubmitParams({
            materialSampleName: "Sample 1",
            collector: { id: "person-1", type: "person" }, // unchanged
            protocols: [
              { id: "protocol-1", type: "protocol" },
              { id: "protocol-2", type: "protocol" } // added protocol-2
            ]
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        // Should only include changed relationship (protocols)
        expect(savedCall.resource.relationships).toEqual({
          protocols: {
            data: [
              { id: "protocol-1", type: "protocol" },
              { id: "protocol-2", type: "protocol" }
            ]
          }
        });
        // Unchanged collector should not be included
        expect(savedCall.resource.relationships.collector).toBeUndefined();
      });

      it("Should detect removal of relationship", async () => {
        const original = {
          id: "event-1",
          type: "collecting-event",
          relationships: {
            collector: { data: [{ id: "person-1", type: "person" }] }
          }
        };

        const relationshipMappings = [
          {
            sourceAttribute: "collector",
            relationshipName: "collector",
            relationshipType: "SINGLE" as const,
            removeSourceAttribute: true
          }
        ];

        mockSave.mockResolvedValueOnce([
          { id: "event-1", type: "collecting-event" }
        ]);

        const { result } = renderHook(() =>
          useSubmitHandler({
            original,
            resourceType: "collecting-event",
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        // Remove collector
        await result.current(
          createSubmitParams({
            startEventDateTime: "2024-01-01",
            collector: null
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        // Should show empty relationship to indicate removal
        expect(savedCall.resource.relationships).toBeUndefined();
      });
    });

    describe("Relationships with attributes", () => {
      it("Should handle both attributes and relationships in same save", async () => {
        const relationshipMappings = [
          {
            sourceAttribute: "collector",
            relationshipName: "collector",
            relationshipType: "SINGLE" as const,
            removeSourceAttribute: true
          }
        ];

        mockSave.mockResolvedValueOnce([
          { id: "event-1", type: "collecting-event" }
        ]);

        const { result } = renderHook(() =>
          useSubmitHandler({
            resourceType: "collecting-event",
            saveOptions: { apiBaseUrl: "/api" },
            relationshipMappings
          })
        );

        await result.current(
          createSubmitParams({
            startEventDateTime: "2024-01-01",
            dwcVerbatimLocality: "Test Location",
            collector: { id: "person-1", type: "person" }
          })
        );

        const savedCall = mockSave.mock.calls[0][0][0];
        // Should have both attributes and relationships
        expect(savedCall.resource.startEventDateTime).toBe("2024-01-01");
        expect(savedCall.resource.dwcVerbatimLocality).toBe("Test Location");
        expect(savedCall.resource.relationships.collector).toBeDefined();
      });
    });

    describe("Nested Resources", () => {
      describe("Creating nested resources", () => {
        it("Should save new nested resources (no id)", async () => {
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

          // First call saves the nested resources (identifiers)
          mockSave.mockResolvedValueOnce([
            { id: "identifier-1", type: "identifier", namespace: "barcode", value: "123" },
            { id: "identifier-2", type: "identifier", namespace: "catalog", value: "ABC" }
          ]);

          // Second call saves the main resource (material-sample)
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
                { namespace: "barcode", value: "123" }, // no id = new
                { namespace: "catalog", value: "ABC" }  // no id = new
              ]
            })
          );

          // Check that nested resources were saved first
          expect(mockSave).toHaveBeenCalledTimes(2);
          
          const nestedSaveCall = mockSave.mock.calls[0];
          expect(nestedSaveCall[0]).toEqual([
            { resource: { namespace: "barcode", value: "123" }, type: "identifier" },
            { resource: { namespace: "catalog", value: "ABC" }, type: "identifier" }
          ]);
          expect(nestedSaveCall[1]).toEqual({
            apiBaseUrl: "/agent-api",
            skipOperationForSingleRequest: true
          });

          // Check that main resource was saved with the returned identifiers
          const mainSaveCall = mockSave.mock.calls[1];
          expect(mainSaveCall[0][0].resource.relationships.identifiers).toEqual({
            data: [
              { id: "identifier-1", type: "identifier" },
              { id: "identifier-2", type: "identifier" }
            ]
          });
        });
      });

      describe("Updating nested resources", () => {
        it("Should save only modified nested resources", async () => {
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

          // Save the modified nested resource
          mockSave.mockResolvedValueOnce([
            { id: "identifier-1", type: "identifier", namespace: "barcode", value: "999" }
          ]);

          // Save the main resource
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
                { id: "identifier-2", namespace: "catalog", value: "ABC" }  // unchanged
              ]
            })
          );

          // Should save only the modified nested resource
          const nestedSaveCall = mockSave.mock.calls[0];
          expect(nestedSaveCall[0]).toEqual([
            { resource: { id: "identifier-1", namespace: "barcode", value: "999" }, type: "identifier" }
          ]);

          // Main resource should have both identifiers in relationships
          const mainSaveCall = mockSave.mock.calls[1];
          expect(mainSaveCall[0][0].resource.relationships.identifiers.data).toHaveLength(2);
        });

        it("Should not save unchanged nested resources", async () => {
          const original = {
            id: "sample-1",
            type: "material-sample",
            identifiers: [
              { id: "identifier-1", namespace: "barcode", value: "123" }
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

          // Only save main resource (no nested resources to save)
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
                { id: "identifier-1", namespace: "barcode", value: "123" } // unchanged
              ]
            })
          );

          // Should only save main resource (no nested save needed)
          expect(mockSave).toHaveBeenCalledTimes(1);
        });
      });

      describe("Deleting nested resources", () => {
        it("Should delete removed nested resources", async () => {
          const original = {
            id: "sample-1",
            type: "material-sample",
            identifiers: [
              { id: "identifier-1", namespace: "barcode", value: "123" },
              { id: "identifier-2", namespace: "catalog", value: "ABC" },
              { id: "identifier-3", namespace: "other", value: "XYZ" }
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

          // Delete removed resources
          mockSave.mockResolvedValueOnce([]); // Delete returns nothing

          // Save main resource
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

          // Keep only identifier-1, remove identifier-2 and identifier-3
          await result.current(
            createSubmitParams({
              materialSampleName: "Sample 1",
              identifiers: [
                { id: "identifier-1", namespace: "barcode", value: "123" }
              ]
            })
          );

          // Should call delete for removed resources
          const deleteCall = mockSave.mock.calls[0];
          expect(deleteCall[0]).toEqual([
            { delete: { id: "identifier-2", namespace: "catalog", value: "ABC" } },
            { delete: { id: "identifier-3", namespace: "other", value: "XYZ" } }
          ]);
          expect(deleteCall[1]).toEqual({ apiBaseUrl: "/agent-api" });
        });
      });

      describe("Complex nested resource scenarios", () => {
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

          // Save new and modified resources
          mockSave.mockResolvedValueOnce([
            { id: "identifier-3", type: "identifier", namespace: "new", value: "NEW" }, // new
            { id: "identifier-1", type: "identifier", namespace: "barcode", value: "999" } // modified
          ]);

          // Delete removed resource
          mockSave.mockResolvedValueOnce([]);

          // Save main resource
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
                { namespace: "new", value: "NEW" } // new (no id)
                // identifier-2 removed
              ]
            })
          );

          expect(mockSave).toHaveBeenCalledTimes(3);

          // Check save call for new + modified
          const saveCall = mockSave.mock.calls[0];
          expect(saveCall[0]).toHaveLength(2);
          expect(saveCall[0][0].resource).toEqual({ namespace: "new", value: "NEW" });
          expect(saveCall[0][1].resource).toEqual({ id: "identifier-1", namespace: "barcode", value: "999" });

          // Check delete call
          const deleteCall = mockSave.mock.calls[1];
          expect(deleteCall[0]).toEqual([
            { delete: { id: "identifier-2", namespace: "catalog", value: "ABC" } }
          ]);

          // Check main resource has all identifiers
          const mainCall = mockSave.mock.calls[2];
          expect(mainCall[0][0].resource.relationships.identifiers.data).toHaveLength(2);
        });

        it("Should use custom isModified function", async () => {
          const original = {
            id: "sample-1",
            type: "material-sample",
            identifiers: [
              { id: "identifier-1", namespace: "barcode", value: "123", metadata: { updated: "2024-01-01" } }
            ]
          };

          const customIsModified = jest.fn((orig, curr) => {
            // Only consider it modified if the value changed, ignore metadata
            return orig.value !== curr.value;
          });

          const relationshipMappings = [
            {
              sourceAttribute: "identifiers",
              relationshipName: "identifiers",
              relationshipType: "ARRAY" as const,
              removeSourceAttribute: true,
              nestedResource: {
                resourceType: "identifier",
                apiBaseUrl: "/agent-api",
                isModified: customIsModified
              }
            }
          ];

          // Only save main resource (nested resource not considered modified)
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
                // Same value but different metadata
                { id: "identifier-1", namespace: "barcode", value: "123", metadata: { updated: "2024-12-01" } }
              ]
            })
          );

          // Custom function should be called
          expect(customIsModified).toHaveBeenCalled();

          // Should not save nested resource (not modified according to custom function)
          expect(mockSave).toHaveBeenCalledTimes(1);
        });

        it("Should handle empty nested resources array", async () => {
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
              identifiers: [] // empty array
            })
          );

          // Should only save main resource
          expect(mockSave).toHaveBeenCalledTimes(1);
        });

        it("Should delete all nested resources when going from some to none", async () => {
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

          // Delete all identifiers
          mockSave.mockResolvedValueOnce([]);

          // Save main resource
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
              identifiers: [] // remove all
            })
          );

          // Should delete both identifiers
          const deleteCall = mockSave.mock.calls[0];
          expect(deleteCall[0]).toEqual([
            { delete: { id: "identifier-1", namespace: "barcode", value: "123" } },
            { delete: { id: "identifier-2", namespace: "catalog", value: "ABC" } }
          ]);
        });
      });

      describe("Nested resources with other features", () => {
        it("Should handle nested resources + regular relationships", async () => {
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
            },
            {
              sourceAttribute: "collector",
              relationshipName: "collector",
              relationshipType: "SINGLE" as const,
              removeSourceAttribute: true
            }
          ];

          // Save new identifier
          mockSave.mockResolvedValueOnce([
            { id: "identifier-1", type: "identifier", namespace: "barcode", value: "123" }
          ]);

          // Save main resource
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
                { namespace: "barcode", value: "123" }
              ],
              collector: { id: "person-1", type: "person" }
            })
          );

          // Main resource should have both relationship types
          const mainCall = mockSave.mock.calls[1];
          expect(mainCall[0][0].resource.relationships).toEqual({
            identifiers: {
              data: [{ id: "identifier-1", type: "identifier" }]
            },
            collector: {
              data: [{ id: "person-1", type: "person" }]
            }
          });
        });

        it("Should handle nested resources + managed attributes", async () => {
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

          // Save identifier
          mockSave.mockResolvedValueOnce([
            { id: "identifier-1", type: "identifier", namespace: "barcode", value: "123" }
          ]);

          // Save main resource
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
                { namespace: "barcode", value: "123" }
              ],
              managedAttributes: {
                customField: "customValue"
              }
            })
          );

          // Should have both managed attributes and nested resource relationship
          const mainCall = mockSave.mock.calls[1];
          expect(mainCall[0][0].resource.managedAttributes).toEqual({
            customField: "customValue"
          });
          expect(mainCall[0][0].resource.relationships.identifiers).toBeDefined();
        });
      });
    });
  });
});
