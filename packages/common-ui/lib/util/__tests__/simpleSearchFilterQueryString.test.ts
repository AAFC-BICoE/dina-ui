import { query } from "kitsu-core";
import { SimpleSearchFilterBuilder } from "../simpleSearchFilterBuilder";
import {
  serializeKitsuParams,
  simpleSearchFilterToQueryString
} from "../simpleSearchFilterQueryString";

describe("simpleSearchFilterToQueryString", () => {
  it("returns an empty string for an empty filter", () => {
    expect(simpleSearchFilterToQueryString(undefined)).toEqual("");
    expect(simpleSearchFilterToQueryString({})).toEqual("");
  });

  it("serializes a group-less filter exactly like kitsu-core", () => {
    const filter = SimpleSearchFilterBuilder.create()
      .searchFilter("name", "test value")
      .where("group", "EQ", "aafc")
      .where("age", "GOE", 18)
      .whereIn("type", ["a", "b"])
      .build();

    expect(simpleSearchFilterToQueryString(filter)).toEqual(
      "filter%5Bname%5D%5BILIKE%5D=%25test%20value%25&filter%5Bgroup%5D%5BEQ%5D=aafc&filter%5Bage%5D%5BGOE%5D=18&filter%5Btype%5D%5BIN%5D=a%2Cb"
    );
    expect(simpleSearchFilterToQueryString(filter)).toEqual(query({ filter }));
  });

  it("serializes legacy operator-less values exactly like kitsu-core", () => {
    const filter = { name: "todo 2", flag: true, group: { EQ: "aafc" } };
    expect(simpleSearchFilterToQueryString(filter)).toEqual(query({ filter }));
  });

  it("encodes brackets in values so they can't be read as group delimiters", () => {
    // encodeURIComponent leaves "(" and ")" alone to delimit groups.
    expect(
      simpleSearchFilterToQueryString({
        $or: [{ a: { EQ: "x)" } }, { b: { EQ: "y" } }]
      })
    ).toEqual("(filter%5Ba%5D%5BEQ%5D=x%29|filter%5Bb%5D%5BEQ%5D=y)");
    expect(simpleSearchFilterToQueryString({ "a(1)": { EQ: "(b)" } })).toEqual(
      "filter%5Ba%281%29%5D%5BEQ%5D=%28b%29"
    );
  });

  it("serializes blank and null values like kitsu-core instead of dropping them", () => {
    // Dropping a blank value turns a query matching nothing into an unfiltered one.
    for (const filter of [
      { name: "" },
      { name: null },
      { name: "", group: { EQ: "aafc" } },
      { name: null, group: { EQ: "aafc" } }
    ]) {
      expect(simpleSearchFilterToQueryString(filter)).toEqual(
        query({ filter })
      );
    }
  });

  it("hands values it does not model back to kitsu-core", () => {
    // Arrays and deeper nesting retain their original shape.
    // The deeply nested one is a legacy kitsu filter requiring a cast.
    const filters: any[] = [
      { id: ["a", "b"] },
      { uuid: { IN: ["a", "b"] } },
      { a: { b: { c: 1 } } },
      { id: ["a"], group: { EQ: "aafc" } }
    ];
    for (const filter of filters) {
      expect(simpleSearchFilterToQueryString(filter)).toEqual(
        query({ filter })
      );
    }
  });

  it("emits no condition for an empty IN list, rather than matching only blanks", () => {
    expect(simpleSearchFilterToQueryString({ group: { IN: "" } })).toEqual("");
    expect(simpleSearchFilterToQueryString({ group: { IN: [] } })).toEqual("");
    expect(
      simpleSearchFilterToQueryString({ group: { IN: [] }, name: { EQ: "x" } })
    ).toEqual("filter%5Bname%5D%5BEQ%5D=x");
  });

  it("carries a comma inside a value when the builder expands IN to an OR group", () => {
    const filter = SimpleSearchFilterBuilder.create()
      .whereIn("city", ["New York, NY", "Ottawa"])
      .build();
    // Each value is encoded individually so commas are not separators.
    expect(simpleSearchFilterToQueryString(filter)).toEqual(
      "(filter%5Bcity%5D%5BEQ%5D=New%20York%2C%20NY|filter%5Bcity%5D%5BEQ%5D=Ottawa)"
    );
  });

  it("serializes an OR group with the grouped syntax", () => {
    const filter = SimpleSearchFilterBuilder.create()
      .or((b) => b.where("a", "EQ", 1).where("b", "EQ", 2))
      .where("c", "EQ", 3)
      .build();
    expect(simpleSearchFilterToQueryString(filter)).toEqual(
      "(filter%5Ba%5D%5BEQ%5D=1|filter%5Bb%5D%5BEQ%5D=2)&filter%5Bc%5D%5BEQ%5D=3"
    );
  });

  it("serializes nested groups", () => {
    const filter = SimpleSearchFilterBuilder.create()
      .or((b) =>
        b
          .where("a", "EQ", 1)
          .and((b2) => b2.where("b", "EQ", 2).where("c", "EQ", 3))
      )
      .or((b) => b.where("d", "EQ", 4).where("e", "EQ", 5))
      .build();
    expect(simpleSearchFilterToQueryString(filter)).toEqual(
      "(filter%5Ba%5D%5BEQ%5D=1|(filter%5Bb%5D%5BEQ%5D=2&filter%5Bc%5D%5BEQ%5D=3))&(filter%5Bd%5D%5BEQ%5D=4|filter%5Be%5D%5BEQ%5D=5)"
    );
  });

  it("does not wrap a single-member group in parentheses", () => {
    expect(
      simpleSearchFilterToQueryString({ $or: [{ a: { EQ: 1 } }] })
    ).toEqual("filter%5Ba%5D%5BEQ%5D=1");
  });

  it("serializes unsupported filters as strings so the web app server-side can intercept them", () => {
    expect(
      simpleSearchFilterToQueryString({ name: { NOT_ILIKE: "%a%" } })
    ).toEqual("filter%5Bname%5D%5BNOT_ILIKE%5D=%25a%25");
    expect(simpleSearchFilterToQueryString({ name: { EQ: null } })).toEqual(
      "filter%5Bname%5D%5BEQ%5D=null"
    );
  });
});

