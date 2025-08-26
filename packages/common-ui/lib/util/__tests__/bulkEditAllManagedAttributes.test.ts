import { bulkEditAllManagedAttributes } from "../bulkEditAllManagedAttributes";

describe("bulkEditAllManagedAttributes", () => {
  describe("Edit all value change, override the value for all samples", () => {
    const editAll = { key1: "new value" };
    const clearAll: string[] = [];
    const deleteAll: string[] = [];

    it("Sample 1 - With value 1", () => {
      const sample = { key1: "old value 1" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: "new value"
      });
    });

    it("Sample 2 - With value 2", () => {
      const sample = { key1: "old value 2" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: "new value"
      });
    });

    it("Sample 3 - With no value", () => {
      const sample = {};
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: "new value"
      });
    });
  });

  describe("Delete a managed attribute from all samples", () => {
    const editAll = { key1: "", key2: "new 2" };
    const clearAll: string[] = [];
    const deleteAll = ["key2", "key3"]; // force-delete key2 & key3

    it("Sample 1 – sample contains key1 + key2 + key3", () => {
      const sample = { key1: "value1", key2: "value2", key3: "value3" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({ key1: "value1" }); // key2 & key3 removed
    });

    it("Sample 2 – sample contains only key3", () => {
      const sample = { key3: "value3" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({}); // key3 removed, nothing left
    });

    it("Sample 3 – sample contains unrelated key", () => {
      const sample = { other: "x" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({ other: "x" });
    });
  });

  describe("Mixed overwrite/keep", () => {
    const editAll = { key1: "new value", key2: "", key3: "" };
    const clearAll: string[] = [];
    const deleteAll: string[] = [];

    it("Sample 1 - with key1 and key2", () => {
      const sample = { key1: "old value 1", key2: "value2" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: "new value",
        key2: "value2"
      });
    });

    it("Sample 2 - key1 and key3", () => {
      const sample = { key1: "old value 2", key3: "value3" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: "new value",
        key3: "value3"
      });
    });

    it("Sample 3 - With no values", () => {
      const sample = {};
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: "new value"
      });
    });
  });

  describe("clearAll functionality", () => {
    const editAll = { key1: "", key2: "", key3: "" };
    const clearAll = ["key1"]; // force-clear key1
    const deleteAll: string[] = [];

    it("Sample 1 - with key1 and key2 (key1 cleared)", () => {
      const sample = { key1: "old value 1", key2: "value2" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: "",
        key2: "value2"
      });
    });

    it("Sample 2 - with key1 and key3 (key1 cleared)", () => {
      const sample = { key1: "old value 2", key3: "value3" };
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: "",
        key3: "value3"
      });
    });

    it("Sample 3 - With no values", () => {
      const sample = {};
      expect(
        bulkEditAllManagedAttributes(editAll, sample, clearAll, deleteAll)
      ).toEqual({
        key1: ""
      });
    });
  });
});
