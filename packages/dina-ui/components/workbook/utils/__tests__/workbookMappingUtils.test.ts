import {
  FieldMappingConfigType,
  LinkOrCreateSetting,
  WorkbookDataTypeEnum
} from "../../";
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
  isNumber,
  calculateColumnUniqueValuesFromSpreadsheetData,
  isEmptyWorkbookValue as isEmptyWorkbookValue,
  trimSpace,
  validateTemplateIntegrity
} from "../workbookMappingUtils";

const mockConfig: FieldMappingConfigType = {
  mockEntity: {
    relationshipConfig: {
      type: "mock-entity",
      hasGroup: true,
      baseApiPath: "/fake-api",
      allowAppendData: true,
      fieldColumnLocaleId: "test"
    },
    stringField: {
      dataType: WorkbookDataTypeEnum.VOCABULARY,
      endpoint: "/collection-api/vocabulary2/materialSampleType"
    },
    numberField: { dataType: WorkbookDataTypeEnum.NUMBER },
    booleanField: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    stringArrayField: { dataType: WorkbookDataTypeEnum.STRING_ARRAY },
    numberArrayField: { dataType: WorkbookDataTypeEnum.NUMBER_ARRAY },
    mapField: {
      dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES,
      endpoint: "managed attribute endpoint",
      managedAttributeComponent: "component"
    },
    objectField1: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        hasGroup: true,
        type: "object-field",
        baseApiPath: "apiPath"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        age: { dataType: WorkbookDataTypeEnum.NUMBER },
        address: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          attributes: {
            addressLine1: { dataType: WorkbookDataTypeEnum.STRING },
            city: { dataType: WorkbookDataTypeEnum.STRING },
            province: { dataType: WorkbookDataTypeEnum.STRING },
            postalCode: { dataType: WorkbookDataTypeEnum.STRING }
          }
        }
      }
    },
    objectField2: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        age: { dataType: WorkbookDataTypeEnum.NUMBER },
        address: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          attributes: {
            addressLine1: { dataType: WorkbookDataTypeEnum.STRING },
            city: { dataType: WorkbookDataTypeEnum.STRING },
            province: { dataType: WorkbookDataTypeEnum.STRING },
            postalCode: { dataType: WorkbookDataTypeEnum.STRING }
          }
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
            "0": {
              sheetName: "Test Sheet 0",
              rows: [
                { rowNumber: 0, content: ["header1", "header2", "header3"] },
                { rowNumber: 1, content: ["data1", "data2", "data3"] }
              ]
            },
            "1": {
              sheetName: "Test Sheet 1",
              rows: [
                { rowNumber: 0, content: ["header4", "header5", "header6"] },
                { rowNumber: 1, content: ["data4", "data5", "data6"] }
              ]
            }
          },
          0 // Return first sheet.
        )
      ).toEqual([
        {
          columnHeader: "header1",
          originalColumn: undefined,
          columnAlias: undefined
        },
        {
          columnHeader: "header2",
          originalColumn: undefined,
          columnAlias: undefined
        },
        {
          columnHeader: "header3",
          originalColumn: undefined,
          columnAlias: undefined
        }
      ]);

      expect(
        getColumnHeaders(
          {
            "0": {
              sheetName: "Test Sheet 0",
              rows: [
                { rowNumber: 0, content: ["header1", "header2", "header3"] },
                { rowNumber: 1, content: ["data1", "data2", "data3"] }
              ]
            },
            "1": {
              sheetName: "Test Sheet 1",
              rows: [
                { rowNumber: 0, content: ["header4", "header5", "header6"] },
                { rowNumber: 1, content: ["data4", "data5", "data6"] }
              ]
            }
          },
          1 // Return first sheet.
        )
      ).toEqual([
        {
          columnHeader: "header4",
          originalColumn: undefined,
          columnAlias: undefined
        },
        {
          columnHeader: "header5",
          originalColumn: undefined,
          columnAlias: undefined
        },
        {
          columnHeader: "header6",
          originalColumn: undefined,
          columnAlias: undefined
        }
      ]);
    });

    test("Blank first row, use next row as headers", async () => {
      expect(
        getColumnHeaders(
          {
            "0": {
              sheetName: "Test Sheet 0",
              rows: [
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
            }
          },
          0
        )
      ).toEqual([
        {
          columnHeader: "header1",
          originalColumn: undefined,
          columnAlias: undefined
        },
        {
          columnHeader: "header2",
          originalColumn: undefined,
          columnAlias: undefined
        },
        {
          columnHeader: "header3",
          originalColumn: undefined,
          columnAlias: undefined
        }
      ]);
    });

    test("Original Columns exist in the spreadsheet.", async () => {
      expect(
        getColumnHeaders(
          {
            "0": {
              sheetName: "Test Sheet 0",
              originalColumns: [
                "originalColumn1",
                "originalColumn2",
                "originalColumn3"
              ],
              columnAliases: ["header1", "header2", "header3"],
              rows: [
                { rowNumber: 0, content: ["header1", "header2", "header3"] },
                { rowNumber: 1, content: ["data1", "data2", "data3"] }
              ]
            },
            "1": {
              sheetName: "Test Sheet 1",
              originalColumns: [
                "originalColumn4",
                "originalColumn5",
                "originalColumn6"
              ],
              columnAliases: ["header4", "header5", "header6"],
              rows: [
                { rowNumber: 0, content: [] },
                { rowNumber: 1, content: ["header4", "header5", "header6"] },
                { rowNumber: 2, content: ["data4", "data5", "data6"] }
              ]
            }
          },
          1 // Return first sheet.
        )
      ).toEqual([
        {
          columnHeader: "header4",
          originalColumn: "originalColumn4",
          columnAlias: "header4"
        },
        {
          columnHeader: "header5",
          originalColumn: "originalColumn5",
          columnAlias: "header5"
        },
        {
          columnHeader: "header6",
          originalColumn: "originalColumn6",
          columnAlias: "header6"
        }
      ]);
    });

    test("Invalid template spreadsheet.", async () => {
      expect(
        getColumnHeaders(
          {
            "0": {
              sheetName: "Test Sheet 0",
              originalColumns: [
                "originalColumn1",
                "originalColumn2",
                "originalColumn3"
              ],
              columnAliases: ["header1", "header2", "header3"],
              rows: [
                { rowNumber: 0, content: ["header1", "header2"] },
                { rowNumber: 1, content: ["data1", "data2"] }
              ]
            },
            "1": {
              sheetName: "Test Sheet 1",
              originalColumns: [
                "originalColumn4",
                "originalColumn5",
                "originalColumn6"
              ],
              columnAliases: ["header4", "header5", "header6"],
              rows: [
                { rowNumber: 0, content: [] },
                { rowNumber: 1, content: ["header4", "header5", "header6"] },
                { rowNumber: 2, content: ["data4", "data5", "data6"] }
              ]
            }
          },
          0 // Return first sheet.
        )
      ).toEqual([
        {
          columnHeader: "header1",
          originalColumn: "originalColumn1",
          columnAlias: "header1"
        },
        {
          columnHeader: "header2",
          originalColumn: "originalColumn2",
          columnAlias: "header2"
        },
        {
          columnHeader: "",
          originalColumn: "originalColumn3",
          columnAlias: "header3"
        }
      ]);
    });

    test("Return null if not a valid spreadsheet.", async () => {
      expect(
        getColumnHeaders(
          {
            "0": {
              sheetName: "Test Sheet 0",
              rows: [
                {
                  rowNumber: 0,
                  content: []
                }
              ]
            }
          },
          0
        )
      ).toBeNull();
    });
  });

  describe("validateTemplateIntegrity", () => {
    test("Non-template spreadsheet validation", () => {
      expect(
        validateTemplateIntegrity([
          {
            columnHeader: "header4",
            originalColumn: undefined,
            columnAlias: undefined
          },
          {
            columnHeader: "header5",
            originalColumn: undefined,
            columnAlias: undefined
          },
          {
            columnHeader: "header6",
            originalColumn: undefined,
            columnAlias: undefined
          }
        ])
      ).toEqual(true);
    });

    test("Valid template spreadsheet validation", () => {
      expect(
        validateTemplateIntegrity([
          {
            columnHeader: "header4",
            originalColumn: "originalColumn4",
            columnAlias: "header4"
          },
          {
            columnHeader: "header5",
            originalColumn: "originalColumn5",
            columnAlias: "header5"
          },
          {
            columnHeader: "header6",
            originalColumn: "originalColumn6",
            columnAlias: "header6"
          }
        ])
      ).toEqual(true);
    });

    test("Invalid template spreadsheet validation - changed headers", () => {
      expect(
        validateTemplateIntegrity([
          {
            columnHeader: "header4-changed",
            originalColumn: "originalColumn4",
            columnAlias: "header4"
          },
          {
            columnHeader: "header5",
            originalColumn: "originalColumn5",
            columnAlias: "header5"
          },
          {
            columnHeader: "header6",
            originalColumn: "originalColumn6",
            columnAlias: "header6"
          }
        ])
      ).toEqual(false);

      expect(
        validateTemplateIntegrity([
          {
            columnHeader: "header5",
            originalColumn: "originalColumn4",
            columnAlias: "header4"
          },
          {
            columnHeader: "header4",
            originalColumn: "originalColumn5",
            columnAlias: "header5"
          },
          {
            columnHeader: "header6",
            originalColumn: "originalColumn6",
            columnAlias: "header6"
          }
        ])
      ).toEqual(false);
    });

    test("Invalid template spreadsheet validation - incorrect number of headers", () => {
      expect(
        validateTemplateIntegrity([
          {
            columnHeader: "header4",
            originalColumn: "originalColumn4",
            columnAlias: "header4"
          },
          {
            columnHeader: "header5",
            originalColumn: "originalColumn5",
            columnAlias: "header5"
          },
          {
            columnHeader: "header6",
            originalColumn: undefined,
            columnAlias: undefined
          }
        ])
      ).toEqual(false);

      expect(
        validateTemplateIntegrity([
          {
            columnHeader: "header4",
            originalColumn: "originalColumn4",
            columnAlias: "header4"
          },
          {
            columnHeader: "header5",
            originalColumn: "originalColumn5",
            columnAlias: "header5"
          },
          {
            columnHeader: "",
            originalColumn: "originalColumn6",
            columnAlias: "header6"
          }
        ])
      ).toEqual(false);
    });
  });

  describe("getData", () => {
    test("get data success", () => {
      expect(
        getDataFromWorkbook(
          {
            "0": {
              sheetName: "Test Sheet 0",
              rows: [
                { rowNumber: 0, content: ["header1", "header2", "header3"] },
                { rowNumber: 1, content: ["dataA1", "dataA2", "dataA3"] },
                { rowNumber: 2, content: ["dataB1", "dataB2", "dataB3"] },
                { rowNumber: 3, content: ["dataC1", "dataC2", "dataC3"] }
              ]
            },
            "1": {
              sheetName: "Test Sheet 0",
              rows: [
                { rowNumber: 0, content: ["header4", "header5", "header6"] },
                { rowNumber: 1, content: ["data4", "data5", "data6"] }
              ]
            }
          },
          0, // Return first sheet.
          [
            {
              targetField: "field1",
              skipped: false,
              columnHeader: ""
            },
            {
              targetField: "field2",
              skipped: false,
              columnHeader: ""
            },
            {
              targetField: "field3",
              skipped: false,
              columnHeader: ""
            },
            {
              targetField: "field4",
              skipped: true,
              columnHeader: ""
            }
          ]
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

    test("get data with undefined data", () => {
      expect(
        getDataFromWorkbook(
          undefined,
          0, // Return first sheet.
          [
            { targetField: "field1", skipped: false, columnHeader: "" },
            { targetField: "field2", skipped: false, columnHeader: "" },
            { targetField: "field3", skipped: false, columnHeader: "" }
          ]
        )
      ).toEqual([]);
    });

    test("resolveNumberOfUniqueValueFromSpreadsheetData", () => {
      expect(
        calculateColumnUniqueValuesFromSpreadsheetData({
          "0": {
            sheetName: "Test Sheet 0",
            rows: [
              { rowNumber: 0, content: ["header1", "header2", "header3"] },
              { rowNumber: 1, content: ["dataA1", "dataA2", "dataA3"] },
              { rowNumber: 2, content: ["dataB1", "dataB2", "dataB3"] },
              { rowNumber: 3, content: ["dataB1", "dataB2", "dataB3"] },
              { rowNumber: 4, content: ["dataC1", "dataC2", "dataC3"] },
              { rowNumber: 5, content: ["dataC1", "dataC2", "dataC3"] },
              { rowNumber: 6, content: ["dataC1", "dataC2", "dataC3"] }
            ]
          },
          "1": {
            sheetName: "Test Sheet 1",
            rows: [
              { rowNumber: 0, content: ["header4", "header5", "header6"] },
              { rowNumber: 1, content: ["dataA1", "dataA2", "dataA3"] },
              { rowNumber: 2, content: ["dataB1", "dataB2", "dataB3"] },
              { rowNumber: 3, content: ["dataB1", "dataB2", "dataB3"] },
              { rowNumber: 4, content: ["dataC1", "dataC2", "dataC3"] },
              { rowNumber: 5, content: ["dataC1", "dataC2", "dataC3"] },
              { rowNumber: 6, content: ["dataC1", "dataC2", "dataC3"] }
            ]
          }
        })
      ).toEqual({
        "0": {
          header1: { dataA1: 1, dataB1: 2, dataC1: 3 },
          header2: { dataA2: 1, dataB2: 2, dataC2: 3 },
          header3: { dataA3: 1, dataB3: 2, dataC3: 3 }
        },
        "1": {
          header4: { dataA1: 1, dataB1: 2, dataC1: 3 },
          header5: { dataA2: 1, dataB2: 2, dataC2: 3 },
          header6: { dataA3: 1, dataB3: 2, dataC3: 3 }
        }
      });
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
    expect(isMap("asdfa_1 : asdfas")).toBeTruthy();
    expect(isMap("asdfas: asdfas, adsfasf:asdfasf")).toBeTruthy();
    expect(isMap('asdf:"asdfa  sdfdsf"')).toBeTruthy();
    expect(isMap('asdf:"asdfa sdfdsf" : asd : "sdfsdf "sdf sdf')).toBeFalsy();
    expect(isMap("asdf")).toBeFalsy();
    expect(isMap('asdf:"asdfa sdfdsf')).toBeFalsy();
    expect(isMap('asdf:asdfa sdfdsf", "sdfsdf "sdf sdf')).toBeFalsy();
    expect(isMap('asdf:"asdfa sdfdsf", asd : "sdfsdf "sdf sdf')).toBeFalsy();
    expect(isMap("attr_1:ddddss, attr_2:sssddd")).toBeTruthy();
    expect(isMap("attr_1: 222, attr_2: true")).toBeTruthy();
  });

  it("convertNumber", () => {
    expect(convertNumber("100")).toEqual(100);
    expect(convertNumber("ssss")).toBeNull();
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
      "mockEntity.mapField.endpoint": "managed attribute endpoint",
      "mockEntity.mapField.managedAttributeComponent": "component",
      "mockEntity.numberArrayField.dataType": "number[]",
      "mockEntity.numberField.dataType": "number",
      "mockEntity.stringArrayField.dataType": "string[]",
      "mockEntity.stringField.dataType": "vocabulary",
      "mockEntity.stringField.endpoint":
        "/collection-api/vocabulary2/materialSampleType",
      "mockEntity.objectField1.attributes.address.attributes.addressLine1.dataType":
        "string",
      "mockEntity.objectField1.attributes.address.attributes.city.dataType":
        "string",
      "mockEntity.objectField1.attributes.address.attributes.postalCode.dataType":
        "string",
      "mockEntity.objectField1.attributes.address.attributes.province.dataType":
        "string",
      "mockEntity.objectField1.attributes.address.dataType": "object",
      "mockEntity.objectField1.attributes.age.dataType": "number",
      "mockEntity.objectField1.attributes.name.dataType": "string",
      "mockEntity.objectField1.dataType": "object",
      "mockEntity.objectField1.relationshipConfig.baseApiPath": "apiPath",
      "mockEntity.objectField1.relationshipConfig.hasGroup": true,
      "mockEntity.objectField1.relationshipConfig.linkOrCreateSetting":
        "LINK_OR_CREATE",
      "mockEntity.objectField1.relationshipConfig.type": "object-field",
      "mockEntity.objectField2.attributes.address.attributes.addressLine1.dataType":
        "string",
      "mockEntity.objectField2.attributes.address.attributes.city.dataType":
        "string",
      "mockEntity.objectField2.attributes.address.attributes.postalCode.dataType":
        "string",
      "mockEntity.objectField2.attributes.address.attributes.province.dataType":
        "string",
      "mockEntity.objectField2.attributes.address.dataType": "object",
      "mockEntity.objectField2.attributes.age.dataType": "number",
      "mockEntity.objectField2.attributes.name.dataType": "string",
      "mockEntity.objectField2.dataType": "object",
      "mockEntity.relationshipConfig.baseApiPath": "/fake-api",
      "mockEntity.relationshipConfig.hasGroup": true,
      "mockEntity.relationshipConfig.type": "mock-entity",
      "mockEntity.relationshipConfig.allowAppendData": true,
      "mockEntity.relationshipConfig.fieldColumnLocaleId": "test"
    });
  });

  it("isEmptyValue", () => {
    expect(isEmptyWorkbookValue(null)).toBeTruthy();
    expect(isEmptyWorkbookValue(undefined)).toBeTruthy();
    expect(isEmptyWorkbookValue("")).toBeTruthy();
    expect(isEmptyWorkbookValue([])).toBeTruthy();
    expect(isEmptyWorkbookValue({})).toBeTruthy();
    expect(isEmptyWorkbookValue({ relationshipConfig: {} })).toBeTruthy();
    expect(
      isEmptyWorkbookValue({ a: "", relationshipConfig: {} })
    ).toBeTruthy();
    expect(
      isEmptyWorkbookValue({ a: "", b: [], relationshipConfig: {} })
    ).toBeTruthy();
    expect(
      isEmptyWorkbookValue({
        a: { nested: "", relationshipConfig: {} },
        relationshipConfig: {}
      })
    ).toBeTruthy();

    expect(isEmptyWorkbookValue([null])).toBeTruthy();
    expect(isEmptyWorkbookValue([undefined])).toBeTruthy();
    expect(isEmptyWorkbookValue([""])).toBeTruthy();
    expect(isEmptyWorkbookValue([[]])).toBeTruthy();
    expect(isEmptyWorkbookValue([{}])).toBeTruthy();
    expect(isEmptyWorkbookValue([{ relationshipConfig: {} }])).toBeTruthy();
    expect(
      isEmptyWorkbookValue([{ a: "", relationshipConfig: {} }])
    ).toBeTruthy();
    expect(
      isEmptyWorkbookValue([{ a: "", b: [], relationshipConfig: {} }])
    ).toBeTruthy();
    expect(
      isEmptyWorkbookValue([
        { a: { nested: "", relationshipConfig: {} }, relationshipConfig: {} }
      ])
    ).toBeTruthy();

    expect(isEmptyWorkbookValue(0)).toBeFalsy();
    expect(isEmptyWorkbookValue(1)).toBeFalsy();
    expect(isEmptyWorkbookValue(true)).toBeFalsy();
    expect(isEmptyWorkbookValue(false)).toBeFalsy();
    expect(isEmptyWorkbookValue([0])).toBeFalsy();
    expect(isEmptyWorkbookValue({ a: 10 })).toBeFalsy();
    expect(isEmptyWorkbookValue({ a: 10, relationshipConfig: {} })).toBeFalsy();
    expect(
      isEmptyWorkbookValue({
        a: { nested: "value", relationshipConfig: {} },
        relationshipConfig: {}
      })
    ).toBeFalsy();

    expect(isEmptyWorkbookValue([0])).toBeFalsy();
    expect(isEmptyWorkbookValue([1])).toBeFalsy();
    expect(isEmptyWorkbookValue([true])).toBeFalsy();
    expect(isEmptyWorkbookValue([false])).toBeFalsy();
    expect(isEmptyWorkbookValue([[0]])).toBeFalsy();
    expect(isEmptyWorkbookValue([{ a: 10 }])).toBeFalsy();
    expect(
      isEmptyWorkbookValue([{ a: 10, relationshipConfig: {} }])
    ).toBeFalsy();
    expect(
      isEmptyWorkbookValue([
        {
          a: { nested: "value", relationshipConfig: {} },
          relationshipConfig: {}
        }
      ])
    ).toBeFalsy();
  });

  it("trimSpace", () => {
    expect(
      trimSpace({
        "0": {
          sheetName: "Test Sheet 0",
          rows: [
            { rowNumber: 0, content: ["header1 ", "header2 ", "header3 "] },
            { rowNumber: 1, content: ["data1 ", " data2", " data3"] }
          ]
        },
        "1": {
          sheetName: "Test Sheet 1",
          rows: [
            { rowNumber: 0, content: ["header4 ", " header5", "header6 "] },
            { rowNumber: 1, content: ["data4 ", " data5", "data6 "] }
          ]
        }
      })
    ).toEqual({
      "0": {
        sheetName: "Test Sheet 0",
        rows: [
          { rowNumber: 0, content: ["header1", "header2", "header3"] },
          { rowNumber: 1, content: ["data1", "data2", "data3"] }
        ]
      },
      "1": {
        sheetName: "Test Sheet 1",
        rows: [
          { rowNumber: 0, content: ["header4", "header5", "header6"] },
          { rowNumber: 1, content: ["data4", "data5", "data6"] }
        ]
      }
    });
  });
});
