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
    expect(rsqlFilter).toEqual("number=in=(10,90),number=gt=30;number=lt=50");
  });

  it("Allows a NOT list and range filter.", () => {
    const model: FilterGroupModel = {
      children: [
        {
          attribute: {
            allowRange: true,
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
            allowRange: true,
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
    expect(rsqlFilter).toEqual("number=gt=100;number=lt=200");
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
    expect(rsqlFilter).toEqual("number=gt=100;number=lt=200");
  });
});
