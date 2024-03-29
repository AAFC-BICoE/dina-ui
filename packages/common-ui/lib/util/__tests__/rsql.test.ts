import { filterBy } from "../rsql";

describe("filterBy function", () => {
  it("Generates an rsql string for one field.", () => {
    const rsqlFilter = filterBy(["attribute"])("value");
    expect(rsqlFilter).toEqual({ rsql: "attribute==*value*" });
  });

  it("Generates an rsql string for multiple fields.", () => {
    const rsqlFilter = filterBy(["attribute1", "attribute2"])("value");
    expect(rsqlFilter).toEqual({
      rsql: "attribute1==*value*,attribute2==*value*"
    });
  });

  it("Allows extra object filters to be passed in.", () => {
    const rsqlFilter = filterBy(["attribute1", "attribute2"], {
      extraFilters: [
        {
          selector: "attribute3",
          arguments: "test-search-value",
          comparison: "=="
        }
      ],
      nullValueFilters: { parent: null }
    })("value");
    expect(rsqlFilter).toEqual({
      rsql: "(attribute1==*value*,attribute2==*value*);attribute3==test-search-value",
      parent: null
    });
  });

  it("Omits the main filter attributes when the input is blank.", () => {
    const rsqlFilter = filterBy(["attribute1", "attribute2"], {
      extraFilters: [
        {
          selector: "attribute3",
          arguments: "test-search-value",
          comparison: "=="
        }
      ]
    })("");
    expect(rsqlFilter).toEqual({
      rsql: "attribute3==test-search-value"
    });
  });
});
