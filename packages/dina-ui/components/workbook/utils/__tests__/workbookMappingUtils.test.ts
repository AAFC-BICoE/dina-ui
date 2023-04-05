import { DataTypeEnum } from "../useWorkbookConverter";
import {
  convertDate,
  convertMap,
  convertNumber,
  convertNumberArray,
  convertStringArray,
  flattenObject,
  getColumnHeaders,
  getDataFromWorkbook,
  isBoolean,
  isBooleanArray,
  isMap,
  isNumber
} from "../workbookMappingUtils";

const mockConfig = {
  mockEntity: {
    stringField: {
      dataType: DataTypeEnum.VOCABULARY,
      vocabularyEndpoint: "/collection-api/vocabulary/materialSampleType"
    },
    numberField: { dataType: DataTypeEnum.NUMBER },
    booleanField: { dataType: DataTypeEnum.BOOLEAN },
    stringArrayField: { dataType: DataTypeEnum.STRING_ARRAY },
    numberArrayField: { dataType: DataTypeEnum.NUMBER_ARRAY },
    mapField: { dataType: DataTypeEnum.MANAGED_ATTRIBUTES },
    objectField: {
      name: { dataType: DataTypeEnum.STRING },
      age: { dataType: DataTypeEnum.NUMBER },
      address: {
        dataType: DataTypeEnum.OBJECT,
        attributes: {
          addressLine1: { dataType: DataTypeEnum.STRING },
          city: { dataType: DataTypeEnum.STRING },
          province: { dataType: DataTypeEnum.STRING },
          postalCode: { dataType: DataTypeEnum.STRING }
        }
      }
    }
  }
};

