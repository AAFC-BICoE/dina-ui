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
});
