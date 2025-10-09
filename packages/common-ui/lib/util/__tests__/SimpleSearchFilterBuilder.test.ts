import { ManagedAttribute } from "packages/dina-ui/types/collection-api";
import { SimpleSearchFilterBuilder } from "../simpleSearchFilterBuilder";

describe("SimpleSearchFilterBuilder", () => {
  it("should create a new instance using the static create method", () => {
    const builder = SimpleSearchFilterBuilder.create<ManagedAttribute>();
    expect(builder).toBeInstanceOf(SimpleSearchFilterBuilder);
  });

  it("should return an empty object when no filters are applied", () => {
    const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>().build();
    expect(filter).toEqual({});
  });

  describe(".add()", () => {
    it("should add a simple filter object", () => {
      const existingFilter = { key: { EQ: "barcode" } };
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .add(existingFilter)
        .build();
      expect(filter).toEqual({ key: { EQ: "barcode" } });
    });

    it("should add multiple filters from a filter object", () => {
      const existingFilters = {
        key: { EQ: "barcode" },
        name: { ILIKE: "%test%" },
        group: { IN: "group1,group2" }
      };
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .add(existingFilters)
        .build();
      expect(filter).toEqual({
        key: { EQ: "barcode" },
        name: { ILIKE: "%test%" },
        group: { IN: "group1,group2" }
      });
    });

    it("should merge with existing filters built using other methods", () => {
      const existingFilters = { group: { EQ: "aafc" } };
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .where("key", "EQ", "barcode")
        .add(existingFilters)
        .searchFilter("name", "test")
        .build();
      expect(filter).toEqual({
        key: { EQ: "barcode" },
        group: { EQ: "aafc" },
        name: { ILIKE: "%test%" }
      });
    });
  });

  describe(".where()", () => {
    it("should add a simple EQ filter", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .where("key", "EQ", "ocr")
        .build();
      expect(filter).toEqual({ key: { EQ: "ocr" } });
    });

    it("should add an ILIKE filter", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .where("name", "ILIKE", "%barcode%")
        .build();
      expect(filter).toEqual({ name: { ILIKE: "%barcode%" } });
    });

    it("should add a GT (greater than) filter", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .where("id", "GT", "18")
        .build();
      expect(filter).toEqual({ id: { GT: "18" } });
    });

    it("should add a IN (list) filter", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .where("group", "IN", ["group1", "group2", "group3"])
        .build();
      expect(filter).toEqual({ group: { IN: "group1,group2,group3" } });
    });

    it("should allow chaining multiple .where() calls", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .where("key", "EQ", "test")
        .where("group", "EQ", "aafc")
        .build();
      expect(filter).toEqual({
        key: { EQ: "test" },
        group: { EQ: "aafc" }
      });
    });
  });

  describe(".whereProvided()", () => {
    it("should add a filter when a valid value is provided", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .whereProvided("key", "EQ", "barcode")
        .build();
      expect(filter).toEqual({ key: { EQ: "barcode" } });
    });

    it("should not add a filter when the value is an empty string", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .whereProvided("key", "EQ", "")
        .build();
      expect(filter).toEqual({});
    });

    it("should not add a filter when the value is null", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .whereProvided("key", "EQ", null as any)
        .build();
      expect(filter).toEqual({});
    });

    it("should not add a filter when the value is undefined", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .whereProvided("key", "EQ", undefined as any)
        .build();
      expect(filter).toEqual({});
    });
  });

  describe(".whereIn()", () => {
    it("should add an IN filter when values are provided", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .whereIn("group", ["group1", "group2"])
        .build();
      expect(filter).toEqual({ group: { IN: "group1,group2" } });
    });

    it("should add an IN filter when one value is provided", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .whereIn("group", ["group1"])
        .build();
      expect(filter).toEqual({ group: { IN: "group1" } });
    });

    it("should not add a filter when the values array is empty", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .whereIn("group", [])
        .build();
      expect(filter).toEqual({});
    });

    it("should not add a filter when the values are undefined", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .whereIn("group", undefined)
        .build();
      expect(filter).toEqual({});
    });
  });

  describe(".searchFilter()", () => {
    it("should add an ILIKE filter when a valid value is provided", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .searchFilter("name", "barcode")
        .build();

      expect(filter).toEqual({
        name: { ILIKE: "%barcode%" }
      });
    });

    it("should not add a filter when the value is an empty string", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .searchFilter("name", "")
        .build();

      expect(filter).toEqual({});
    });

    it("should not add a filter when the value is null", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .searchFilter("name", null as any)
        .build();

      expect(filter).toEqual({});
    });

    it("should not add a filter when the value is undefined", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .searchFilter("name", undefined as any)
        .build();

      expect(filter).toEqual({});
    });

    it("should be chainable with other filter methods", () => {
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .where("key", "EQ", "barcode")
        .searchFilter("name", "doe")
        .build();

      expect(filter).toEqual({
        key: { EQ: "barcode" },
        name: { ILIKE: "%doe%" }
      });
    });
  });

  describe(".when()", () => {
    it("should apply the filter when the condition is true", () => {
      const applyFilter = true;
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .when(applyFilter, (builder) => {
          builder.where("name", "EQ", "barcode");
        })
        .build();
      expect(filter).toEqual({ name: { EQ: "barcode" } });
    });

    it("should not apply the filter when the condition is false and no falseCallback is provided", () => {
      const applyFilter = false;
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .when(applyFilter, (builder) => {
          builder.where("name", "EQ", "barcode");
        })
        .build();
      expect(filter).toEqual({});
    });

    it("should apply the trueCallback when the condition is true", () => {
      const condition = true;
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .when(
          condition,
          (builder) => builder.where("name", "EQ", "TrueCondition"),
          (builder) => builder.where("name", "EQ", "FalseCondition")
        )
        .build();
      expect(filter).toEqual({ name: { EQ: "TrueCondition" } });
    });

    it("should apply the falseCallback when the condition is false", () => {
      const condition = false;
      const filter = SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .when(
          condition,
          (builder) => builder.where("name", "EQ", "TrueCondition"),
          (builder) => builder.where("name", "EQ", "FalseCondition")
        )
        .build();
      expect(filter).toEqual({ name: { EQ: "FalseCondition" } });
    });
  });
});
