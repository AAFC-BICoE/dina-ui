import { bulkEditAllManagedAttributes } from "../bulkEditAllManagedAttributes";

describe("bulkEditAllManagedAttributes", () => {
  describe("Edit all value change, override the value for all samples", () => {
    const editAll = { key1: "new value" };
    const clearAll: string[] = [];

    it("Sample 1 - With value 1", () => {
      const sample = { key1: "old value 1" };
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "new value"
      });
    });

    it("Sample 2 - With value 2", () => {
      const sample = { key1: "old value 2" };
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "new value"
      });
    });

    it("Sample 3 - With no value", () => {
      const sample = {};
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "new value"
      });
    });
  });

  describe("Delete managed attributes from the edit all, remove from all.", () => {
    const editAll = { key1: "" }; // keep key1 unchanged
    const clearAll: string[] = [];

    it("Sample 1 - With value 1", () => {
      const sample = { key1: "old value 1", key2: "value2" };
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "old value 1"
      });
    });

    it("Sample 2 - With value 2", () => {
      const sample = { key1: "old value 2", key3: "value3" };
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "old value 2"
      });
    });

    it("Sample 3 - With no values", () => {
      const sample = {};
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual(
        {}
      );
    });
  });

  describe("Mixed overwrite/keep", () => {
    const editAll = { key1: "new value", key2: "", key3: "" };
    const clearAll: string[] = [];

    it("Sample 1 - with key1 and key2", () => {
      const sample = { key1: "old value 1", key2: "value2" };
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "new value",
        key2: "value2"
      });
    });

    it("Sample 2 - key1 and key3", () => {
      const sample = { key1: "old value 2", key3: "value3" };
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "new value",
        key3: "value3"
      });
    });

    it("Sample 3 - With no values", () => {
      const sample = {};
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "new value"
      });
    });
  });

  describe("clearAll functionality", () => {
    const editAll = { key1: "", key2: "", key3: "" };
    const clearAll = ["key1"]; // force-clear key1

    it("Sample 1 - with key1 and key2 (key1 cleared)", () => {
      const sample = { key1: "old value 1", key2: "value2" };
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "",
        key2: "value2"
      });
    });

    it("Sample 2 - with key1 and key3 (key1 cleared)", () => {
      const sample = { key1: "old value 2", key3: "value3" };
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: "",
        key3: "value3"
      });
    });

    it("Sample 3 - With no values", () => {
      const sample = {};
      expect(bulkEditAllManagedAttributes(editAll, sample, clearAll)).toEqual({
        key1: ""
      });
    });
  });
});
