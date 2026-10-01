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

  it("converts blank field filters to null comparisons", () => {
    expect(
      filterModelToSimpleSearchFilter({
        type: "FILTER_ROW",
        id: 1,
        attribute: "description",
        predicate: "IS NOT",
        searchType: "BLANK_FIELD",
        value: null
      })
    ).toEqual({ description: { NEQ: null } });
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
        GOE: "2020-10-06T00:00:00+00:00",
        LOE: "2020-10-06T23:59:59+00:00"
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
    ).toEqual({ createdOn: { GOE: "2020-10-06T00:00:00+00:00" } });
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
