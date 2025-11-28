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
});
