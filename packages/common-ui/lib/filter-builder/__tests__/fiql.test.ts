import { FilterParam } from "kitsu";
import { FilterGroupModel } from "../FilterGroup";
import { fiql, simpleSearchFilterToFiql } from "../fiql";

describe("fiql conversion", () => {
  it("Converts from a filter model to fiql.", () => {
    const fiqlFilter = fiql({
      children: [
        {
          children: [
            {
              attribute: "name",
              id: 1,
              predicate: "IS",
              searchType: "EXACT_MATCH",
              type: "FILTER_ROW",
              value: "101F"
            },
            {
              attribute: "group.groupName",
              id: 3,
              predicate: "IS",
              searchType: "EXACT_MATCH",
              type: "FILTER_ROW",
              value: "poffm"
            }
          ],
          id: 4,
          operator: "OR",
          type: "FILTER_GROUP"
        },
        {
          attribute: "name",
          id: 5,
          predicate: "IS NOT",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "1075R"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    });

    expect(fiqlFilter).toEqual(
      "(name==101F,group.groupName==poffm);name!=1075R"
    );
  });

  it("Returns a blank string when no filter is passed.", () => {
    const fiqlFilter = fiql(null);
    expect(fiqlFilter).toEqual("");
  });

  it("Surrounds the filter value with asterisks when a partial match is requested.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "101F"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };
    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("name==*101F*");
  });

  it("Leaves the filter attribute as is when an exact match is requested.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "name",
          id: 1,
          predicate: "IS",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "101F"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };
    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("name==101F");
  });

  it("Allows a filter for blank fields.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "description",
          id: 1,
          predicate: "IS",
          searchType: "BLANK_FIELD",
          type: "FILTER_ROW",
          value: "this attribute shouldn't matter"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("description==null");
  });

  it("Allows a filter for NOT blank fields.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "description",
          id: 1,
          predicate: "IS NOT",
          searchType: "BLANK_FIELD",
          type: "FILTER_ROW",
          value: "this attribute shouldn't matter"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("description!=null");
  });

  it("Allows a range filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowRange: true,
            label: "Number",
            name: "number"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "100-200"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("number=ge=100;number=le=200");
  });

  it("Allows a range filter written backwards.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowRange: true,
            label: "Number",
            name: "number"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "200-100"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("number=ge=100;number=le=200");
  });

  it("Allows date IS filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value:
            "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual(
      // Greater than or equal to {beginning of day} AND less than or equal to {end of day}:
      "myDateField=ge=2020-10-06T00:00:00+00:00;myDateField=le=2020-10-06T23:59:59+00:00"
    );
  });

  it("Allows date IS NOT filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "IS NOT",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value:
            "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual(
      // Less than {beginning of day} OR greater than {end of day}:
      "myDateField=lt=2020-10-06T00:00:00+00:00,myDateField=gt=2020-10-06T23:59:59+00:00"
    );
  });

  it("Allows date FROM filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "FROM",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value:
            "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    // Greater than or equal to {beginning of day}:
    expect(fiqlFilter).toEqual("myDateField=ge=2020-10-06T00:00:00+00:00");
  });

  it("Allows date UNTIL filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "UNTIL",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value:
            "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    // Less than or equal to {end of day}:
    expect(fiqlFilter).toEqual("myDateField=le=2020-10-06T23:59:59+00:00");
  });

  it("Allows date BETWEEN filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "BETWEEN",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: {
            low: "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)",
            high: "Tue Oct 12 2020 21:05:30 GMT+0000 (Coordinated Universal Time)"
          }
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    // From the beginning date to the end date:
    expect(fiqlFilter).toEqual(
      "myDateField=ge=2020-10-06T00:00:00+00:00;myDateField=le=2020-10-12T23:59:59+00:00"
    );
  });

  it("Allows date BETWEEN filter with a backwards range.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "myDateField",
            label: "My Date Field",
            type: "DATE"
          },
          id: 1,
          predicate: "BETWEEN",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: {
            // The high and low values are backwards:
            low: "Tue Oct 12 2020 21:05:30 GMT+0000 (Coordinated Universal Time)",
            high: "Tue Oct 06 2020 20:14:30 GMT+0000 (Coordinated Universal Time)"
          }
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    // From the beginning date to the end date:
    expect(fiqlFilter).toEqual(
      "myDateField=ge=2020-10-06T00:00:00+00:00;myDateField=le=2020-10-12T23:59:59+00:00"
    );
  });

  it("Converts a dropdown-type filter with a null ID value.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "acMetadataCreator",
            type: "DROPDOWN",
            resourcePath: "agent-api/person"
          },
          id: 3,
          predicate: "IS",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          // Null ID:
          value: { id: null } as any
        }
      ],
      id: 4,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("acMetadataCreator==null");
  });

  it("Allows IN filter with multiple string values.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "group",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["test", "test2", "test3"]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("group==test,group==test2,group==test3");
  });

  it("Allows NOT IN filter with multiple string values.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "group",
          id: 1,
          predicate: "NOT IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["test", "test2"]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("group!=test;group!=test2");
  });

  it("Allows IN filter with single value.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "status",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["active"]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("status==active");
  });

  it("Allows IN filter with DROPDOWN type resources.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "managedBy",
            type: "DROPDOWN",
            resourcePath: "agent-api/person"
          },
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: [
            { id: "person-1", type: "person" },
            { id: "person-2", type: "person" },
            { id: "person-3", type: "person" }
          ]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual(
      "managedBy==person-1,managedBy==person-2,managedBy==person-3"
    );
  });

  it("Allows NOT IN filter with DROPDOWN type resources.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            name: "managedBy",
            type: "DROPDOWN",
            resourcePath: "agent-api/person"
          },
          id: 1,
          predicate: "NOT IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: [
            { id: "person-1", type: "person" },
            { id: "person-2", type: "person" }
          ]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("managedBy!=person-1;managedBy!=person-2");
  });

  it("Allows IN filter with numeric values.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "quantity",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: [10, 20, 30]
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("quantity==10,quantity==20,quantity==30");
  });

  it("Combines IN filter with other filters using AND.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "group",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["test", "test2"]
        },
        {
          attribute: "status",
          id: 2,
          predicate: "IS",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "active"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("(group==test,group==test2);status==active");
  });

  it("Combines IN filter with other filters using OR.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: "group",
          id: 1,
          predicate: "IN",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: ["test", "test2"]
        },
        {
          attribute: "status",
          id: 2,
          predicate: "IS",
          searchType: "EXACT_MATCH",
          type: "FILTER_ROW",
          value: "active"
        }
      ],
      id: 6,
      operator: "OR",
      type: "FILTER_GROUP"
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual("(group==test,group==test2),status==active");
  });

  it("Combines multiple groups and operators.", () => {
    const model: FilterGroupModel = {
      type: "FILTER_GROUP",
      operator: "AND",
      id: 1,
      children: [
        {
          type: "FILTER_ROW",
          id: 2,
          attribute: "group",
          predicate: "IN",
          searchType: "EXACT_MATCH",
          value: ["aafc", "cnc"]
        },
        {
          type: "FILTER_GROUP",
          operator: "OR",
          id: 3,
          children: [
            {
              type: "FILTER_ROW",
              id: 4,
              attribute: "createdBy",
              predicate: "IS",
              searchType: "EXACT_MATCH",
              value: "dina-admin"
            },
            {
              type: "FILTER_ROW",
              id: 5,
              attribute: "restrictToCreatedBy",
              predicate: "IS",
              searchType: "EXACT_MATCH",
              value: "false"
            }
          ]
        }
      ]
    };

    const fiqlFilter = fiql(model);
    expect(fiqlFilter).toEqual(
      "(group==aafc,group==cnc);(createdBy==dina-admin,restrictToCreatedBy==false)"
    );
  });

  describe("simpleSearchFilterToFiql", () => {
    it("Converts a FilterParam to fiql correctly.", () => {
      const filterParam: FilterParam = {
        name: { ILIKE: "%test%" },
        description: { EQ: null },
        age: { GT: 18, LT: 65 },
        status: { IN: "active,pending" }
      };

      const fiqlFilter = simpleSearchFilterToFiql(filterParam);
      expect(fiqlFilter).toEqual(
        "name==*test*;description==null;age=gt=18;age=lt=65;status=in=active,pending"
      );
    });

    it("Returns an empty string when no FilterParam is provided.", () => {
      const fiqlFilter = simpleSearchFilterToFiql(undefined);
      expect(fiqlFilter).toEqual("");
    });

    it("Returns an empty string when an empty FilterParam is provided.", () => {
      const fiqlFilter = simpleSearchFilterToFiql({});
      expect(fiqlFilter).toEqual("");
    });
  });
});
