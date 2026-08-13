import {
  FiqlOrGroupBuilder,
  FiqlSearchFilterBuilder
} from "../fiqlSearchFilterbuilder";

describe("FiqlSearchFilterBuilder", () => {
  describe("create", () => {
    it("returns a builder that builds an empty string with no groups", () => {
      expect(FiqlSearchFilterBuilder.create().build()).toBe("");
    });
  });

  describe("group", () => {
    it("wraps a raw fragment in parentheses if not already wrapped", () => {
      const fiql = FiqlSearchFilterBuilder.create().group("name==foo").build();
      expect(fiql).toBe("(name==foo)");
    });

    it("does not double-wrap a fragment that is already parenthesized", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .group("(name==foo)")
        .build();
      expect(fiql).toBe("(name==foo)");
    });

    it("ignores null, undefined, and empty/whitespace-only fragments", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .group(null)
        .group(undefined)
        .group("")
        .group("   ")
        .build();
      expect(fiql).toBe("");
    });

    it("trims whitespace around the fragment before wrapping", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .group("  name==foo  ")
        .build();
      expect(fiql).toBe("(name==foo)");
    });

    it("joins multiple groups with semicolons", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .group("a==1")
        .group("b==2")
        .build();
      expect(fiql).toBe("(a==1);(b==2)");
    });
  });

  describe("where - EQ", () => {
    it("builds an equality fragment", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("name", "EQ", "foo")
        .build();
      expect(fiql).toBe("(name==foo)");
    });

    it("supports numeric and boolean values", () => {
      expect(
        FiqlSearchFilterBuilder.create().where("age", "EQ", 42).build()
      ).toBe("(age==42)");
      expect(
        FiqlSearchFilterBuilder.create().where("active", "EQ", true).build()
      ).toBe("(active==true)");
    });

    it("escapes control characters (comma, semicolon, parens) in the value", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("name", "EQ", "a,b;c(d)e")
        .build();
      expect(fiql).toBe("(name==a\\,b\\;c\\(d\\)e)");
    });
  });

  describe("where - NEQ", () => {
    it("builds a not-equal fragment", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("name", "NEQ", "foo")
        .build();
      expect(fiql).toBe("(name!=foo)");
    });
  });

  describe("where - GE/LE/GT/LT", () => {
    it.each([
      ["GE", "=ge="],
      ["LE", "=le="],
      ["GT", "=gt="],
      ["LT", "=lt="]
    ] as const)("builds a %s fragment using operator %s", (op, operator) => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("age", op, 10)
        .build();
      expect(fiql).toBe(`(age${operator}10)`);
    });

    it("escapes control characters for comparison operators", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("date", "GE", "2020,01;01")
        .build();
      expect(fiql).toBe("(date=ge=2020\\,01\\;01)");
    });
  });

  describe("where - IN", () => {
    it("builds a comma-joined IN fragment from an array", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("status", "IN", ["a", "b", "c"])
        .build();
      expect(fiql).toBe("(status==a,status==b,status==c)");
    });

    it("collapses a single non-array value into an EQ fragment", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("status", "IN", "a")
        .build();
      expect(fiql).toBe("(status==a)");
    });

    it("escapes control characters in each IN value", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("status", "IN", ["a,b", "c;d"])
        .build();
      expect(fiql).toBe("(status==a\\,b,status==c\\;d)");
    });

    it("skips the fragment entirely for an empty array", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("status", "IN", [])
        .build();
      expect(fiql).toBe("");
    });

    describe("single-item collapse to EQ", () => {
      it("collapses a single-element array to an EQ fragment instead of =in=", () => {
        const fiql = FiqlSearchFilterBuilder.create()
          .where("status", "IN", ["a"])
          .build();
        expect(fiql).toBe("(status==a)");
      });

      it("collapses a single non-array value into an EQ fragment", () => {
        const fiql = FiqlSearchFilterBuilder.create()
          .where("status", "IN", "a")
          .build();
        expect(fiql).toBe("(status==a)");
      });

      it("still escapes control characters when collapsed to EQ", () => {
        const fiql = FiqlSearchFilterBuilder.create()
          .where("status", "IN", ["a,b;c"])
          .build();
        expect(fiql).toBe("(status==a\\,b\\;c)");
      });

      it("collapses a single numeric or boolean value to EQ", () => {
        expect(
          FiqlSearchFilterBuilder.create().where("count", "IN", [5]).build()
        ).toBe("(count==5)");
        expect(
          FiqlSearchFilterBuilder.create().where("active", "IN", [true]).build()
        ).toBe("(active==true)");
      });

      it("keeps =in= form once there are two or more values", () => {
        const fiql = FiqlSearchFilterBuilder.create()
          .where("status", "IN", ["a", "b"])
          .build();
        expect(fiql).toBe("(status==a,status==b)");
      });
    });
  });

  describe("where - CONTAINS", () => {
    it("wraps the term in wildcards", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("name", "CONTAINS", "foo")
        .build();
      expect(fiql).toBe("(name==*foo*)");
    });

    it("escapes literal asterisks in the search term", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("name", "CONTAINS", "fo*o")
        .build();
      expect(fiql).toBe("(name==*fo\\*o*)");
    });
  });

  describe("where - value filtering", () => {
    it.each([null, undefined])(
      "skips the fragment when value is %s",
      (value) => {
        const fiql = FiqlSearchFilterBuilder.create()
          // @ts-expect-error testing runtime guard against null/undefined
          .where("name", "EQ", value)
          .build();
        expect(fiql).toBe("");
      }
    );

    it("does not skip falsy-but-defined values like 0, false, or empty string", () => {
      expect(
        FiqlSearchFilterBuilder.create().where("count", "EQ", 0).build()
      ).toBe("(count==0)");
      expect(
        FiqlSearchFilterBuilder.create().where("active", "EQ", false).build()
      ).toBe("(active==false)");
      expect(
        FiqlSearchFilterBuilder.create().where("name", "EQ", "").build()
      ).toBe("(name==)");
    });

    it("appends one group per where call, each independently parenthesized", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("a", "EQ", "1")
        .where("b", "EQ", "2")
        .build();
      expect(fiql).toBe("(a==1);(b==2)");
    });
  });

  describe("whereProvided", () => {
    it("adds the condition when value is a non-empty string", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .whereProvided("name", "EQ", "foo")
        .build();
      expect(fiql).toBe("(name==foo)");
    });

    it("skips when value is null, undefined, or empty/whitespace-only string", () => {
      expect(
        FiqlSearchFilterBuilder.create()
          .whereProvided("name", "EQ", null)
          .build()
      ).toBe("");
      expect(
        FiqlSearchFilterBuilder.create()
          .whereProvided("name", "EQ", undefined)
          .build()
      ).toBe("");
      expect(
        FiqlSearchFilterBuilder.create().whereProvided("name", "EQ", "").build()
      ).toBe("");
      expect(
        FiqlSearchFilterBuilder.create()
          .whereProvided("name", "EQ", "   ")
          .build()
      ).toBe("");
    });

    it("skips when value is an empty array", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .whereProvided("status", "IN", [])
        .build();
      expect(fiql).toBe("");
    });

    it("does not skip numeric 0 or boolean false", () => {
      expect(
        FiqlSearchFilterBuilder.create().whereProvided("count", "EQ", 0).build()
      ).toBe("(count==0)");
      expect(
        FiqlSearchFilterBuilder.create()
          .whereProvided("active", "EQ", false)
          .build()
      ).toBe("(active==false)");
    });
  });

  describe("contains", () => {
    it("builds a CONTAINS fragment for a non-empty term", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .contains("name", "foo")
        .build();
      expect(fiql).toBe("(name==*foo*)");
    });

    it("skips when term is undefined or whitespace-only", () => {
      expect(
        FiqlSearchFilterBuilder.create().contains("name", undefined).build()
      ).toBe("");
      expect(
        FiqlSearchFilterBuilder.create().contains("name", "   ").build()
      ).toBe("");
    });
  });

  describe("whereIn", () => {
    it("builds an IN fragment for a non-empty array", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .whereIn("status", ["a", "b"])
        .build();
      expect(fiql).toBe("(status==a,status==b)");
    });

    it("combines a standard where condition with a whereIn set using AND", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("publiclyReleasable", "EQ", true)
        .whereIn("group", ["admin", "editor"])
        .build();

      expect(fiql).toBe(
        "(publiclyReleasable==true);(group==admin,group==editor)"
      );
    });

    it("collapses a single-item array to an EQ fragment", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .whereIn("status", ["a"])
        .build();
      expect(fiql).toBe("(status==a)");
    });

    it("skips when values is undefined or an empty array", () => {
      expect(
        FiqlSearchFilterBuilder.create().whereIn("status", undefined).build()
      ).toBe("");
      expect(
        FiqlSearchFilterBuilder.create().whereIn("status", []).build()
      ).toBe("");
    });
  });

  describe("when", () => {
    it("applies the callback when the condition is true", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .when(true, (b) => b.where("name", "EQ", "foo"))
        .build();
      expect(fiql).toBe("(name==foo)");
    });

    it("does not apply the callback when the condition is false and no otherwise is given", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .when(false, (b) => b.where("name", "EQ", "foo"))
        .build();
      expect(fiql).toBe("");
    });

    it("applies the otherwise callback when the condition is false", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .when(
          false,
          (b) => b.where("name", "EQ", "foo"),
          (b) => b.where("name", "EQ", "bar")
        )
        .build();
      expect(fiql).toBe("(name==bar)");
    });

    it("returns the builder for further chaining", () => {
      const builder = FiqlSearchFilterBuilder.create();
      const result = builder.when(true, () => {});
      expect(result).toBe(builder);
    });
  });

  describe("or", () => {
    it("joins multiple where terms with a comma instead of separate groups", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) => b.where("a", "EQ", "1").where("b", "EQ", "2"))
        .build();
      expect(fiql).toBe("(a==1,b==2)");
    });

    it("produces a single top-level group regardless of how many OR terms are added", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) =>
          b.where("a", "EQ", "1").where("b", "EQ", "2").where("c", "GE", 5)
        )
        .build();
      expect(fiql).toBe("(a==1,b==2,c=ge=5)");
    });

    it("combines with top-level AND groups", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("type", "EQ", "sample")
        .or((b) =>
          b.where("status", "EQ", "open").where("status", "EQ", "pending")
        )
        .build();
      expect(fiql).toBe("(type==sample);(status==open,status==pending)");
    });

    it("supports whereProvided, contains, and whereIn inside the OR group", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) =>
          b
            .whereProvided("name", "EQ", "foo")
            .contains("description", "bar")
            .whereIn("tag", ["x", "y"])
        )
        .build();
      expect(fiql).toBe("(name==foo,description==*bar*,tag==x,tag==y)");
    });

    it("supports when/otherwise inside the OR group", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) =>
          b.when(
            false,
            (ob) => ob.where("a", "EQ", "1"),
            (ob) => ob.where("a", "EQ", "2")
          )
        )
        .build();
      expect(fiql).toBe("(a==2)");
    });

    it("supports merging a raw unparenthesized fragment as one OR term", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) => b.where("a", "EQ", "1").raw("b==2"))
        .build();
      expect(fiql).toBe("(a==1,b==2)");
    });

    it("ignores null/undefined/empty raw fragments passed to raw()", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) => b.where("a", "EQ", "1").raw(null).raw(undefined).raw("   "))
        .build();
      expect(fiql).toBe("(a==1)");
    });

    it("contributes nothing when every term inside the OR group is skipped", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("kept", "EQ", "value")
        .or((b) =>
          b
            .whereProvided("skipped", "EQ", null)
            .contains("alsoSkipped", undefined)
            .whereIn("stillSkipped", [])
        )
        .build();
      expect(fiql).toBe("(kept==value)");
    });

    it("escapes control characters within OR terms just like top-level where", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) => b.where("name", "EQ", "a,b;c").where("other", "EQ", "d(e)"))
        .build();
      expect(fiql).toBe("(name==a\\,b\\;c,other==d\\(e\\))");
    });

    it("keeps 0/false/empty-string values (via where) inside an OR group", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) => b.where("count", "EQ", 0).where("active", "EQ", false))
        .build();
      expect(fiql).toBe("(count==0,active==false)");
    });

    it("combines EQ and whereIn inside an OR group", () => {
      const groupNames = ["admin", "editor"];
      const fiql = FiqlSearchFilterBuilder.create()
        .or((b) =>
          b.where("publiclyReleasable", "EQ", true).whereIn("group", groupNames)
        )
        .build();

      expect(fiql).toBe(
        "(publiclyReleasable==true,group==admin,group==editor)"
      );
    });
  });

  describe("FiqlOrGroupBuilder (standalone)", () => {
    it("builds a comma-joined, unparenthesized fragment list", () => {
      const orBuilder = new FiqlOrGroupBuilder();
      orBuilder.where("a", "EQ", "1").where("b", "EQ", "2");
      expect(orBuilder.build()).toBe("a==1,b==2");
    });

    it("returns an empty string when no terms were added", () => {
      expect(new FiqlOrGroupBuilder().build()).toBe("");
    });

    it("is chainable and returns `this` from every mutating method", () => {
      const orBuilder = new FiqlOrGroupBuilder();
      expect(orBuilder.where("a", "EQ", "1")).toBe(orBuilder);
      expect(orBuilder.whereProvided("b", "EQ", "2")).toBe(orBuilder);
      expect(orBuilder.contains("c", "3")).toBe(orBuilder);
      expect(orBuilder.whereIn("d", ["4"])).toBe(orBuilder);
      expect(orBuilder.raw("e==5")).toBe(orBuilder);
    });
  });

  describe("build - integration", () => {
    it("combines group, where, whereProvided, contains, whereIn, or, and when in one chain", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("type", "EQ", "sample")
        .whereProvided("collector", "EQ", "John Doe")
        .whereProvided("skip", "EQ", null)
        .contains("materialSampleName", "MS-001")
        .whereIn("tags", ["field", "verified"])
        .or((b) =>
          b.where("status", "EQ", "open").where("status", "EQ", "pending")
        )
        .when(true, (b) => b.where("createdOn", "GE", "2024-01-01"))
        .group("(customFragment==1)")
        .build();

      expect(fiql).toBe(
        "(type==sample);(collector==John Doe);(materialSampleName==*MS-001*);" +
          "(tags==field,tags==verified);(status==open,status==pending);" +
          "(createdOn=ge=2024-01-01);(customFragment==1)"
      );
    });

    it("filters out falsy empty groups so build never emits stray semicolons", () => {
      const fiql = FiqlSearchFilterBuilder.create()
        .where("skippedIn", "IN", [])
        .whereProvided("skippedNull", "EQ", null)
        .contains("skippedTerm", undefined)
        .where("kept", "EQ", "value")
        .build();

      expect(fiql).toBe("(kept==value)");
    });

    it("is chainable and returns `this` from every mutating method", () => {
      const builder = FiqlSearchFilterBuilder.create();
      expect(builder.group("a==1")).toBe(builder);
      expect(builder.where("b", "EQ", "2")).toBe(builder);
      expect(builder.whereProvided("c", "EQ", "3")).toBe(builder);
      expect(builder.contains("d", "4")).toBe(builder);
      expect(builder.whereIn("e", ["5"])).toBe(builder);
    });
  });
});