describe("serializeKitsuParams", () => {
  const params = {
    fields: { person: "name,email" },
    filter: { name: { ILIKE: "%a%" }, group: { EQ: "aafc" } },
    include: "organizations",
    page: { limit: 25, offset: 0 },
    sort: "-createdOn"
  };

  it("serializes params without filter groups exactly like kitsu-core, in the same order", () => {
    expect(serializeKitsuParams(params)).toEqual(query(params));
    expect(serializeKitsuParams({ filter: "raw", sort: "name" })).toEqual(
      query({ filter: "raw", sort: "name" })
    );
    expect(
      serializeKitsuParams({ fiql: "name==a;b==c", page: { limit: 1 } })
    ).toEqual(query({ fiql: "name==a;b==c", page: { limit: 1 } }));
  });

  it("uses the grouped syntax for filter objects with groups", () => {
    expect(
      serializeKitsuParams({
        filter: { $or: [{ a: { EQ: 1 } }, { b: { EQ: 2 } }] },
        sort: "name"
      })
    ).toEqual("(filter%5Ba%5D%5BEQ%5D=1|filter%5Bb%5D%5BEQ%5D=2)&sort=name");
  });

  it("omits an empty filter object", () => {
    expect(serializeKitsuParams({ filter: {}, sort: "name" })).toEqual(
      "sort=name"
    );
  });

  it("keeps kitsu's shape for the filters it does not model", () => {
    for (const params of [
      { filter: { id: ["a", "b"] }, sort: "name" },
      { filter: { uuid: { IN: ["a", "b"] } } },
      { filter: { name: "" }, page: { limit: 1000 } }
    ]) {
      expect(serializeKitsuParams(params)).toEqual(query(params));
    }
  });
});
