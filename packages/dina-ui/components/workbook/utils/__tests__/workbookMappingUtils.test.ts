import {
  convertDateTime,
  detectEntityType,
  FieldMappingConfigType,
  isDate,
  isDateTime,
  LinkOrCreateSetting,
  WorkbookDataTypeEnum,
  WorkbookJSON
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

  describe("isDate", () => {
    describe("Valid inputs", () => {
      it("should accept valid ISO date string", () => {
        expect(isDate("2025-11-14")).toBe(true);
        expect(isDate("2020-01-01")).toBe(true);
      });

      it("should accept dates with whitespace", () => {
        expect(isDate("  2025-11-14  ")).toBe(true);
        expect(isDate("  2020-01-01\n")).toBe(true);
      });

      it("should accept leap years correctly", () => {
        expect(isDate("2020-02-29")).toBe(true);
        expect(isDate("2024-02-29")).toBe(true);
      });

      it("should accept edge case dates", () => {
        expect(isDate("1900-01-01")).toBe(true);
        expect(isDate("2099-12-31")).toBe(true);
      });

      it("should accept empty string", () => {
        expect(isDate("")).toBe(true);
        expect(isDate("   ")).toBe(true);
      });
    });

    describe("Null/undefined values", () => {
      it("should return false for null", () => {
        expect(isDate(null)).toBe(false);
      });

      it("should return false for undefined", () => {
        expect(isDate(undefined)).toBe(false);
      });
    });

    describe("Invalid inputs", () => {
      it("should reject invalid date format", () => {
        expect(isDate("11/14/2025")).toBe(false);
        expect(isDate("January 1, 2020")).toBe(false);
        expect(isDate("2025-1-1")).toBe(false);
        expect(isDate("25-11-14")).toBe(false);
      });

      it("should reject invalid dates", () => {
        expect(isDate("2023-02-30")).toBe(false);
        expect(isDate("2023-13-01")).toBe(false);
        expect(isDate("2023-00-01")).toBe(false);
        expect(isDate("2023-01-32")).toBe(false);
        expect(isDate("2021-02-29")).toBe(false); // Not a leap year
      });

      it("should reject non-string types", () => {
        expect(isDate(true as any)).toBe(false);
        expect(isDate(false as any)).toBe(false);
        expect(isDate([] as any)).toBe(false);
        expect(isDate({} as any)).toBe(false);
        expect(isDate(43831 as any)).toBe(false);
        expect(isDate(new Date() as any)).toBe(false);
      });
    });
  });

  describe("isDateTime", () => {
    describe("Valid inputs", () => {
      it("should accept valid ISO datetime string", () => {
        expect(isDateTime("2025-11-14T12:30:45.000")).toBe(true);
        expect(isDateTime("2020-01-01T00:00:00.000Z")).toBe(true);
      });

      it("should accept datetime without milliseconds", () => {
        expect(isDateTime("2025-11-14T12:30:45")).toBe(true);
      });

      it("should accept date-only format", () => {
        expect(isDateTime("2025-11-14")).toBe(true);
        expect(isDateTime("2020-01-01")).toBe(true);
      });

      it("should accept datetimes with whitespace", () => {
        expect(isDateTime("  2025-11-14T12:00:00.000  ")).toBe(true);
        expect(isDateTime("  2020-01-01  ")).toBe(true);
      });

      it("should accept various times correctly", () => {
        expect(isDateTime("2025-11-14T00:00:00.000Z")).toBe(true); // Midnight
        expect(isDateTime("2025-11-14T23:59:59.999Z")).toBe(true); // End of day
        expect(isDateTime("2025-11-14T12:00:00.000Z")).toBe(true); // Noon
      });

      it("should accept leap year dates", () => {
        expect(isDateTime("2020-02-29T10:30:00.000Z")).toBe(true);
      });

      it("should accept empty string", () => {
        expect(isDateTime("")).toBe(true);
        expect(isDateTime("   ")).toBe(true);
      });
    });

    describe("Null/undefined values", () => {
      it("should return false for null", () => {
        expect(isDateTime(null)).toBe(false);
      });

      it("should return false for undefined", () => {
        expect(isDateTime(undefined)).toBe(false);
      });
    });

    describe("Invalid inputs", () => {
      it("should reject invalid datetime format", () => {
        expect(isDateTime("11/14/2025, 12:00 AM")).toBe(false);
        expect(isDateTime("January 1, 2020")).toBe(false);
        expect(isDateTime("2025-11-14 12:00:00")).toBe(false); // Missing T separator
      });

      it("should reject datetime with timezone offset", () => {
        expect(isDateTime("2025-11-14T12:00:00+05:00")).toBe(false);
        expect(isDateTime("2025-11-14T12:00:00-08:00")).toBe(false);
      });

      it("should reject invalid dates", () => {
        expect(isDateTime("2023-02-30T12:00:00.000")).toBe(false);
        expect(isDateTime("2023-13-01T12:00:00.000Z")).toBe(false);
        expect(isDateTime("2021-02-29T12:00:00.000")).toBe(false); // Not a leap year
      });

      it("should reject invalid times", () => {
        expect(isDateTime("2025-11-14T25:00:00.000")).toBe(false); // Invalid hour
        expect(isDateTime("2025-11-14T12:60:00.000Z")).toBe(false); // Invalid minute
        expect(isDateTime("2025-11-14T12:00:60.000")).toBe(false); // Invalid second
      });

      it("should reject non-string types", () => {
        expect(isDateTime(true as any)).toBe(false);
        expect(isDateTime(false as any)).toBe(false);
        expect(isDateTime([] as any)).toBe(false);
        expect(isDateTime({} as any)).toBe(false);
        expect(isDateTime(43831 as any)).toBe(false);
        expect(isDateTime(new Date() as any)).toBe(false);
      });
    });
  });

  describe("convertDate", () => {
    describe("Valid inputs", () => {
      it("should convert valid ISO date string", () => {
        expect(convertDate("2025-11-14")).toBe("2025-11-14");
        expect(convertDate("2020-01-01")).toBe("2020-01-01");
      });

      it("should trim whitespace and convert", () => {
        expect(convertDate("  2025-11-14  ")).toBe("2025-11-14");
        expect(convertDate("  2020-01-01\n")).toBe("2020-01-01");
      });

      it("should handle leap years correctly", () => {
        expect(convertDate("2020-02-29")).toBe("2020-02-29");
        expect(convertDate("2024-02-29")).toBe("2024-02-29");
      });

      it("should handle edge case dates", () => {
        expect(convertDate("1900-01-01")).toBe("1900-01-01");
        expect(convertDate("2099-12-31")).toBe("2099-12-31");
      });
    });

    describe("Null/empty values passthrough", () => {
      it("should return null for null", () => {
        expect(convertDate(null)).toBeNull();
      });

      it("should return undefined for undefined", () => {
        expect(convertDate(undefined)).toBeUndefined();
      });

      it("should return empty string for empty string", () => {
        expect(convertDate("")).toBe("");
      });

      it("should return whitespace-only string as-is", () => {
        expect(convertDate("   ")).toBe("   ");
        expect(convertDate("\t")).toBe("\t");
      });
    });

    describe("Invalid inputs return null", () => {
      it("should return null for invalid date format", () => {
        expect(convertDate("11/14/2025")).toBeNull();
        expect(convertDate("January 1, 2020")).toBeNull();
        expect(convertDate("2025-1-1")).toBeNull();
        expect(convertDate("25-11-14")).toBeNull();
      });

      it("should return null for invalid dates", () => {
        expect(convertDate("2023-02-30")).toBeNull();
        expect(convertDate("2023-13-01")).toBeNull();
        expect(convertDate("2023-00-01")).toBeNull();
        expect(convertDate("2023-01-32")).toBeNull();
        expect(convertDate("2021-02-29")).toBeNull(); // Not a leap year
      });

      it("should return null for boolean values", () => {
        expect(convertDate(true)).toBeNull();
        expect(convertDate(false)).toBeNull();
      });

      it("should return null for arrays", () => {
        expect(convertDate([])).toBeNull();
        expect(convertDate(["2025-11-14"])).toBeNull();
      });

      it("should return null for objects", () => {
        expect(convertDate({})).toBeNull();
        expect(convertDate({ date: "2025-11-14" })).toBeNull();
      });

      it("should return null for numbers", () => {
        expect(convertDate(43831)).toBeNull();
        expect(convertDate(0)).toBeNull();
      });

      it("should return null for Date objects", () => {
        expect(convertDate(new Date())).toBeNull();
      });
    });
  });

  describe("convertDateTime", () => {
    describe("Valid inputs", () => {
      it("should convert valid ISO datetime string", () => {
        expect(convertDateTime("2025-11-14T12:30:45.000")).toBe(
          "2025-11-14T12:30:45.000Z"
        );
        expect(convertDateTime("2020-01-01T00:00:00.000Z")).toBe(
          "2020-01-01T00:00:00.000Z"
        );
      });

      it("should convert datetime without milliseconds", () => {
        expect(convertDateTime("2025-11-14T12:30:45")).toBe(
          "2025-11-14T12:30:45.000Z"
        );
      });

      it("should convert date-only format with default time", () => {
        expect(convertDateTime("2025-11-14")).toBe("2025-11-14T00:00:00.000Z");
        expect(convertDateTime("2020-01-01")).toBe("2020-01-01T00:00:00.000Z");
      });

      it("should trim whitespace and convert", () => {
        expect(convertDateTime("  2025-11-14T12:00:00.000  ")).toBe(
          "2025-11-14T12:00:00.000Z"
        );
        expect(convertDateTime("  2020-01-01  ")).toBe(
          "2020-01-01T00:00:00.000Z"
        );
      });

      it("should handle various times correctly", () => {
        expect(convertDateTime("2025-11-14T00:00:00.000Z")).toBe(
          "2025-11-14T00:00:00.000Z"
        ); // Midnight
        expect(convertDateTime("2025-11-14T23:59:59.999Z")).toBe(
          "2025-11-14T23:59:59.999Z"
        ); // End of day
        expect(convertDateTime("2025-11-14T12:00:00.000Z")).toBe(
          "2025-11-14T12:00:00.000Z"
        ); // Noon
      });

      it("should handle leap year dates", () => {
        expect(convertDateTime("2020-02-29T10:30:00.000Z")).toBe(
          "2020-02-29T10:30:00.000Z"
        );
      });
    });

    describe("Null/empty values passthrough", () => {
      it("should return null for null", () => {
        expect(convertDateTime(null)).toBeNull();
      });

      it("should return undefined for undefined", () => {
        expect(convertDateTime(undefined)).toBeUndefined();
      });

      it("should return empty string for empty string", () => {
        expect(convertDateTime("")).toBe("");
      });

      it("should return whitespace-only string as-is", () => {
        expect(convertDateTime("   ")).toBe("   ");
      });
    });

    describe("Invalid inputs return null", () => {
      it("should return null for invalid datetime format", () => {
        expect(convertDateTime("11/14/2025, 12:00 AM")).toBeNull();
        expect(convertDateTime("January 1, 2020")).toBeNull();
        expect(convertDateTime("2025-11-14 12:00:00")).toBeNull(); // Missing T separator
      });

      it("should return null for datetime with timezone offset", () => {
        expect(convertDateTime("2025-11-14T12:00:00+05:00")).toBeNull();
        expect(convertDateTime("2025-11-14T12:00:00-08:00")).toBeNull();
      });

      it("should return null for invalid dates", () => {
        expect(convertDateTime("2023-02-30T12:00:00.000")).toBeNull();
        expect(convertDateTime("2023-13-01T12:00:00.000Z")).toBeNull();
        expect(convertDateTime("2021-02-29T12:00:00.000")).toBeNull(); // Not a leap year
      });

      it("should return null for invalid times", () => {
        expect(convertDateTime("2025-11-14T25:00:00.000")).toBeNull(); // Invalid hour
        expect(convertDateTime("2025-11-14T12:60:00.000Z")).toBeNull(); // Invalid minute
        expect(convertDateTime("2025-11-14T12:00:60.000")).toBeNull(); // Invalid second
      });

      it("should return null for boolean values", () => {
        expect(convertDateTime(true)).toBeNull();
        expect(convertDateTime(false)).toBeNull();
      });

      it("should return null for arrays", () => {
        expect(convertDateTime([])).toBeNull();
      });

      it("should return null for objects", () => {
        expect(convertDateTime({})).toBeNull();
      });

      it("should return null for numbers", () => {
        expect(convertDateTime(43831)).toBeNull();
        expect(convertDateTime(43831.5)).toBeNull();
      });

      it("should return null for Date objects", () => {
        expect(convertDateTime(new Date())).toBeNull();
      });
    });

    describe("Output format", () => {
      it("should return datetime with Z suffix", () => {
        const result = convertDateTime("2025-11-14T12:30:45.000");
        expect(result).toContain("Z");
        expect(result).not.toMatch(/[+-]\d{2}:\d{2}$/);
      });

      it("should treat all inputs as local time", () => {
        const result = convertDateTime("2025-11-14T12:00:00.000");
        expect(result).toBe("2025-11-14T12:00:00.000Z");
      });
    });
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

  describe("detectEntityType", () => {
    describe("regular column header detection", () => {
      it("should detect metadata type from characteristic columns", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            rows: [
              { rowNumber: 0, content: ["fileName", "dcCreator", "acCaption"] },
              { rowNumber: 1, content: ["test.jpg", "John Doe", "A bird"] }
            ]
          }
        };

        expect(detectEntityType(spreadsheet)).toBe("metadata");
      });

      it("should detect material-sample type from characteristic columns", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            rows: [
              {
                rowNumber: 0,
                content: ["materialSampleName", "collection", "barcode"]
              },
              {
                rowNumber: 1,
                content: ["SAMPLE-001", "Main Collection", "123456"]
              }
            ]
          }
        };

        expect(detectEntityType(spreadsheet)).toBe("material-sample");
      });

      it("should default to material-sample for ambiguous columns", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            rows: [
              { rowNumber: 0, content: ["notes", "date", "location"] },
              { rowNumber: 1, content: ["Some notes", "2024-01-01", "Lab"] }
            ]
          }
        };

        expect(detectEntityType(spreadsheet)).toBe("material-sample");
      });

      it("should default to material-sample for empty spreadsheet", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            rows: [{ rowNumber: 0, content: [] }]
          }
        };

        expect(detectEntityType(spreadsheet)).toBe("material-sample");
      });

      it("should detect metadata even with mixed columns if metadata score is higher", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            rows: [
              {
                rowNumber: 0,
                content: [
                  "fileName",
                  "dcCreator",
                  "dcType",
                  "acCaption",
                  "collection"
                ]
              },
              {
                rowNumber: 1,
                content: ["test.jpg", "John Doe", "IMAGE", "A bird", "Main"]
              }
            ]
          }
        };

        // 4 metadata indicators vs 1 material-sample indicator
        expect(detectEntityType(spreadsheet)).toBe("metadata");
      });
    });

    describe("template-based detection (originalColumns)", () => {
      it("should detect metadata type from template originalColumns", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            originalColumns: [
              "originalFilename",
              "dcCreator.displayName",
              "acCaption"
            ],
            columnAliases: ["File Name", "Creator", "Caption"],
            rows: [
              { rowNumber: 0, content: ["File Name", "Creator", "Caption"] },
              { rowNumber: 1, content: ["test.jpg", "John Doe", "A bird"] }
            ]
          }
        };

        expect(detectEntityType(spreadsheet)).toBe("metadata");
      });

      it("should detect material-sample type from template originalColumns", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            originalColumns: [
              "materialSampleName",
              "collection.name",
              "collectingEvent.dwcRecordNumber"
            ],
            columnAliases: ["Identifier", "Collection", "Collector Number"],
            rows: [
              {
                rowNumber: 0,
                content: ["Identifier", "Collection", "Collector Number"]
              },
              { rowNumber: 1, content: ["SAMPLE-001", "Main", "123"] }
            ]
          }
        };

        expect(detectEntityType(spreadsheet)).toBe("material-sample");
      });

      it("should prioritize template originalColumns over column headers", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            // Template says it's metadata
            originalColumns: ["fileName", "dcCreator.displayName"],
            // But user renamed columns to look like material-sample
            columnAliases: ["File Name", "Creator"],
            rows: [
              {
                rowNumber: 0,
                content: ["materialSampleName", "collection"] // User renamed these!
              },
              { rowNumber: 1, content: ["test.jpg", "John Doe"] }
            ]
          }
        };

        // Should use originalColumns (metadata), not user-modified headers
        expect(detectEntityType(spreadsheet)).toBe("metadata");
      });

      it("should fall back to header detection if originalColumns are ambiguous", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            originalColumns: [
              "remarks", // Ambiguous - both types have this
              "tags" // Ambiguous - both types have this
            ],
            columnAliases: ["Remarks", "Tags"],
            rows: [
              { rowNumber: 0, content: ["Remarks", "Tags"] },
              { rowNumber: 1, content: ["Some notes", "tag1, tag2"] }
            ]
          }
        };

        // originalColumns don't match strong indicators, fall back to default
        expect(detectEntityType(spreadsheet)).toBe("material-sample");
      });

      it("should detect metadata from dcType in originalColumns", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            originalColumns: ["dcType", "acSubtype", "orientation"],
            columnAliases: ["Object Type", "Subtype", "Orientation"],
            rows: [
              {
                rowNumber: 0,
                content: ["Object Type", "Subtype", "Orientation"]
              },
              { rowNumber: 1, content: ["IMAGE", "photograph", "1"] }
            ]
          }
        };

        expect(detectEntityType(spreadsheet)).toBe("metadata");
      });

      it("should detect material-sample from preparationType in originalColumns", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            originalColumns: [
              "preparationType.name",
              "storageUnit.name",
              "organism.lifeStage"
            ],
            columnAliases: ["Preparation Type", "Storage", "Life Stage"],
            rows: [
              {
                rowNumber: 0,
                content: ["Preparation Type", "Storage", "Life Stage"]
              },
              {
                rowNumber: 1,
                content: ["whole specimen", "Cabinet A", "adult"]
              }
            ]
          }
        };

        expect(detectEntityType(spreadsheet)).toBe("material-sample");
      });

      it("should handle empty originalColumns array", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Sheet1",
            originalColumns: [], // Empty array
            rows: [
              { rowNumber: 0, content: ["fileName", "dcCreator"] },
              { rowNumber: 1, content: ["test.jpg", "John Doe"] }
            ]
          }
        };

        // Should fall back to regular header detection
        expect(detectEntityType(spreadsheet)).toBe("metadata");
      });
    });

    describe("edge cases", () => {
      it("should handle missing sheet data", () => {
        const spreadsheet: WorkbookJSON = {};
        expect(detectEntityType(spreadsheet, 0)).toBe("material-sample");
      });

      it("should handle specified sheet index", () => {
        const spreadsheet: WorkbookJSON = {
          "0": {
            sheetName: "Material Samples",
            rows: [
              { rowNumber: 0, content: ["materialSampleName"] },
              { rowNumber: 1, content: ["SAMPLE-001"] }
            ]
          },
          "1": {
            sheetName: "Metadata",
            rows: [
              { rowNumber: 0, content: ["fileName", "dcCreator"] },
              { rowNumber: 1, content: ["test.jpg", "John"] }
            ]
          }
        };

        expect(detectEntityType(spreadsheet, 0)).toBe("material-sample");
        expect(detectEntityType(spreadsheet, 1)).toBe("metadata");
      });
    });
  });
});
