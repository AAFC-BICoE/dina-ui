import { getColumnHeaders } from "../workbookMappingUtils";

describe("workbookMappingUtils functions", () => {
  describe("getColumnHeaders", () => {
    test("Basic spreadsheet provided, returns the array of the first column", async () => {
      expect(
        getColumnHeaders([
          {
            rowNumber: 0,
            content: ["header1", "header2", "header3"],
            id: 0
          },
          {
            rowNumber: 1,
            content: ["data1", "data2", "data3"],
            id: 1
          },
          {
            rowNumber: 2,
            content: ["data4", "data5", "data6"],
            id: 2
          }
        ])
      ).toEqual(["header1", "header2", "header3"]);
    });

    test("Blank first row, use next row as headers", async () => {
      expect(
        getColumnHeaders([
          {
            rowNumber: 0,
            content: [],
            id: 0
          },
          {
            rowNumber: 1,
            content: ["header1", "header2", "header3"],
            id: 1
          },
          {
            rowNumber: 2,
            content: ["data1", "data2", "data3"],
            id: 2
          }
        ])
      ).toEqual(["header1", "header2", "header3"]);
    });

    test("Return null if not a valid spreadsheet.", async () => {
      expect(
        getColumnHeaders([
          {
            rowNumber: 0,
            content: [],
            id: 0
          }
        ])
      ).toBeNull();
    });
  });
});
