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
              type: "FILTER_ROW",
              value: "101F"
            },
            {
              attribute: "group.groupName",
              id: 3,
              predicate: "IS",
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
});