describe("workbookMappingUtils functions", () => {
  describe("getColumnHeaders", () => {
    test("Basic spreadsheet provided, returns the array of the first column", async () => {
      expect(
        getColumnHeaders(
          {
            "0": [
              { rowNumber: 0, content: ["header1", "header2", "header3"] },
              { rowNumber: 1, content: ["data1", "data2", "data3"] }
            ],
            "1": [
              { rowNumber: 0, content: ["header4", "header5", "header6"] },
              { rowNumber: 1, content: ["data4", "data5", "data6"] }
            ]
          },
          0 // Return first sheet.
        )
      ).toEqual(["header1", "header2", "header3"]);

      expect(
        getColumnHeaders(
          {
            "0": [
              { rowNumber: 0, content: ["header1", "header2", "header3"] },
              { rowNumber: 1, content: ["data1", "data2", "data3"] }
            ],
            "1": [
              { rowNumber: 0, content: ["header4", "header5", "header6"] },
              { rowNumber: 1, content: ["data4", "data5", "data6"] }
            ]
          },
          1 // Return first sheet.
        )
      ).toEqual(["header4", "header5", "header6"]);
    });

    test("Blank first row, use next row as headers", async () => {
      expect(
        getColumnHeaders(
          {
            "0": [
              {
                rowNumber: 0,
                content: []
              },
              {
                rowNumber: 1,
                content: ["header1", "header2", "header3"]
              },
              {
                rowNumber: 2,
                content: ["data1", "data2", "data3"]
              }
            ]
          },
          0
        )
      ).toEqual(["header1", "header2", "header3"]);
    });

    test("Return null if not a valid spreadsheet.", async () => {
      expect(
        getColumnHeaders(
          {
            "0": [
              {
                rowNumber: 0,
                content: []
              }
            ]
          },
          0
        )
      ).toBeNull();
    });
  });

  describe("getData", () => {
    test("get data success", () => {
      expect(
        getDataFromWorkbook(
          {
            "0": [
              { rowNumber: 0, content: ["header1", "header2", "header3"] },
              { rowNumber: 1, content: ["dataA1", "dataA2", "dataA3"] },
              { rowNumber: 2, content: ["dataB1", "dataB2", "dataB3"] },
              { rowNumber: 3, content: ["dataC1", "dataC2", "dataC3"] }
            ],
            "1": [
              { rowNumber: 0, content: ["header4", "header5", "header6"] },
              { rowNumber: 1, content: ["data4", "data5", "data6"] }
            ]
          },
          0, // Return first sheet.
          ["field1", "field2", "field3"]
        )
      ).toEqual([
        {
          field1: "dataA1",
          field2: "dataA2",
          field3: "dataA3"
        },
        {
          field1: "dataB1",
          field2: "dataB2",
          field3: "dataB3"
        },
        {
          field1: "dataC1",
          field2: "dataC2",
          field3: "dataC3"
        }
      ]);
    });
  });

  it("isNumber", () => {
    expect(isNumber("111")).toBeTruthy();
    expect(isNumber("adf")).toBeFalsy();
    expect(isNumber("true")).toBeFalsy();
    expect(isNumber(null)).toBeFalsy();
    expect(isNumber(undefined)).toBeFalsy();
  });

  it("isBoolean", () => {
    expect(isBoolean("true")).toBeTruthy();
    expect(isBoolean("false")).toBeTruthy();
    expect(isBoolean("yes")).toBeTruthy();
    expect(isBoolean("no")).toBeTruthy();
    expect(isBoolean("adf")).toBeFalsy();
    expect(isBoolean("adfyes")).toBeFalsy();
    expect(isBoolean("adf1")).toBeFalsy();
    expect(isBoolean("adf0")).toBeFalsy();
    expect(isBoolean("0")).toBeTruthy();
    expect(isBoolean("1")).toBeTruthy();
  });

  it("isBooleanArray", () => {
    expect(isBooleanArray("yes, false, no, 1")).toBeTruthy();
    expect(isBooleanArray("yesno, yes, no, 1")).toBeFalsy();
  });

  it("isMap", () => {
    expect(isMap("asdfa : asdfas")).toBeTruthy();
    expect(isMap("asdfas: asdfas, adsfasf:asdfasf")).toBeTruthy();
    expect(isMap('asdf:"asdfa  sdfdsf"')).toBeTruthy();
    expect(isMap('asdf:"asdfa sdfdsf" : asd : "sdfsdf "sdf sdf')).toBeFalsy();
    expect(isMap("asdf")).toBeFalsy();
    expect(isMap('asdf:"asdfa sdfdsf')).toBeFalsy();
    expect(isMap('asdf:asdfa sdfdsf", "sdfsdf "sdf sdf')).toBeFalsy();
    expect(isMap('asdf:"asdfa sdfdsf", asd : "sdfsdf "sdf sdf')).toBeFalsy();
  });

  it("convertNumber", () => {
    expect(convertNumber("100")).toEqual(100);
    expect(convertNumber("ssss")).toBeNaN();
    expect(convertNumber(false)).toEqual(0);
    expect(convertNumber(true)).toEqual(1);
    expect(convertNumber(null)).toBeNull();
    expect(convertNumber(undefined)).toBeNull();
  });

  it("convertStringArray", () => {
    expect(convertStringArray("abc, def")).toEqual(["abc", "def"]);
    expect(convertStringArray('abc,"def,ddd"')).toEqual(["abc", "def,ddd"]);
  });

  it("convertNumberArray", () => {
    expect(convertNumberArray("111, 222")).toEqual([111, 222]);
    expect(convertNumberArray("111, 222.22, abcdef, false, ")).toEqual([
      111, 222.22
    ]);
  });

  it("convertMap", () => {
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

  it("convertDate", () => {
    expect(convertDate("43831")).toEqual("2020-01-01");
  });

  it("flattenObject", () => {
    expect(flattenObject(mockConfig)).toEqual({
      "mockEntity.booleanField.dataType": "boolean",
      "mockEntity.mapField.dataType": "managedAttributes",
      "mockEntity.numberArrayField.dataType": "number[]",
      "mockEntity.numberField.dataType": "number",
      "mockEntity.objectField.age.dataType": "number",
      "mockEntity.objectField.name.dataType": "string",
      "mockEntity.stringArrayField.dataType": "string[]",
      "mockEntity.stringField.dataType": "vocabulary",
      "mockEntity.stringField.vocabularyEndpoint":
        "/collection-api/vocabulary/materialSampleType",
      "mockEntity.objectField.address.attributes.addressLine1.dataType":
        "string",
      "mockEntity.objectField.address.attributes.city.dataType": "string",
      "mockEntity.objectField.address.attributes.postalCode.dataType": "string",
      "mockEntity.objectField.address.attributes.province.dataType": "string",
      "mockEntity.objectField.address.dataType": "object"
    });
  });
});
