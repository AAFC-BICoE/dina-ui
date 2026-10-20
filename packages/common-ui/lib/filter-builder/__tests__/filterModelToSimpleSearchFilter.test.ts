import { FilterGroupModel } from "../FilterGroup";
import { filterModelToSimpleSearchFilter } from "../filterModelToSimpleSearchFilter";

describe("filterModelToSimpleSearchFilter", () => {
  it("returns an empty filter for a blank model", () => {
    expect(filterModelToSimpleSearchFilter(null)).toEqual({});
    expect(filterModelToSimpleSearchFilter(undefined)).toEqual({});
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_GROUP",
        operator: "AND",
        id: 1,
        children: []
      })
    ).toEqual({});
  });

  it("converts nested AND/OR groups", () => {
    const model: FilterGroupModel = {
      type: "FILTER_GROUP",
      operator: "AND",
      id: 1,
      children: [
        {
          type: "FILTER_GROUP",
          operator: "OR",
          id: 2,
          children: [
            {
              type: "FILTER_ROW",
              id: 3,
              attribute: "name",
              predicate: "IS",
              searchType: "PARTIAL_MATCH",
              value: "101F"
            },
            {
              type: "FILTER_ROW",
              id: 4,
              attribute: "group",
              predicate: "IS",
              searchType: "EXACT_MATCH",
              value: "poffm"
            }
          ]
        },
        {
          type: "FILTER_ROW",
          id: 5,
          attribute: "name",
          predicate: "IS NOT",
          searchType: "EXACT_MATCH",
          value: "1075R"
        },
        // Rows without values are ignored.
        {
          type: "FILTER_ROW",
          id: 6,
          attribute: "createdBy",
          predicate: "IS",
          searchType: "EXACT_MATCH",
          value: ""
        }
      ]
    };

    expect(filterModelToSimpleSearchFilter(model)).toEqual({
      $or: [{ name: { ILIKE: "%101F%" } }, { group: { EQ: "poffm" } }],
      name: { NEQ: "1075R" }
    });
  });

  it("converts IS NOT partial matches to the UI-only NOT_ILIKE operator", () => {
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute: "name",
        predicate: "IS NOT",
        searchType: "PARTIAL_MATCH",
        value: "abc"
      })
    ).toEqual({ name: { NOT_ILIKE: "%abc%" } });
  });

  it("keeps a * in an exact match a wildcard, as it was in FIQL", () => {
    const row = (predicate: "IS" | "IS NOT") =>
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute: "name",
        predicate,
        searchType: "EXACT_MATCH",
        value: "PR1956*"
      });
    expect(row("IS")).toEqual({ name: { LIKE: "PR1956*" } });
    // The simple filter can't negate a pattern: filterOrFiqlParams sends this NEQ as FIQL.
    expect(row("IS NOT")).toEqual({ name: { NEQ: "PR1956*" } });
  });

  it("sends a search made only of characters the back-end can't read as an exact match, as it would match every record", () => {
    const row = (
      searchType: "PARTIAL_MATCH" | "EXACT_MATCH",
      value: string,
      predicate: "IS" | "IS NOT" = "IS"
    ) =>
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute: "name",
        predicate,
        searchType,
        value
      });
    expect(row("PARTIAL_MATCH", "'")).toEqual({ name: { EQ: "'" } });
    expect(row("PARTIAL_MATCH", "+#")).toEqual({ name: { EQ: "+#" } });
    expect(row("EXACT_MATCH", "'*")).toEqual({ name: { EQ: "'*" } });
    expect(
      filterModelToSimpleSearchFilter({
        type: "FREE_TEXT_SEARCH_FILTER",
        value: "'",
        filterAttributes: ["name", "key"]
      })
    ).toEqual({ $or: [{ name: { EQ: "'" } }, { key: { EQ: "'" } }] });
    // Text with a readable character, and wildcards alone, stay patterns
    expect(row("PARTIAL_MATCH", "O'Brien")).toEqual({
      name: { ILIKE: "%O'Brien%" }
    });
    expect(row("PARTIAL_MATCH", "_")).toEqual({ name: { ILIKE: "%_%" } });
    expect(row("EXACT_MATCH", "*")).toEqual({ name: { LIKE: "*" } });
    // A negated pattern is sent as FIQL, where its quoted value excludes nothing
    expect(row("PARTIAL_MATCH", "'", "IS NOT")).toEqual({
      name: { NOT_ILIKE: "%'%" }
    });
  });

  it("converts blank field filters to null comparisons, and a text field with a value to LIKE %", () => {
    const row = (attribute: any, predicate: "IS" | "IS NOT") =>
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute,
        predicate,
        searchType: "BLANK_FIELD",
        value: null
      });
    expect(row("description", "IS")).toEqual({ description: { EQ: null } });
    // The back-end matches nothing for NEQ null
    expect(row("description", "IS NOT")).toEqual({
      description: { LIKE: "%" }
    });
    expect(row({ name: "description", type: "STRING" }, "IS NOT")).toEqual({
      description: { LIKE: "%" }
    });
    // Other types keep NEQ null
    expect(row({ name: "parent", type: "DROPDOWN" }, "IS NOT")).toEqual({
      parent: { NEQ: null }
    });
    expect(row({ name: "number", allowRange: true }, "IS NOT")).toEqual({
      number: { NEQ: null }
    });
  });

  it("ignores a blank field search type left on a date row, which shows none", () => {
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute: { name: "createdOn", type: "DATE" },
        predicate: "FROM",
        searchType: "BLANK_FIELD",
        value: "2020-10-06T12:00:00.000Z"
      })
    ).toEqual({ createdOn: { GOE: "2020-10-06T00:00:00.000Z" } });
  });

  it("converts IN and NOT IN, using the ID of dropdown values", () => {
    const people = [
      { id: "person-1", type: "person" },
      { id: "person-2", type: "person" }
    ];
    const attribute = {
      name: "managedBy",
      type: "DROPDOWN" as const,
      resourcePath: "agent-api/person"
    };
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute,
        predicate: "IN",
        searchType: "EXACT_MATCH",
        value: people
      })
    ).toEqual({ managedBy: { IN: "person-1,person-2" } });

    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute,
        predicate: "NOT IN",
        searchType: "EXACT_MATCH",
        value: people
      })
    ).toEqual({
      managedBy: { NEQ: "person-1" },
      $and: [{ managedBy: { NEQ: "person-2" } }]
    });
  });

  it("converts range lists to between conditions and plain values to equalities", () => {
    const attribute = { name: "number", allowRange: true };
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute,
        predicate: "IS",
        searchType: "EXACT_MATCH",
        value: "200-100, 300, 400-500"
      })
    ).toEqual({
      $or: [
        { number: { GOE: "100", LOE: "200" } },
        { number: { EQ: "300" } },
        { number: { GOE: "400", LOE: "500" } }
      ]
    });

    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute,
        predicate: "IS NOT",
        searchType: "EXACT_MATCH",
        value: "100-200,300"
      })
    ).toEqual({
      $or: [{ number: { LT: "100" } }, { number: { GT: "200" } }],
      number: { NEQ: "300" }
    });
  });

  it("keeps the row's search type for range-list items that are not ranges", () => {
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute: { name: "number", allowRange: true },
        predicate: "IS",
        searchType: "PARTIAL_MATCH",
        value: "100-200,42"
      })
    ).toEqual({
      $or: [
        { number: { GOE: "100", LOE: "200" } },
        { number: { ILIKE: "%42%" } }
      ]
    });
  });

  it("converts date filters to day ranges", () => {
    const attribute = { name: "createdOn", type: "DATE" as const };
    const value =
      "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)";
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute,
        predicate: "IS",
        searchType: "PARTIAL_MATCH",
        value
      })
    ).toEqual({
      createdOn: {
        GOE: "2020-10-06T00:00:00.000Z",
        LOE: "2020-10-06T23:59:59.999Z"
      }
    });
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute,
        predicate: "FROM",
        searchType: "PARTIAL_MATCH",
        value
      })
    ).toEqual({ createdOn: { GOE: "2020-10-06T00:00:00.000Z" } });
  });

  it("sends dates in UTC, with no +hh:mm offset", () => {
    // jest runs with TZ=UTC; the offset form "+hh:mm" is what used to break east of UTC.
    const result = filterModelToSimpleSearchFilter({
      type: "FILTER_ROW",
      id: 1,
      attribute: { name: "createdOn", type: "DATE" },
      predicate: "IS NOT",
      searchType: "PARTIAL_MATCH",
      value: "2020-10-06T12:00:00.000Z"
    });
    expect(JSON.stringify(result)).not.toContain("+");
    expect(result).toEqual({
      $or: [
        { createdOn: { LT: "2020-10-06T00:00:00.000Z" } },
        { createdOn: { GT: "2020-10-06T23:59:59.999Z" } }
      ]
    });
  });

  it("converts a free-text search to an OR over the attributes, and nothing for a blank search", () => {
    expect(
      filterModelToSimpleSearchFilter({
        type: "FREE_TEXT_SEARCH_FILTER",
        value: "john",
        filterAttributes: ["username", { name: "labels.en" }]
      })
    ).toEqual({
      $or: [
        { username: { ILIKE: "%john%" } },
        { "labels.en": { ILIKE: "%john%" } }
      ]
    });
    expect(
      filterModelToSimpleSearchFilter({
        type: "FREE_TEXT_SEARCH_FILTER",
        value: "",
        filterAttributes: ["username"]
      })
    ).toEqual({});
  });
});
