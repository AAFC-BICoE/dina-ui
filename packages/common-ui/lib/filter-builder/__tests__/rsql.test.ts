import { FilterGroupModel } from "../FilterGroup";
import { rsql } from "../rsql";

describe("rsql conversion", () => {
  it("Converts from a filter model to rsql.", () => {
    const rsqlFilter = rsql({
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

    expect(rsqlFilter).toEqual(
      "(name==101F,group.groupName==poffm);name!=1075R"
    );
  });

  it("Returns a blank string when no filter is passed.", () => {
    const rsqlFilter = rsql(null);
    expect(rsqlFilter).toEqual("");
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
    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("name==*101F*");
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
    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("name==101F");
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

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("description==null,description==''");
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

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("description!=null;description!=''");
  });

  it("Allows a list and range filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowRange: true,
            allowList: true,
            label: "Number",
            name: "number"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "10,30-50,90"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("number=in=(10,90),number=ge=30;number=le=50");
  });

  it("Allows a list but no range filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowRange: false,
            allowList: true,
            label: "Number",
            name: "number"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "10,30-50,90"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("number=in=(10,30-50,90)");
  });

  it("Allows a NOT list and range filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowRange: true,
            allowList: true,
            label: "Number",
            name: "number"
          },
          id: 1,
          predicate: "IS NOT",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "10,30-50,90"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual(
      "number=out=(10,90);(number=lt=30,number=gt=50)"
    );
  });

  it("Allows a list filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowList: true,
            label: "Number",
            name: "number"
          },
          id: 1,
          predicate: "IS",
          searchType: "PARTIAL_MATCH",
          type: "FILTER_ROW",
          value: "10,60,90"
        }
      ],
      id: 6,
      operator: "AND",
      type: "FILTER_GROUP"
    };

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("number=in=(10,60,90)");
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

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("number=ge=100;number=le=200");
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

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("number=ge=100;number=le=200");
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

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual(
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

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual(
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

    const rsqlFilter = rsql(model);
    // Greater than or equal to {beginning of day}:
    expect(rsqlFilter).toEqual("myDateField=ge=2020-10-06T00:00:00+00:00");
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

    const rsqlFilter = rsql(model);
    // Less than or equal to {end of day}:
    expect(rsqlFilter).toEqual("myDateField=le=2020-10-06T23:59:59+00:00");
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

    const rsqlFilter = rsql(model);
    // From the beginning date to the end date:
    expect(rsqlFilter).toEqual(
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

    const rsqlFilter = rsql(model);
    // From the beginning date to the end date:
    expect(rsqlFilter).toEqual(
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

    const rsqlFilter = rsql(model);
    expect(rsqlFilter).toEqual("acMetadataCreator==null");
  });
});
