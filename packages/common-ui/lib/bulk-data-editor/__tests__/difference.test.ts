import { difference } from "../difference";

describe("difference function", () => {
  it("Returns the difference between two objects", () => {
    const obj1 = {
      attr1: "original value",
      attr2: "original value",
      nestedObject: {
        attr1: "original value",
        attr2: "original value"
      }
    };
    const obj2 = {
      attr1: "original value",
      attr2: "new value",
      nestedObject: {
        attr1: "original value",
        attr2: "new value"
      }
    };

    expect(difference(obj2, obj1)).toEqual({
      attr2: "new value",
      nestedObject: {
        attr2: "new value"
      }
    });
  });
});
