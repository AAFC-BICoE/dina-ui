import { useFieldConverters } from "../useFieldConverters";

const mockConfig = {
  mockEntity: [
    { field: "stringField", dataType: "string" },
    { field: "numberField", dataType: "number" },
    { field: "booleanField", dataType: "boolean" },
    { field: "stringArrayField", dataType: "string[]" },
    { field: "numberArrayField", dataType: "number[]" },
    { field: "mapField", dataType: "Map" }
  ]
};

describe("useFieldConverter", () => {
  const { getConverter } = useFieldConverters(mockConfig);

  it("getConverter", () => {
    expect(() => {
      getConverter("wrongEntity", "stringField");
    }).toThrowError("Unknown entity name: wrongEntity");
    expect(() => {
      getConverter("mockEntity", "wrongField");
    }).toThrowError("Unknown field name: mockEntity.wrongField");
  });

  it("convertString", () => {
    const convert = getConverter("mockEntity", "stringField");
    expect(convert("abc")).toEqual("abc");
    expect(convert(null)).toBeNull();
    expect(convert(undefined)).toBeUndefined();
  });

  it("convertNumber", () => {
    const convertNumber = getConverter("mockEntity", "numberField");

    expect(convertNumber("100")).toEqual(100);
    expect(convertNumber("ssss")).toBeNaN();
    expect(convertNumber(false)).toEqual(0);
    expect(convertNumber(true)).toEqual(1);
    expect(convertNumber(null)).toBeNull();
    expect(convertNumber(undefined)).toBeUndefined();
  });

  it("convertStringArray", () => {
    const convertStringArray = getConverter("mockEntity", "stringArrayField");
    expect(convertStringArray("abc, def")).toEqual(["abc", "def"]);
    expect(convertStringArray('abc,"def,ddd"')).toEqual(["abc", "def,ddd"]);
  });

  it("convertNumberArray", () => {
    const convertNumberArray = getConverter("mockEntity", "numberArrayField");

    expect(convertNumberArray("111, 222")).toEqual([111, 222]);
    expect(convertNumberArray("111, 222.22, abcdef, false, ")).toEqual([
      111, 222.22
    ]);
  });

  it("convertMap", () => {
    const convertMap = getConverter("mockEntity", "mapField");
    expect(convertMap("key1:value1, key2 : 2, key3 : false")).toEqual({
      key1: "value1",
      key2: 2,
      key3: false
    });
    expect(convertMap('key1:"value1 with , and :"')).toEqual({
      key1: "value1 with , and :"
    });
    expect(convertMap("key1: , :value2, key3:value3")).toEqual({
      key3: "value3"
    });
    expect(convertMap("223:value3")).toEqual({ "223": "value3" });
    expect(convertMap("223ddd:value3")).toEqual({ "223ddd": "value3" });
  });
});
