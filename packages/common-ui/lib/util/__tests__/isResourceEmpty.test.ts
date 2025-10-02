import { isResourceEmpty } from "../isResourceEmpty";

describe("isResourceEmpty", () => {
  it('Should return true if the object only contains "id" and "type"', () => {
    expect(isResourceEmpty({ id: "123", type: "test" })).toBe(true);
  });

  it("Should return true if the object only contains id and type with undefined keys", () => {
    expect(
      isResourceEmpty({
        id: "019934d2-126a-73eb-808c-380b3b46f9ff",
        type: "metadata",
        acSubType: undefined
      })
    ).toBe(true);
  });

  it("Should return false if the object has more than two properties", () => {
    expect(isResourceEmpty({ id: "123", type: "test", name: "John" })).toBe(
      false
    );
  });

  it("Should return false if the object has only one property", () => {
    expect(isResourceEmpty({ id: "123" })).toBe(false);
  });

  it("Should return false if the object is empty", () => {
    expect(isResourceEmpty({})).toBe(false);
  });

  it("Should return true if null or undefined provided.", () => {
    expect(isResourceEmpty(undefined)).toBe(true);
    expect(isResourceEmpty(null)).toBe(true);
  });

  it('Should return false if the object does not have "id" property', () => {
    expect(isResourceEmpty({ type: "test", name: "John" })).toBe(false);
  });

  it('Should return false if the object does not have "type" property', () => {
    expect(isResourceEmpty({ id: "123", name: "John" })).toBe(false);
  });
});
