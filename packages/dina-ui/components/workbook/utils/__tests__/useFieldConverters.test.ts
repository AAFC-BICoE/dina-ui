import { DataTypeEnum, useFieldConverters } from "../useFieldConverters";

const mockConfig = {
  mockEntity: {
    stringField: { dataType: DataTypeEnum.STRING },
    numberField: { dataType: DataTypeEnum.NUMBER },
    booleanField: { dataType: DataTypeEnum.BOOLEAN },
    stringArrayField: { dataType: DataTypeEnum.STRING_ARRAY },
    numberArrayField: { dataType: DataTypeEnum.NUMBER_ARRAY },
    mapField: { dataType: DataTypeEnum.MANAGED_ATTRIBUTES }
  }
};

describe("useFieldConverter", () => {
  const { getConverter } = useFieldConverters(mockConfig);

  it("getConverter", () => {
    expect(() => {
      getConverter("wrongEntity", "stringField");
    }).toThrowError("Unknown entity type: wrongEntity");
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
    expect(convertNumber(null)).toBeNull();
    expect(convertNumber(undefined)).toBeNull();
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

  it("convertBoolean", () => {
    const convertBoolean = getConverter("mockEntity", "booleanField");
    expect(convertBoolean).toBeDefined();
    expect(convertBoolean("yes")).toBeTruthy();
    expect(convertBoolean("no")).toBeFalsy();
    expect(convertBoolean("true")).toBeTruthy();
    expect(convertBoolean("false")).toBeFalsy();
    expect(convertBoolean(true)).toBeTruthy();
    expect(convertBoolean(false)).toBeFalsy();
    expect(convertBoolean(1)).toBeTruthy();
    expect(convertBoolean(0)).toBeFalsy();
    expect(convertBoolean("YES")).toBeTruthy();
    expect(convertBoolean("NO")).toBeFalsy();
    expect(convertBoolean("True")).toBeTruthy();
    expect(convertBoolean("False")).toBeFalsy();
    expect(convertBoolean("unknow")).toBeTruthy();
    expect(convertBoolean("")).toBeFalsy();
  });
});
