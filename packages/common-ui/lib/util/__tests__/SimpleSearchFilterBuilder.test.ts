import { ManagedAttribute } from "packages/dina-ui/types/collection-api";
import {
  SimpleSearchFilterBuilder,
  isEmptySimpleSearchFilter,
  mergeSimpleSearchFilters
} from "../simpleSearchFilterBuilder";
import { simpleSearchFilterToFiql } from "../../filter-builder/fiql";

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

    it("should allow setting the value as null for searching for empty values", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .where("key", "EQ", null)
        .build();
      expect(filter).toEqual({
        key: { EQ: null }
      });
    });

    it("should throw an error when value is undefined", () => {
      expect(() => {
        SimpleSearchFilterBuilder.create<ManagedAttribute>().where(
          "key",
          "EQ",
          undefined as any
        );
      }).toThrow("Where condition value undefined for field: key");
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

  describe(".where() on the same field", () => {
    it("merges different operators on the same field into one condition", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .where("age", "GOE", 18)
        .where("age", "LOE", 65)
        .build();
      expect(filter).toEqual({ age: { GOE: 18, LOE: 65 } });
    });

    it("puts a repeated field + operator into an $and group instead of overwriting it", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .where("group", "NEQ", "a")
        .where("group", "NEQ", "b")
        .build();
      expect(filter).toEqual({
        group: { NEQ: "a" },
        $and: [{ group: { NEQ: "b" } }]
      });
    });

    it("only keeps identical conditions once", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .where("group", "EQ", "aafc")
        .add({ group: { EQ: "aafc" } })
        .build();
      expect(filter).toEqual({ group: { EQ: "aafc" } });
    });
  });

  describe(".or()", () => {
    it("adds each condition of the callback as a member of an $or group", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .or((b) =>
          b
            .where("publiclyReleasable", "EQ", true)
            .whereIn("group", ["aafc", "cnc"])
        )
        .build();
      expect(filter).toEqual({
        $or: [
          { publiclyReleasable: { EQ: true } },
          { group: { IN: "aafc,cnc" } }
        ]
      });
    });

    it("combines the $or group with the other conditions (AND)", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .where("group", "EQ", "aafc")
        .or((b) =>
          b
            .where("createdBy", "EQ", "me")
            .where("restrictToCreatedBy", "EQ", false)
        )
        .searchFilter("name", "test")
        .build();
      expect(filter).toEqual({
        group: { EQ: "aafc" },
        $or: [
          { createdBy: { EQ: "me" } },
          { restrictToCreatedBy: { EQ: false } }
        ],
        name: { ILIKE: "%test%" }
      });
    });

    it("adds nothing when every condition in the group was skipped", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .or((b) => b.whereProvided("a", "EQ", "").whereIn("b", []))
        .build();
      expect(filter).toEqual({});
    });

    it("adds a single-member group as a plain condition", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .or((b) => b.whereProvided("a", "EQ", "").where("b", "EQ", 1))
        .build();
      expect(filter).toEqual({ b: { EQ: 1 } });
    });

    it("supports .when() and .add() inside the group", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .or((b) =>
          b
            .when(true, (b2) => b2.where("a", "EQ", 1))
            .when(false, (b2) => b2.where("skipped", "EQ", 1))
            .add({ c: { EQ: 3 }, d: { EQ: 4 } })
        )
        .build();
      // The added object forms a single member: c AND d.
      expect(filter).toEqual({
        $or: [{ a: { EQ: 1 } }, { c: { EQ: 3 }, d: { EQ: 4 } }]
      });
    });

    it("puts a second $or group into $and", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .or((b) => b.where("a", "EQ", 1).where("b", "EQ", 2))
        .or((b) => b.where("c", "EQ", 3).where("d", "EQ", 4))
        .build();
      expect(filter).toEqual({
        $or: [{ a: { EQ: 1 } }, { b: { EQ: 2 } }],
        $and: [{ $or: [{ c: { EQ: 3 } }, { d: { EQ: 4 } }] }]
      });
    });

    it("supports nested groups", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .or((b) =>
          b
            .where("a", "EQ", 1)
            .and((b2) =>
              b2
                .where("b", "EQ", 2)
                .or((b3) => b3.where("c", "EQ", 3).where("d", "EQ", 4))
            )
        )
        .build();
      expect(filter).toEqual({
        $or: [
          { a: { EQ: 1 } },
          { b: { EQ: 2 }, $or: [{ c: { EQ: 3 } }, { d: { EQ: 4 } }] }
        ]
      });
    });
  });

  describe(".and()", () => {
    it("merges the callback's conditions into the filter", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .where("a", "EQ", 1)
        .and((b) => b.where("b", "EQ", 2).where("c", "EQ", 3))
        .build();
      expect(filter).toEqual({ a: { EQ: 1 }, b: { EQ: 2 }, c: { EQ: 3 } });
    });
  });

  describe("mergeSimpleSearchFilters()", () => {
    it("does not mutate its inputs", () => {
      const target = {
        a: { EQ: 1 },
        $or: [{ b: { EQ: 2 } }, { c: { EQ: 3 } }]
      };
      const source = {
        a: { EQ: 9 },
        $or: [{ d: { EQ: 4 } }, { e: { EQ: 5 } }]
      };
      const merged = mergeSimpleSearchFilters(target, source);
      expect(merged).toEqual({
        a: { EQ: 1 },
        $or: [{ b: { EQ: 2 } }, { c: { EQ: 3 } }],
        $and: [{ a: { EQ: 9 } }, { $or: [{ d: { EQ: 4 } }, { e: { EQ: 5 } }] }]
      });
      expect(target).toEqual({
        a: { EQ: 1 },
        $or: [{ b: { EQ: 2 } }, { c: { EQ: 3 } }]
      });
      expect(source).toEqual({
        a: { EQ: 9 },
        $or: [{ d: { EQ: 4 } }, { e: { EQ: 5 } }]
      });
    });

    it("concatenates $and groups", () => {
      expect(
        mergeSimpleSearchFilters(
          { $and: [{ a: { EQ: 1 } }] },
          { $and: [{ b: { EQ: 2 } }] }
        )
      ).toEqual({ $and: [{ a: { EQ: 1 } }, { b: { EQ: 2 } }] });
    });
  });

  describe("legacy operator-less values", () => {
    it("keeps plain values as they are and drops blank ones", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .add({ name: "todo 2", description: "" })
        .where("group", "EQ", "aafc")
        .build();
      expect(filter).toEqual({ name: "todo 2", group: { EQ: "aafc" } });
      expect(
        SimpleSearchFilterBuilder.create().add({ name: "" }).build()
      ).toEqual({});
    });

    it("puts a conflicting plain value into $and", () => {
      expect(
        mergeSimpleSearchFilters({ name: "a" }, { name: "b", other: "a" })
      ).toEqual({ name: "a", other: "a", $and: [{ name: "b" }] });
      expect(
        mergeSimpleSearchFilters({ name: "a" }, { name: { EQ: "b" } })
      ).toEqual({ name: "a", $and: [{ name: { EQ: "b" } }] });
    });
  });

  describe("hostile field names and values", () => {
    it("keeps a field named __proto__ as a condition instead of losing it", () => {
      const filter = SimpleSearchFilterBuilder.create()
        .where("__proto__", "EQ", "x")
        .where("group", "EQ", "aafc")
        .build();
      // Plain assignment triggers Object.prototype's setter, dropping the condition
      // and leaving an unfiltered query.
      expect(Object.keys(filter).sort()).toEqual(["__proto__", "group"]);
      expect(simpleSearchFilterToFiql(filter)).toEqual(
        "__proto__==x;group==aafc"
      );
    });

    it("expresses IN values containing a comma as an OR of equalities", () => {
      // Commas cannot be escaped in IN lists. Values are compared individually
      // to keep "New York, NY" as a single value.
      expect(
        SimpleSearchFilterBuilder.create()
          .whereIn("city", ["New York, NY", "Ottawa"])
          .build()
      ).toEqual({
        $or: [{ city: { EQ: "New York, NY" } }, { city: { EQ: "Ottawa" } }]
      });
      expect(
        simpleSearchFilterToFiql(
          SimpleSearchFilterBuilder.create()
            .whereIn("city", ["New York, NY", "Ottawa"])
            .build()
        )
      ).toEqual('city=="New York, NY",city==Ottawa');
      // Comma-free lists retain the compact IN form:
      expect(
        SimpleSearchFilterBuilder.create()
          .whereIn("city", ["Ottawa", "Montreal"])
          .build()
      ).toEqual({ city: { IN: "Ottawa,Montreal" } });
      // Pre-joined strings indicate multiple values and are kept:
      expect(
        SimpleSearchFilterBuilder.create().where("city", "IN", "a,b").build()
      ).toEqual({ city: { IN: "a,b" } });
    });

    it("adds nothing for an empty IN list, whichever entry point is used", () => {
      for (const filter of [
        SimpleSearchFilterBuilder.create().whereIn("group", []).build(),
        SimpleSearchFilterBuilder.create()
          .whereProvided("group", "IN", [])
          .build(),
        SimpleSearchFilterBuilder.create().where("group", "IN", []).build(),
        // Hand-written empty lists are dropped in both shapes:
        SimpleSearchFilterBuilder.create()
          .add({ group: { IN: "" } })
          .build(),
        SimpleSearchFilterBuilder.create()
          .add({ group: { IN: [] } })
          .build()
      ]) {
        expect(filter).toEqual({});
      }
    });
  });

  describe("the built filter is the caller's to keep", () => {
    it("does not alias the builder's own state", () => {
      const builder = SimpleSearchFilterBuilder.create().or((b) =>
        b.where("a", "EQ", 1).where("b", "EQ", 2)
      );
      const first = builder.build();
      (first.$or as any[]).push({ c: { EQ: 3 } });
      expect(builder.build()).toEqual({
        $or: [{ a: { EQ: 1 } }, { b: { EQ: 2 } }]
      });
    });

    it("does not alias an added filter", () => {
      const added = { $or: [{ a: { EQ: 1 } }, { b: { EQ: 2 } }] };
      const built = SimpleSearchFilterBuilder.create().add(added).build();
      (built.$or as any[]).push({ c: { EQ: 3 } });
      expect(added.$or).toHaveLength(2);
    });
  });

  describe("isEmptySimpleSearchFilter()", () => {
    it("detects empty filters", () => {
      expect(isEmptySimpleSearchFilter(undefined)).toBe(true);
      expect(isEmptySimpleSearchFilter(null)).toBe(true);
      expect(isEmptySimpleSearchFilter({})).toBe(true);
      expect(isEmptySimpleSearchFilter({ $or: [] })).toBe(true);
      expect(isEmptySimpleSearchFilter({ $or: [{}] })).toBe(true);
      expect(isEmptySimpleSearchFilter({ a: {} })).toBe(true);
      expect(isEmptySimpleSearchFilter({ a: { EQ: null } })).toBe(false);
      expect(isEmptySimpleSearchFilter({ a: { IN: "" } })).toBe(true);
      expect(isEmptySimpleSearchFilter({ a: { IN: [] } })).toBe(true);
      expect(isEmptySimpleSearchFilter({ a: { IN: "x" } })).toBe(false);
      expect(isEmptySimpleSearchFilter({ a: "" })).toBe(true);
      expect(isEmptySimpleSearchFilter({ a: "x" })).toBe(false);
      expect(isEmptySimpleSearchFilter({ a: null })).toBe(false);
      expect(isEmptySimpleSearchFilter({ $or: [{ a: { EQ: 1 } }] })).toBe(
        false
      );
    });
  });
});
